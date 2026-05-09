const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Lawyer = require('../models/Lawyer');
const Client = require('../models/Client');
const Case = require('../models/Case');
const Connection = require('../models/Connection');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');
const upload = require('../middleware/upload');

// =============================================
// POST / — Send a new message (Supports text & file)
// =============================================
router.post('/', [auth, upload.single('chatAttachment')], async (req, res) => {
    try {
        const { receiverId, content, receiverModel } = req.body;
        const senderId = req.user._id;

        let senderModel;
        if (req.role === 'lawyer') senderModel = 'Lawyer';
        else if (req.role === 'student') senderModel = 'Student';
        else senderModel = 'Client';

        if (!receiverId || !receiverModel) {
            return res.status(400).json({ success: false, error: 'receiverId and receiverModel are required' });
        }

        const messageData = {
            senderId,
            senderModel,
            receiverId,
            receiverModel,
            content: content || '',
            isDelivered: false,
            isRead: false
        };

        // If file is uploaded
        if (req.file) {
            messageData.attachment = {
                fileUrl: req.file.path,
                fileName: req.file.originalname,
                fileType: req.file.mimetype,
                fileSize: req.file.size
            };
        } else if (!content) {
            return res.status(400).json({ success: false, error: 'Message content or file is required' });
        }

        const message = new Message({
            ...messageData
        });

        await message.save();
        res.json({ success: true, message: 'Message sent', data: message });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, error: 'Failed to send message' });
    }
});

// Legacy route — keep for backward compat
router.post('/send', auth, async (req, res) => {
    req.body.receiverModel = req.body.receiverModel || req.body.receiverType;
    const { receiverId, content, receiverModel } = req.body;
    const senderId = req.user._id;

    let senderModel;
    if (req.role === 'lawyer') senderModel = 'Lawyer';
    else if (req.role === 'student') senderModel = 'Student';
    else senderModel = 'Client';

    try {
        const message = new Message({ senderId, senderModel, receiverId, receiverModel, content });
        await message.save();
        res.json({ success: true, data: message });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to send message' });
    }
});

// =============================================
// POST /send-email — Send an official email
// =============================================
router.post('/send-email', auth, async (req, res) => {
    try {
        const { to, subject, content } = req.body;
        const senderName = req.user.fullName || 'A Lawwise Professional';

        if (!to || !subject || !content) {
            return res.status(400).json({ success: false, error: 'Recipient, subject, and content are required' });
        }

        const htmlContent = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                <div style="text-align: center; margin-bottom: 25px;">
                    <h1 style="color: #1e293b; margin: 0; font-size: 24px;">Lawwise Official Communication</h1>
                </div>
                <div style="padding: 20px; background: #f8fafc; border-radius: 8px; margin-bottom: 25px;">
                    <p style="margin: 0; font-size: 16px; color: #475569; line-height: 1.6;">${content.replace(/\n/g, '<br>')}</p>
                </div>
                <div style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
                    <p style="margin: 0; font-size: 14px; color: #64748b;">Best regards,</p>
                    <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #1e293b;">${senderName}</p>
                    <p style="margin: 0; font-size: 13px; color: #94a3b8;">Lawwise Legal Portal</p>
                </div>
            </div>
        `;

        const result = await sendEmail(to, subject, htmlContent);

        if (result.success) {
            res.json({ success: true, message: 'Official email sent successfully' });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Send official email error:', error);
        res.status(500).json({ success: false, error: 'Failed to send official email' });
    }
});

// =============================================
// GET /?userId=<otherId> — Get chat history
// Marks incoming messages as "delivered" upon fetch
// =============================================
router.get('/', auth, async (req, res) => {
    try {
        const { userId: otherId } = req.query;
        const currentUserId = req.user._id;

        if (!otherId) {
            return res.status(400).json({ success: false, error: 'userId query param required' });
        }

        const messages = await Message.find({
            $or: [
                { senderId: currentUserId, receiverId: otherId },
                { senderId: otherId, receiverId: currentUserId }
            ]
        }).sort({ createdAt: 1 });

        // Mark all messages sent by the other person as DELIVERED
        // (they've been fetched by the receiver's device)
        await Message.updateMany(
            { senderId: otherId, receiverId: currentUserId, isDelivered: false },
            { $set: { isDelivered: true } }
        );

        res.json({ success: true, messages });
    } catch (error) {
        console.error('Fetch chat error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch messages' });
    }
});

// =============================================
// PATCH /mark-read/:otherId — Mark messages as READ (blue tick)
// Called when the receiver actively opens/focuses the conversation
// =============================================
router.patch('/mark-read/:otherId', auth, async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { otherId } = req.params;

        const result = await Message.updateMany(
            {
                senderId: otherId,
                receiverId: currentUserId,
                isRead: false
            },
            { $set: { isRead: true, isDelivered: true } }
        );

        res.json({ success: true, updated: result.modifiedCount });
    } catch (error) {
        console.error('Mark-read error:', error);
        res.status(500).json({ success: false, error: 'Failed to mark messages as read' });
    }
});

// =============================================
// GET /status/:otherId — Get delivery/read status of sent messages
// Used for polling tick updates without fetching full message bodies
// =============================================
router.get('/status/:otherId', auth, async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { otherId } = req.params;

        const messages = await Message.find({
            senderId: currentUserId,
            receiverId: otherId
        }, '_id isDelivered isRead createdAt').sort({ createdAt: -1 }).limit(50);

        res.json({ success: true, statuses: messages });
    } catch (error) {
        console.error('Status fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch statuses' });
    }
});

// =============================================
// GET /chat/:otherId — Legacy route kept for compatibility
// =============================================
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

        await Message.updateMany(
            { senderId: otherId, receiverId: currentUserId, isDelivered: false },
            { $set: { isDelivered: true } }
        );

        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch messages' });
    }
});

// =============================================
// GET /contacts — Contacts list with last message + delivery info
// =============================================
router.get('/contacts', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.role;
        let contacts = [];

        if (userRole === 'lawyer') {
            // Clients from accepted connection requests
            const connections = await Connection.find({
                lawyer: userId, status: 'accepted'
            }).populate('client', 'fullName email profilePicture');
            
            connections.forEach(c => {
                if (c.client) {
                    contacts.push({ 
                        id: c.client._id, 
                        name: c.client.fullName, 
                        role: 'Client', 
                        email: c.client.email,
                        avatar: c.client.profilePicture
                    });
                }
            });

            // Keep clients from cases for backward compatibility
            const cases = await Case.find({ lawyerId: userId });
            const clientEmails = [...new Set(cases.map(c => c.clientEmail))];
            const clients = await Client.find({ email: { $in: clientEmails } }, 'fullName email');
            clients.forEach(c => {
                if (!contacts.find(contact => contact.email === c.email)) {
                    contacts.push({ id: c._id, name: c.fullName, role: 'Client', email: c.email });
                }
            });

        } else if (userRole === 'client') {
            // Lawyers from accepted connection requests
            const connections = await Connection.find({
                client: userId, status: 'accepted'
            }).populate('lawyer', 'fullName email professionalInfo personalInfo');
            
            connections.forEach(c => {
                if (c.lawyer) {
                    contacts.push({
                        id: c.lawyer._id,
                        name: c.lawyer.fullName,
                        role: 'Lawyer',
                        specialization: c.lawyer.professionalInfo?.specialization || 'Advocate',
                        avatar: c.lawyer.personalInfo?.profilePicture,
                        email: c.lawyer.email
                    });
                }
            });

            // Keep lawyers from cases
            const cases = await Case.find({ clientEmail: req.user.email }).populate('lawyerId', 'fullName email personalInfo professionalInfo');
            cases.forEach(c => {
                if (c.lawyerId && !contacts.find(contact => contact.id?.toString() === c.lawyerId._id.toString())) {
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
        }

        // Discover anyone from message history not yet in contacts
        const messageHistory = await Message.find({ $or: [{ senderId: userId }, { receiverId: userId }] });
        const messagedIds = {};
        messageHistory.forEach(msg => {
            if (msg.senderId.toString() !== userId.toString()) messagedIds[msg.senderId.toString()] = msg.senderModel;
            if (msg.receiverId.toString() !== userId.toString()) messagedIds[msg.receiverId.toString()] = msg.receiverModel;
        });
        for (const [otherId, model] of Object.entries(messagedIds)) {
            if (!contacts.find(c => c.id?.toString() === otherId)) {
                const otherUser = model === 'Lawyer' ? await Lawyer.findById(otherId) : await Client.findById(otherId);
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

        // Attach last message + delivery info
        const contactsWithMeta = await Promise.all(contacts.map(async (contact) => {
            const lastMsg = await Message.findOne({
                $or: [
                    { senderId: userId, receiverId: contact.id },
                    { senderId: contact.id, receiverId: userId }
                ]
            }).sort({ createdAt: -1 });

            // Count unread messages from this contact
            const unreadCount = await Message.countDocuments({
                senderId: contact.id,
                receiverId: userId,
                isRead: false
            });

            return {
                ...contact,
                unreadCount,
                lastMessage: lastMsg ? {
                    content: lastMsg.content,
                    createdAt: lastMsg.createdAt,
                    isSender: lastMsg.senderId.toString() === userId.toString(),
                    isDelivered: lastMsg.isDelivered,
                    isRead: lastMsg.isRead
                } : null
            };
        }));

        contactsWithMeta.sort((a, b) => {
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });

        res.json({ success: true, contacts: contactsWithMeta });
    } catch (error) {
        console.error('Fetch contacts error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch contacts' });
    }
});

module.exports = router;
