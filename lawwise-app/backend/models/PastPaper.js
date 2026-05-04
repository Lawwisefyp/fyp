const mongoose = require('mongoose');

const PastPaperSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    llbYear: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4, 5]
    },
    description: {
        type: String
    },
    fileUrl: {
        type: String,
        required: true
    },
    modelAnswerUrl: {
        type: String
    },
    uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: false
    },
    downloadsCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('PastPaper', PastPaperSchema);
