
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Lawyer = require('../models/Lawyer');

// Create a generic notification (reminder, case update, etc.)
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

// Get all notifications for a lawyer
router.get('/', async (req, res) => {
    try {
        const { lawyerId } = req.query;
        if (!lawyerId) return res.json({ success: true, notifications: [] });
        // Return all notification types for the lawyer
        const notifications = await Notification.find({ toLawyerId: lawyerId }).sort({ createdAt: -1 });
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
        // Notify the sender about the response
        // Get lawyer name for message
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
router.get('/connections', async (req, res) => {
    try {
        const { lawyerId } = req.query;
        if (!lawyerId) return res.json({ success: true, connections: [] });
        // Find all accepted connection requests from notifications and reminders
        const accepted = await Notification.find({
            $or: [
                { type: 'connection_request', status: 'accepted', $or: [ { fromLawyerId: lawyerId }, { toLawyerId: lawyerId } ] },
                { type: 'reminder', status: 'accepted', $or: [ { fromLawyerId: lawyerId }, { toLawyerId: lawyerId } ] }
            ]
        });
        // Get the other lawyer's info for each connection
        const connections = await Promise.all(accepted.map(async (n) => {
            let otherLawyerId = n.fromLawyerId.toString() === lawyerId ? n.toLawyerId : n.fromLawyerId;
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

module.exports = router;
