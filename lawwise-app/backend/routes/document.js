const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

// Multer configuration for document storage (Memory storage for DB)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX, Images and TXT are allowed.'));
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

        const { title, category, folderId } = req.body;
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
            fileData: req.file.buffer,
            contentType: req.file.mimetype,
            folderId: folderId || undefined
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

// @route   GET /api/documents/view/:id
// @desc    View document content from DB
// @access  Private
router.get('/view/:id', auth, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document || !document.fileData) {
            return res.status(404).json({ error: 'Document or file data not found' });
        }

        res.set('Content-Type', document.contentType);
        res.send(document.fileData);
    } catch (error) {
        console.error('File view error:', error);
        res.status(500).json({ error: 'Error viewing file' });
    }
});

// @route   GET /api/documents/download/:id
// @desc    Download document from DB
// @access  Private
router.get('/download/:id', auth, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document || !document.fileData) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.set('Content-Type', document.contentType);
        res.set('Content-Disposition', `attachment; filename="${document.fileName}"`);
        res.send(document.fileData);
    } catch (error) {
        console.error('File download error:', error);
        res.status(500).json({ error: 'Error downloading file' });
    }
});

// @route   DELETE /api/documents/:id
// @desc    Delete a personal document
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

router.delete('/:id', auth, async (req, res) => {
    try {
        const lawyerId = req.lawyer._id;
        const document = await Document.findOne({ _id: req.params.id, lawyerId });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Only delete from disk if filePath exists (backward compatibility)
        if (document.filePath) {
            const absolutePath = path.join(__dirname, '..', document.filePath);
            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
            }
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
