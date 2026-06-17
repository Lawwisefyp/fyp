const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const Lawyer = require('../models/Lawyer');

// POST /api/reviews - Client submits a review
router.post('/', auth, async (req, res) => {
    if (req.role !== 'client') return res.status(403).json({ error: "Only clients can leave reviews" });
    
    try {
        const {
            lawyerId, overallRating, communicationRating, expertiseRating,
            professionalismRating, valueRating, reviewText, tags, isAnonymous
        } = req.body;

        const review = new Review({
            clientId: req.user._id,
            lawyerId,
            overallRating,
            communicationRating,
            expertiseRating,
            professionalismRating,
            valueRating,
            reviewText,
            tags: tags || [],
            isAnonymous: isAnonymous || false
        });

        await review.save();

        // Update Lawyer's average rating
        const allReviews = await Review.find({ lawyerId });
        const avg = allReviews.reduce((acc, r) => acc + r.overallRating, 0) / allReviews.length;
        
        await Lawyer.findByIdAndUpdate(lawyerId, {
            'ratings.averageRating': Number(avg.toFixed(1)),
            'ratings.totalReviews': allReviews.length
        });

        res.status(201).json({ message: "Review submitted successfully", review });
    } catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).json({ error: "Failed to submit review" });
    }
});

// GET /api/reviews/lawyer/:lawyerId - Get all reviews for a lawyer
router.get('/lawyer/:lawyerId', async (req, res) => {
    try {
        const reviews = await Review.find({ lawyerId: req.params.lawyerId })
            .populate('clientId', 'fullName profileImage')
            .sort({ isPinned: -1, createdAt: -1 });

        // Calculate averages
        const count = reviews.length;
        const stats = count > 0 ? {
            overall: (reviews.reduce((acc, r) => acc + r.overallRating, 0) / count).toFixed(1),
            communication: (reviews.reduce((acc, r) => acc + r.communicationRating, 0) / count).toFixed(1),
            expertise: (reviews.reduce((acc, r) => acc + r.expertiseRating, 0) / count).toFixed(1),
            professionalism: (reviews.reduce((acc, r) => acc + r.professionalismRating, 0) / count).toFixed(1),
            value: (reviews.reduce((acc, r) => acc + r.valueRating, 0) / count).toFixed(1),
            totalReviews: count
        } : null;

        res.json({ reviews, stats });
    } catch (error) {
        console.error("Error fetching lawyer reviews:", error);
        res.status(500).json({ error: "Failed to fetch reviews" });
    }
});

// GET /api/reviews/client - Get all reviews written by the logged-in client
router.get('/client', auth, async (req, res) => {
    if (req.role !== 'client') return res.status(403).json({ error: "Unauthorized" });
    try {
        const reviews = await Review.find({ clientId: req.user._id })
            .populate('lawyerId', 'fullName profileImage areaOfSpecialization')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        console.error("Error fetching client reviews:", error);
        res.status(500).json({ error: "Failed to fetch reviews" });
    }
});

// PUT /api/reviews/:id/reply - Lawyer replies to a review
router.put('/:id/reply', auth, async (req, res) => {
    if (req.role !== 'lawyer') return res.status(403).json({ error: "Unauthorized" });
    try {
        const review = await Review.findOne({ _id: req.params.id, lawyerId: req.user._id });
        if (!review) return res.status(404).json({ error: "Review not found" });

        review.lawyerReply = req.body.reply;
        review.repliedAt = new Date();
        await review.save();

        res.json({ message: "Reply added", review });
    } catch (error) {
        console.error("Error replying to review:", error);
        res.status(500).json({ error: "Failed to reply to review" });
    }
});

module.exports = router;
