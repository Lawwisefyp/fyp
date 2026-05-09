const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Connection = require('../models/Connection');
const Client = require('../models/Client');
const Lawyer = require('../models/Lawyer');
const { createNotification } = require('./notification');

// @route   POST /api/connections/request
// @desc    Client sends a connection request to a lawyer
// @access  Client only
router.post('/request', auth, async (req, res) => {
    try {
        console.log('--- Connection Request Start ---');
        if (!req.user) {
            console.error('No user found on request object');
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }

        if (req.role !== 'client') {
            return res.status(403).json({ success: false, error: 'Only clients can initiate connection requests' });
        }

        const { lawyerId } = req.body;
        const clientId = req.user._id;

        console.log(`From Client: ${req.user.fullName} (${clientId})`);
        console.log(`To Lawyer ID: ${lawyerId}`);

        // Check if connection already exists
        let connection = await Connection.findOne({ client: clientId, lawyer: lawyerId });
        if (connection) {
            console.warn('Connection/Request already exists');
            return res.status(400).json({ success: false, error: 'Request already exists or connection established' });
        }

        connection = new Connection({
            client: clientId,
            lawyer: lawyerId,
            status: 'pending'
        });

        await connection.save();
        console.log('Connection record saved. Creating notification...');

        // Create notification for lawyer
        const notifResult = await createNotification({
            recipient: lawyerId,
            recipientModel: 'Lawyer',
            type: 'connection_request',
            title: 'New Connection Request',
            message: `${req.user.fullName || 'A client'} wants to connect with you.`,
            relatedId: connection._id,
            onModel: 'Connection'
        });

        if (!notifResult) {
            console.warn('Notification creation failed, but connection was saved.');
        } else {
            console.log('Notification created successfully.');
        }

        res.json({ success: true, message: 'Connection request sent successfully' });
    } catch (error) {
        console.error('Connection request error details:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
});

// @route   GET /api/connections/pending
// @desc    Lawyer views pending connection requests
// @access  Lawyer only
router.get('/pending', auth, async (req, res) => {
    try {
        if (req.role !== 'lawyer') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const requests = await Connection.find({ lawyer: req.user._id, status: 'pending' })
            .populate('client', 'fullName email')
            .sort({ createdAt: -1 });

        res.json({ success: true, requests });
    } catch (error) {
        console.error('Fetch pending requests error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// @route   POST /api/connections/respond
// @desc    Lawyer responds to connection request
// @access  Lawyer only
router.post('/respond', auth, async (req, res) => {
    try {
        if (req.role !== 'lawyer') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const { requestId, status } = req.body; // status: 'accepted' or 'rejected'
        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        const connection = await Connection.findOne({ _id: requestId, lawyer: req.user._id });
        if (!connection) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }

        connection.status = status;
        connection.updatedAt = Date.now();
        await connection.save();

        // Mark the notification as accepted/rejected as well
        const Notification = require('../models/Notification');
        await Notification.findOneAndUpdate(
            { relatedId: requestId, toLawyerId: req.user._id, type: 'connection_request' },
            { status: status }
        );

        // Create notification for client
        await createNotification({
            recipient: connection.client,
            recipientModel: 'Client',
            type: status, // 'accepted' or 'rejected'
            title: 'Connection Update',
            message: `Lawyer ${req.user.fullName} has ${status} your connection request.`,
            relatedId: connection._id,
            onModel: 'Connection'
        });

        res.json({ success: true, message: `Request ${status} successfully` });
    } catch (error) {
        console.error('Respond to request error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// @route   GET /api/connections/my-clients
// @desc    Lawyer views their connected clients
// @access  Lawyer only
router.get('/my-clients', auth, async (req, res) => {
    try {
        if (req.role !== 'lawyer') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const connections = await Connection.find({ lawyer: req.user._id, status: 'accepted' })
            .populate('client', 'fullName email profilePicture')
            .sort({ updatedAt: -1 });

        const clients = connections.map(c => ({
            id: c.client._id,
            fullName: c.client.fullName,
            email: c.client.email,
            profilePicture: c.client.profilePicture,
            connectedAt: c.updatedAt
        }));

        res.json({ success: true, clients });
    } catch (error) {
        console.error('Fetch my clients error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// @route   GET /api/connections/status/:lawyerId
// @desc    Get connection status with a specific lawyer
// @access  Client only
router.get('/status/:lawyerId', auth, async (req, res) => {
    try {
        const connection = await Connection.findOne({ 
            client: req.user._id, 
            lawyer: req.params.lawyerId 
        });

        if (!connection) {
            return res.json({ success: true, status: 'none' });
        }

        res.json({ success: true, status: connection.status });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
