const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer', required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    
    // Core Ratings (1-5)
    overallRating: { type: Number, required: true, min: 1, max: 5 },
    communicationRating: { type: Number, required: true, min: 1, max: 5 },
    expertiseRating: { type: Number, required: true, min: 1, max: 5 },
    professionalismRating: { type: Number, required: true, min: 1, max: 5 },
    valueRating: { type: Number, required: true, min: 1, max: 5 },
    
    // Written Feedback
    reviewText: { type: String, required: true },
    
    // Metadata
    tags: [{ type: String }], // e.g., 'Consultation Only', 'Case Won'
    isAnonymous: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: true }, // Assuming if they review via portal, they are verified
    
    // Lawyer Interaction
    lawyerReply: { type: String, default: null },
    repliedAt: { type: Date, default: null },
    isPinned: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
