
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Lawyer = require('../models/Lawyer');
const Case = require('../models/Case');
const auth = require('../middleware/auth');

// Reusable helper to sync notifications for a specific lawyer
const syncUserNotifications = async (lawyerId) => {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Check for hearings (Today, 1, 2, or 3 days away)
    const hearingOffsets = [0, 1, 2, 3];
    const hLabels = { 0: 'TODAY', 1: 'TOMORROW', 2: 'IN 2 DAYS', 3: 'IN 3 DAYS' };

    for (const offset of hearingOffsets) {
        const hDate = new Date();
        hDate.setDate(hDate.getDate() + offset);
        const hDateStr = hDate.toISOString().split('T')[0];

        const casesWithHearings = await Case.find({
            lawyerId: lawyerId,
            nextHearingDate: hDateStr
        });

        for (const caseData of casesWithHearings) {
            const existing = await Notification.findOne({
                toLawyerId: lawyerId,
                type: 'hearing_reminder',
                message: { $regex: caseData.title },
                title: { $regex: hLabels[offset] }
            });

            if (!existing) {
                await Notification.create({
                    toLawyerId: lawyerId,
                    caseId: caseData.id,
                    title: `⚖️ HEARING ${hLabels[offset]}`,
                    message: `You have a scheduled hearing ${hLabels[offset].toLowerCase()} for case: "${caseData.title}" in ${caseData.court}.`,
                    type: 'hearing_reminder',
                    status: 'unread'
                });
            }
        }
    }

    // 2. Check for upcoming deadlines (due today, 1, 2, or 3 days away)
    const dayOffsets = [0, 1, 2, 3];
    const offsetLabels = { 0: 'TODAY', 1: 'TOMORROW', 2: 'IN 2 DAYS', 3: 'IN 3 DAYS' };

    for (const offset of dayOffsets) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + offset);
        const targetDateStr = targetDate.toISOString().split('T')[0];

        const casesWithDeadlines = await Case.find({
            lawyerId: lawyerId,
            'deadlines.dueDate': targetDateStr
        });

        for (const caseData of casesWithDeadlines) {
            const targetDeadlines = caseData.deadlines.filter(d => d.dueDate === targetDateStr && !d.isCompleted);
            for (const d of targetDeadlines) {
                const existingNotif = await Notification.findOne({
                    toLawyerId: lawyerId,
                    caseId: caseData.id,
                    reminderId: d._id.toString(),
                    title: { $regex: offsetLabels[offset] }
                });

                if (!existingNotif) {
                    await Notification.create({
                        toLawyerId: lawyerId,
                        caseId: caseData.id,
                        reminderId: d._id.toString(),
                        title: `⏰ DEADLINE ${offsetLabels[offset]}`,
                        message: `The deadline "${d.title}" for case "${caseData.title}" is ${offsetLabels[offset].toLowerCase()}.`,
                        type: 'deadline',
                        status: 'unread'
                    });
                }
            }
        }
    }
};

// Sync/Generate notifications for today's hearings and deadlines
router.get('/sync', auth, async (req, res) => {
    try {
        await syncUserNotifications(req.user._id);
        res.json({ success: true, message: 'Notifications synced' });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ success: false, error: 'Server error during sync' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { lawyerId, type, message, caseId, status } = req.body;
        if (!lawyerId || !type || !message) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        const notification = new Notification({
            toLawyerId: lawyerId,
            type,
            message,
            caseId,
            status: status || 'pending'
        });
        await notification.save();
        res.json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error creating notification' });
    }
});

// Send a connection request notification
router.post('/send', async (req, res) => {
    try {
        const { fromLawyerId, toLawyerId, message } = req.body;
        if (!fromLawyerId || !toLawyerId || !message) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        // Get lawyer name for notification
        const fromLawyer = await Lawyer.findById(fromLawyerId);
        const fromLawyerName = fromLawyer ? (fromLawyer.fullName || (fromLawyer.personalInfo?.firstName + ' ' + fromLawyer.personalInfo?.lastName)) : 'Lawyer';
        const notification = new Notification({
            fromLawyerId,
            toLawyerId,
            fromLawyerName,
            message,
            type: 'connection_request',
            status: 'pending'
        });
        await notification.save();
        res.json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error sending notification' });
    }
});

// New simplified connection endpoint for both lawyers and clients
router.post('/connect', auth, async (req, res) => {
    try {
        const { targetLawyerId, message } = req.body;
        const senderId = req.user._id;
        const senderRole = req.role; // Attached by auth middleware

        if (!targetLawyerId) {
            return res.status(400).json({ success: false, error: 'Target lawyer ID is required' });
        }

        // Prevent self-connection (only if sender is a lawyer trying to connect to themselves)
        if (senderRole === 'lawyer' && senderId.toString() === targetLawyerId.toString()) {
            return res.status(400).json({ success: false, error: 'You cannot connect with yourself' });
        }

        // Check for existing pending request
        const query = {
            toLawyerId: targetLawyerId,
            status: 'pending',
            type: 'connection_request'
        };

        if (senderRole === 'lawyer') {
            query.fromLawyerId = senderId;
        } else {
            query.fromClientId = senderId;
        }

        const existingRequest = await Notification.findOne(query);
        if (existingRequest) {
            return res.status(400).json({ success: false, error: 'Connection request already pending' });
        }

        // Create notification
        const notificationData = {
            toLawyerId: targetLawyerId,
            message: message || `New connection request from ${req.user.fullName}`,
            type: 'connection_request',
            status: 'pending'
        };

        if (senderRole === 'lawyer') {
            notificationData.fromLawyerId = senderId;
            notificationData.fromLawyerName = req.user.fullName;
        } else {
            notificationData.fromClientId = senderId;
            notificationData.fromClientName = req.user.fullName;
        }

        const notification = new Notification(notificationData);
        await notification.save();

        res.json({ success: true, message: 'Connection request sent', notification });
    } catch (error) {
        console.error('Connect error:', error);
        res.status(500).json({ success: false, error: 'Server error sending connection request' });
    }
});

// Get unread notification count
router.get('/unread-count', auth, async (req, res) => {
    try {
        const query = req.role === 'lawyer' 
            ? { toLawyerId: req.user._id, status: { $in: ['unread', 'pending'] } } 
            : { toClientId: req.user._id, status: { $in: ['unread', 'pending'] } };

        const count = await Notification.countDocuments(query);
        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mark all notifications as read for current user
router.put('/read-all', auth, async (req, res) => {
    try {
        const query = req.role === 'lawyer' 
            ? { toLawyerId: req.user._id, status: 'unread' } 
            : { toClientId: req.user._id, status: 'unread' };

        await Notification.updateMany(
            query,
            { $set: { status: 'read' } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Utility function to create notifications
const createNotification = async (data) => {
    try {
        const { recipient, recipientModel, type, title, message, relatedId, onModel, status } = data;
        
        const notificationData = {
            title,
            message,
            type,
            relatedId,
            onModel,
            status: status || (type === 'connection_request' ? 'pending' : 'unread'),
            createdAt: Date.now()
        };

        if (recipientModel === 'Lawyer') {
            notificationData.toLawyerId = recipient;
        } else if (recipientModel === 'Client') {
            notificationData.toClientId = recipient;
        }

        const notification = new Notification(notificationData);
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

// Get all notifications for current user (Lawyer or Client)
router.get('/', auth, async (req, res) => {
    try {
        const query = req.role === 'lawyer' 
            ? { toLawyerId: req.user._id } 
            : { toClientId: req.user._id };
            
        const notifications = await Notification.find(query).sort({ createdAt: -1 });
        res.json({ success: true, notifications });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error fetching notifications' });
    }
});

// Respond to a connection request
router.post('/respond', async (req, res) => {
    try {
        const { notificationId, response } = req.body;
        if (!notificationId || !['accepted', 'rejected'].includes(response)) {
            return res.status(400).json({ success: false, error: 'Invalid request' });
        }
        const notification = await Notification.findById(notificationId);
        if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' });
        notification.status = response;
        await notification.save();

        // If accepted, establish the link in the Lawyer model
        if (response === 'accepted' && notification.type === 'connection_request') {
            if (notification.fromLawyerId && notification.toLawyerId) {
                // Add to both lawyers' connections using $addToSet to avoid duplicates
                await Promise.all([
                    Lawyer.findByIdAndUpdate(notification.fromLawyerId, {
                        $addToSet: { connections: notification.toLawyerId }
                    }),
                    Lawyer.findByIdAndUpdate(notification.toLawyerId, {
                        $addToSet: { connections: notification.fromLawyerId }
                    })
                ]);
                console.log(`🔗 Established connection between ${notification.fromLawyerId} and ${notification.toLawyerId}`);
            }
        }

        // Notify the sender about the response
        const toLawyer = await Lawyer.findById(notification.toLawyerId);
        const toLawyerName = toLawyer ? (toLawyer.fullName || (toLawyer.personalInfo?.firstName + ' ' + toLawyer.personalInfo?.lastName)) : 'Lawyer';
        const responseMessage = `Your connection request was ${response} by ${toLawyerName}.`;

        await Notification.create({
            fromLawyerId: notification.toLawyerId,
            toLawyerId: notification.fromLawyerId,
            fromLawyerName: toLawyerName,
            message: responseMessage,
            type: 'connection_request',
            status: response
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error responding to notification' });
    }
});

// Get accepted connections for a lawyer from notifications and reminders
router.get('/connections', auth, async (req, res) => {
    try {
        const lawyerId = req.user._id;
        // Find all accepted connection requests from notifications and reminders
        const accepted = await Notification.find({
            $or: [
                { type: 'connection_request', status: 'accepted', $or: [{ fromLawyerId: lawyerId }, { toLawyerId: lawyerId }] },
                { type: 'reminder', status: 'accepted', $or: [{ fromLawyerId: lawyerId }, { toLawyerId: lawyerId }] }
            ]
        });
        // Get the other lawyer's info for each connection
        const connections = await Promise.all(accepted.map(async (n) => {
            let otherLawyerId = n.fromLawyerId?.toString() === lawyerId.toString() ? n.toLawyerId : n.fromLawyerId;
            const lawyer = await Lawyer.findById(otherLawyerId);
            return {
                name: lawyer ? (lawyer.fullName || (lawyer.personalInfo?.firstName + ' ' + lawyer.personalInfo?.lastName)) : 'Lawyer',
                specialization: lawyer ? (lawyer.professionalInfo?.specialization || '') : ''
            };
        }));
        res.json({ success: true, connections });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error fetching connections' });
    }
});

// Delete a specific notification
router.delete('/:id', auth, async (req, res) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, toLawyerId: req.user._id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = {
    router,
    syncUserNotifications,
    createNotification
};
