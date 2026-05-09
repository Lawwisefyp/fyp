const express = require('express');
const router = express.Router();
const Folder = require('../models/Folder');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

// Get all folders for a lawyer
router.get('/', auth, async (req, res) => {
    try {
        const folders = await Folder.find({ owner: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, folders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create a new folder
router.post('/', auth, async (req, res) => {
    try {
        const { name } = req.body;
        const folder = new Folder({
            name,
            owner: req.user._id
        });
        await folder.save();
        res.status(201).json({ success: true, folder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete a folder
router.delete('/:id', auth, async (req, res) => {
    try {
        await Folder.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        // Optionally delete or unassign documents in this folder
        await Document.updateMany({ folderId: req.params.id }, { $unset: { folderId: "" } });
        res.json({ success: true, message: 'Folder deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
