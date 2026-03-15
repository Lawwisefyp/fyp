const mongoose = require('mongoose');

const SharedNoteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        trim: true
    },
    downloadsCount: {
        type: Number,
        default: 0
    },
    folderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder'
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    aiExplanation: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('SharedNote', SharedNoteSchema);
