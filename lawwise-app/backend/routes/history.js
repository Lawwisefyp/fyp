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
                // notes are not updated here unless they are new, 
                // but usually notes are added after watching
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

// @route   PUT /api/history/:id/notes
// @desc    Update notes for a video
// @access  Private (Lawyer)
router.put('/:id/notes', auth, async (req, res) => {
    try {
        const { notes } = req.body;
        const lawyerId = req.lawyer._id;

        const historyItem = await History.findOneAndUpdate(
            { _id: req.params.id, lawyerId },
            { notes },
            { new: true }
        );

        if (!historyItem) {
            return res.status(404).json({ error: 'History item not found' });
        }

        res.json({
            success: true,
            historyItem
        });
    } catch (error) {
        console.error('Notes update error:', error);
        res.status(500).json({ error: 'Server error updating notes' });
    }
});

// @route   POST /api/history/ai-summary
// @desc    Generate AI summary for a video
// @access  Private (Lawyer)
router.post('/ai-summary', auth, async (req, res) => {
    try {
        const { title, description, channelName } = req.body;
        const { generateVideoSummary } = require('../services/aiService');

        const summary = await generateVideoSummary(title, description, channelName);

        res.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error('AI Summary error:', error);
        res.status(500).json({ error: 'Failed to generate AI summary: ' + error.message });
    }
});

module.exports = router;
