const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Lawyer = require('../models/Lawyer');
const Client = require('../models/Client');
const Case = require('../models/Case');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Send Message
router.post('/send', auth, async (req, res) => {
    try {
        const { receiverId, content, receiverType } = req.body;
        const senderId = req.user._id;
        const senderType = req.role === 'lawyer' ? 'Lawyer' : 'Client';

        if (!receiverType) {
            return res.status(400).json({ success: false, error: 'Recipient type is required' });
        }

        const message = new Message({
            senderId,
            senderModel: senderType,
            receiverId,
            receiverModel: receiverType,
            content
        });

        await message.save();
        res.json({ success: true, message: 'Message sent', data: message });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, error: 'Failed to send message' });
    }
});

// Get Chat History (Generic for both roles)
router.get('/chat/:otherId', auth, async (req, res) => {
    try {
        const { otherId } = req.params;
        const currentUserId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: currentUserId, receiverId: otherId },
                { senderId: otherId, receiverId: currentUserId }
            ]
        }).sort({ createdAt: 1 });

        // Mark messages as read
        await Message.updateMany(
            { senderId: otherId, receiverId: currentUserId, isRead: false },
            { isRead: true }
        );

        res.json({ success: true, messages });
    } catch (error) {
        console.error('Fetch chat error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch messages' });
    }
});

// Get Contacts (Lawyers or Clients you are connected to)
router.get('/contacts', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.role;
        console.log(`--- Fetching contacts for ${userRole} ${userId} ---`);
        let contacts = [];

        if (userRole === 'lawyer') {
            // 1. Get connected lawyers
            const lawyer = await Lawyer.findById(userId).populate('connections', 'fullName email personalInfo.profilePicture professionalInfo.specialization');
            if (lawyer.connections) {
                contacts = lawyer.connections.map(c => ({
                    id: c._id,
                    name: c.fullName,
                    role: 'Lawyer',
                    specialization: c.personalInfo?.specialization || 'Advocate',
                    avatar: c.personalInfo?.profilePicture,
                    email: c.email
                }));
            }

            // 2. Get clients from assigned cases
            const cases = await Case.find({ lawyerId: userId });
            const clientEmails = [...new Set(cases.map(c => c.clientEmail))];
            const clients = await Client.find({ email: { $in: clientEmails } }, 'fullName email');

            clients.forEach(c => {
                if (!contacts.find(contact => contact.email === c.email)) {
                    contacts.push({
                        id: c._id,
                        name: c.fullName,
                        role: 'Client',
                        email: c.email
                    });
                }
            });

            // 3. NEW: Get clients from accepted connection requests
            const acceptedRequests = await Notification.find({
                toLawyerId: userId,
                type: 'connection_request',
                status: 'accepted'
            }).populate('fromClientId', 'fullName email');

            acceptedRequests.forEach(req => {
                if (req.fromClientId && !contacts.find(c => c.id.toString() === req.fromClientId._id.toString())) {
                    contacts.push({
                        id: req.fromClientId._id,
                        name: req.fromClientId.fullName,
                        role: 'Client',
                        email: req.fromClientId.email
                    });
                }
            });
        } else {
            // Current user is a client
            // Get lawyers from assigned cases
            const cases = await Case.find({ clientEmail: req.user.email }).populate('lawyerId', 'fullName email personalInfo.profilePicture professionalInfo.specialization');

            cases.forEach(c => {
                if (c.lawyerId && !contacts.find(contact => contact.id.toString() === c.lawyerId._id.toString())) {
                    contacts.push({
                        id: c.lawyerId._id,
                        name: c.lawyerId.fullName,
                        role: 'Lawyer',
                        specialization: c.lawyerId.professionalInfo?.specialization || 'Advocate',
                        avatar: c.lawyerId.personalInfo?.profilePicture,
                        email: c.lawyerId.email
                    });
                }
            });

            // 2. NEW: Get lawyers from accepted connection requests
            const acceptedRequests = await Notification.find({
                fromClientId: userId,
                type: 'connection_request',
                status: 'accepted'
            }).populate('toLawyerId', 'fullName email personalInfo.profilePicture professionalInfo.specialization');

            acceptedRequests.forEach(req => {
                if (req.toLawyerId && !contacts.find(c => c.id.toString() === req.toLawyerId._id.toString())) {
                    contacts.push({
                        id: req.toLawyerId._id,
                        name: req.toLawyerId.fullName,
                        role: 'Lawyer',
                        specialization: req.toLawyerId.professionalInfo?.specialization || 'Advocate',
                        avatar: req.toLawyerId.personalInfo?.profilePicture,
                        email: req.toLawyerId.email
                    });
                }
            });
        }

        // 3. SECRETE SAUCE: Get anyone else the user has exchanged messages with
        const messageHistory = await Message.find({
            $or: [{ senderId: userId }, { receiverId: userId }]
        });

        const messagedUserIds = new Set();
        const messagedUserModels = {};

        messageHistory.forEach(msg => {
            if (msg.senderId.toString() !== userId.toString()) {
                messagedUserIds.add(msg.senderId.toString());
                messagedUserModels[msg.senderId.toString()] = msg.senderModel;
            }
            if (msg.receiverId.toString() !== userId.toString()) {
                messagedUserIds.add(msg.receiverId.toString());
                messagedUserModels[msg.receiverId.toString()] = msg.receiverModel;
            }
        });

        for (const otherId of messagedUserIds) {
            if (!contacts.find(c => c.id.toString() === otherId)) {
                const model = messagedUserModels[otherId];
                let otherUser;
                if (model === 'Lawyer') {
                    otherUser = await Lawyer.findById(otherId);
                } else {
                    otherUser = await Client.findById(otherId);
                }

                if (otherUser) {
                    contacts.push({
                        id: otherUser._id,
                        name: otherUser.fullName,
                        role: model,
                        specialization: model === 'Lawyer' ? (otherUser.professionalInfo?.specialization || 'Advocate') : null,
                        avatar: model === 'Lawyer' ? otherUser.personalInfo?.profilePicture : null,
                        email: otherUser.email
                    });
                }
            }
        }

        // Add last message preview for each contact
        const contactsWithLastMsg = await Promise.all(contacts.map(async (contact) => {
            const lastMsg = await Message.findOne({
                $or: [
                    { senderId: userId, receiverId: contact.id },
                    { senderId: contact.id, receiverId: userId }
                ]
            }).sort({ createdAt: -1 });

            return {
                ...contact,
                lastMessage: lastMsg ? {
                    content: lastMsg.content,
                    createdAt: lastMsg.createdAt,
                    isSender: lastMsg.senderId.toString() === userId.toString(),
                    isRead: lastMsg.isRead
                } : null
            };
        }));

        // Sort by last message date
        contactsWithLastMsg.sort((a, b) => {
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });

        res.json({ success: true, contacts: contactsWithLastMsg });
        console.log(`Returning ${contactsWithLastMsg.length} contacts for chat`);
    } catch (error) {
        console.error('Fetch contacts error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch contacts' });
    }
});

module.exports = router;
