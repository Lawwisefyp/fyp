const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

// Multer configuration for document storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/documents/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX and Images are allowed.'));
        }
    }
});

// @route   POST /api/documents/upload
// @desc    Upload a personal document
// @access  Private (Lawyer)
router.post('/upload', auth, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { title, category } = req.body;
        const lawyerId = req.lawyer._id;

        const formatSize = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const newDocument = new Document({
            lawyerId,
            title: title || req.file.originalname,
            category: category || 'personal',
            fileName: req.file.originalname,
            fileType: path.extname(req.file.originalname).toUpperCase().replace('.', ''),
            fileSize: formatSize(req.file.size),
            filePath: req.file.path.replace(/\\/g, '/')
        });

        await newDocument.save();

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            document: newDocument
        });
    } catch (error) {
        console.error('Document upload error:', error);
        res.status(500).json({ error: error.message || 'Server error uploading document' });
    }
});

// @route   GET /api/documents
// @desc    Get all personal documents for the lawyer
// @access  Private (Lawyer)
router.get('/', auth, async (req, res) => {
    try {
        const lawyerId = req.lawyer._id;
        const documents = await Document.find({ lawyerId }).sort({ uploadedAt: -1 });

        res.json({
            success: true,
            count: documents.length,
            documents
        });
    } catch (error) {
        console.error('Document fetch error:', error);
        res.status(500).json({ error: 'Server error fetching documents' });
    }
});

// @route   DELETE /api/documents/:id
// @desc    Delete a personal document
// @access  Private (Lawyer)
router.delete('/:id', auth, async (req, res) => {
    try {
        const lawyerId = req.lawyer._id;
        const document = await Document.findOne({ _id: req.params.id, lawyerId });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Delete the physical file
        const filePath = path.join(__dirname, '..', document.filePath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await Document.deleteOne({ _id: req.params.id });

        res.json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        console.error('Document delete error:', error);
        res.status(500).json({ error: 'Server error deleting document' });
    }
});

module.exports = router;
