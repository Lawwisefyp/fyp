const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const StudyMaterial = require('../models/StudyMaterial');
const Quiz = require('../models/Quiz');
const SharedNote = require('../models/SharedNote');
const lawCrawler = require('../services/lawCrawler');
const multer = require('multer');
const path = require('path');
const Folder = require('../models/Folder');
const Student = require('../models/Student');
const aiService = require('../services/aiService');

// Configure multer for note uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/notes/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// --- Library Routes ---

// Online Legal Resource Crawling (Pakistani Law & Web Notes)
router.get('/library/search-online', auth, async (req, res) => {
    try {
        const { q, mode } = req.query; // mode can be 'statutes' or 'web'
        let result;

        if (mode === 'web' && q) {
            // Use Gemini for general web/academic search
            result = await lawCrawler.searchWebForNotes(q, {
                university: req.user.university,
                year: req.user.yearOfStudy
            });
        } else {
            // Default to Pakistani law statutes
            result = await lawCrawler.searchOnline(q || '');
        }

        res.json(result);
    } catch (error) {
        console.error('Online search route error:', error);
        res.status(500).json(error);
    }
});

// Get Student Analytics (Real-time tracking)
router.get('/analytics', auth, async (req, res) => {
    try {
        const studentId = req.user._id;

        // Get total uploaded notes
        const notesCount = await SharedNote.countDocuments({ owner: studentId });

        // Get total taken quizzes
        const quizzesCount = await Quiz.countDocuments({ owner: studentId });

        // Get recent notes aggregated by day for the graph (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentNotes = await SharedNote.find({ owner: studentId, createdAt: { $gte: sevenDaysAgo } });
        const recentQuizzes = await Quiz.find({ owner: studentId, createdAt: { $gte: sevenDaysAgo } });

        // Generate date map
        const activityMap = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            activityMap[d.toISOString().split('T')[0]] = 0;
        }

        recentNotes.forEach(note => {
            const dateStr = note.createdAt.toISOString().split('T')[0];
            if (activityMap[dateStr] !== undefined) activityMap[dateStr] += 1;
        });

        recentQuizzes.forEach(quiz => {
            const dateStr = quiz.createdAt.toISOString().split('T')[0];
            if (activityMap[dateStr] !== undefined) activityMap[dateStr] += 1;
        });

        const activityGraph = Object.keys(activityMap).map(date => ({
            date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            count: activityMap[date]
        }));

        res.json({
            success: true,
            analytics: {
                notesCount,
                quizzesCount,
                activityGraph
            }
        });
    } catch (error) {
        console.error('Analytics route error:', error);
        res.status(500).json({ error: 'Server error fetching analytics' });
    }
});


// Save a document to student's personal library
router.post('/library/save', auth, async (req, res) => {
    try {
        const { title, fileUrl, description, source, category } = req.body;
        const Student = require('../models/Student');
        const student = await Student.findById(req.user._id);

        if (!student) return res.status(404).json({ error: 'Student not found' });

        // Check if already saved
        const isAlreadySaved = student.savedLibrary.some(doc => doc.fileUrl === fileUrl);
        if (isAlreadySaved) {
            return res.status(400).json({ error: 'Document already saved in your library' });
        }

        student.savedLibrary.push({ title, fileUrl, description, source, category });
        await student.save();

        res.json({ success: true, message: 'Saved to your library', library: student.savedLibrary });
    } catch (error) {
        console.error('Save to library error:', error);
        res.status(500).json({ error: 'Server error saving to library' });
    }
});

// Get student's saved library
router.get('/library/saved', auth, async (req, res) => {
    try {
        const Student = require('../models/Student');
        const student = await Student.findById(req.user._id);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        res.json({ success: true, savedLibrary: student.savedLibrary });
    } catch (error) {
        console.error('Fetch saved library error:', error);
        res.status(500).json({ error: 'Server error fetching saved library' });
    }
});

// Remove from saved library
router.delete('/library/saved/:id', auth, async (req, res) => {
    try {
        const Student = require('../models/Student');
        const student = await Student.findById(req.user._id);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        student.savedLibrary = student.savedLibrary.filter(doc => doc._id.toString() !== req.params.id);
        await student.save();

        res.json({ success: true, message: 'Removed from your library', library: student.savedLibrary });
    } catch (error) {
        console.error('Delete from library error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all study materials
router.get('/library', auth, async (req, res) => {
    try {
        const { category, subject } = req.query;
        let query = {};
        if (category) query.category = category;
        if (subject) query.subjectTag = subject;

        const materials = await StudyMaterial.find(query).sort({ createdAt: -1 });
        res.json({ success: true, materials });
    } catch (error) {
        console.error('Fetch library error:', error);
        res.status(500).json({ error: 'Server error fetching library' });
    }
});

// --- Quiz Routes ---

// Get all quizzes
router.get('/quizzes', auth, async (req, res) => {
    try {
        const quizzes = await Quiz.find().select('-questions.correctAnswer');
        res.json({ success: true, quizzes });
    } catch (error) {
        console.error('Fetch quizzes error:', error);
        res.status(500).json({ error: 'Server error fetching quizzes' });
    }
});

// Get single quiz (with questions)
router.get('/quizzes/:id', auth, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
        res.json({ success: true, quiz });
    } catch (error) {
        console.error('Fetch quiz error:', error);
        res.status(500).json({ error: 'Server error fetching quiz' });
    }
});

// --- Folder Routes ---

// Create a new folder
router.post('/folders', auth, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Folder name is required' });

        const folder = new Folder({
            name,
            owner: req.user._id
        });
        await folder.save();
        res.status(201).json({ success: true, folder });
    } catch (error) {
        console.error('Create folder error:', error);
        res.status(500).json({ error: 'Server error creating folder' });
    }
});

// Get all folders for student
router.get('/folders', auth, async (req, res) => {
    try {
        const folders = await Folder.find({ owner: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, folders });
    } catch (error) {
        console.error('Fetch folders error:', error);
        res.status(500).json({ error: 'Server error fetching folders' });
    }
});

// --- Notes Routes ---

// Get all shared (public) notes
router.get('/notes/public', auth, async (req, res) => {
    try {
        const notes = await SharedNote.find({ isPublic: true })
            .populate('uploader', 'fullName')
            .sort({ createdAt: -1 });
        res.json({ success: true, notes });
    } catch (error) {
        console.error('Fetch public notes error:', error);
        res.status(500).json({ error: 'Server error fetching public notes' });
    }
});

// Get student's private/personal notes (by folder or all)
router.get('/notes', auth, async (req, res) => {
    try {
        const { folderId } = req.query;
        let query = { uploader: req.user._id };
        if (folderId) query.folderId = folderId;

        const notes = await SharedNote.find(query).sort({ createdAt: -1 });
        res.json({ success: true, notes });
    } catch (error) {
        console.error('Fetch student notes error:', error);
        res.status(500).json({ error: 'Server error fetching notes' });
    }
});

// Upload a note
router.post('/notes/upload', auth, upload.single('noteFile'), async (req, res) => {
    try {
        const { title, description, subject, folderId, isPublic } = req.body;
        if (!req.file) return res.status(400).json({ error: 'Please upload a file' });

        const newNote = new SharedNote({
            title,
            description,
            subject,
            uploader: req.user._id,
            fileUrl: req.file.path,
            folderId: folderId || undefined,
            isPublic: isPublic === 'true' || isPublic === true
        });

        await newNote.save();
        res.status(201).json({ success: true, message: 'Note uploaded successfully', note: newNote });
    } catch (error) {
        console.error('Upload note error:', error);
        res.status(500).json({ error: 'Server error uploading note' });
    }
});

// Track download
router.post('/notes/download/:id', auth, async (req, res) => {
    try {
        const note = await SharedNote.findByIdAndUpdate(req.params.id, { $inc: { downloadsCount: 1 } }, { new: true });
        if (!note) return res.status(404).json({ error: 'Note not found' });
        res.json({ success: true, downloadsCount: note.downloadsCount });
    } catch (error) {
        console.error('Download tracking error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// AI Explanation
router.post('/notes/ai-explain/:id', auth, async (req, res) => {
    try {
        const note = await SharedNote.findById(req.params.id);
        if (!note) return res.status(404).json({ error: 'Note not found' });

        // Check if uploader or if public
        if (note.uploader.toString() !== req.user._id.toString() && !note.isPublic) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Return cached explanation if it exists
        if (note.aiExplanation) {
            return res.json({ success: true, explanation: note.aiExplanation });
        }

        const aiResult = await aiService.explainNote(note);
        if (aiResult.success) {
            note.aiExplanation = aiResult.explanation;
            await note.save();
        }

        res.json(aiResult);
    } catch (error) {
        console.error('AI Explain route error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle Public Status
router.put('/notes/:id/public', auth, async (req, res) => {
    try {
        const { isPublic } = req.body;
        const note = await SharedNote.findOne({ _id: req.params.id, uploader: req.user._id });
        if (!note) return res.status(404).json({ error: 'Note not found or you are not the uploader' });

        note.isPublic = isPublic;
        await note.save();
        res.json({ success: true, message: `Note is now ${isPublic ? 'Public' : 'Private'}`, note });
    } catch (error) {
        console.error('Toggle public error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Generate Quiz from Note
router.post('/notes/:id/generate-quiz', auth, async (req, res) => {
    try {
        const note = await SharedNote.findById(req.params.id);
        if (!note) return res.status(404).json({ error: 'Note not found' });

        // Check ownership or public status
        if (note.uploader.toString() !== req.user._id.toString() && !note.isPublic) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const aiResult = await aiService.generateQuizFromNote(note);
        if (!aiResult.success) return res.status(500).json(aiResult);

        // Save the generated quiz to the database
        const quiz = new Quiz({
            title: aiResult.quiz.title,
            subject: note.subject || 'Legal Studies',
            questions: aiResult.quiz.questions,
            noteId: note._id,
            owner: req.user._id,
            difficulty: 'Intermediate'
        });

        await quiz.save();
        res.status(201).json({ success: true, quizId: quiz._id });
    } catch (error) {
        console.error('Quiz generation route error:', error);
        res.status(500).json({ error: 'Server error generating quiz' });
    }
});

// Get a quiz by ID
router.get('/quizzes/:id', auth, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
        if (quiz.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json({ success: true, quiz });
    } catch (error) {
        console.error('Get quiz error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
