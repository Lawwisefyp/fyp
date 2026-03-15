const express = require('express');
const router = express.Router();
const History = require('../models/History');
const auth = require('../middleware/auth');

// @route   POST /api/history
// @desc    Add a video to history
// @access  Private (Lawyer)
router.post('/', auth, async (req, res) => {
    try {
        const { videoId, title, thumbnail, channelName } = req.body;
        const lawyerId = req.lawyer._id;

        // Use findOneAndUpdate with upsert to avoid duplicate keys and just update watchedAt
        const historyItem = await History.findOneAndUpdate(
            { lawyerId, videoId },
            {
                title,
                thumbnail,
                channelName,
                watchedAt: new Date()
            },
            { upsert: true, new: true }
        );

        res.status(201).json({
            success: true,
            historyItem
        });
    } catch (error) {
        console.error('History save error:', error);
        res.status(500).json({ error: 'Server error saving history' });
    }
});

// @route   GET /api/history
// @desc    Get user's watch history
// @access  Private (Lawyer)
router.get('/', auth, async (req, res) => {
    try {
        const lawyerId = req.lawyer._id;
        const history = await History.find({ lawyerId })
            .sort({ watchedAt: -1 })
            .limit(50); // Limit to last 50 watched videos

        res.json({
            success: true,
            count: history.length,
            history
        });
    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({ error: 'Server error fetching history' });
    }
});

module.exports = router;
