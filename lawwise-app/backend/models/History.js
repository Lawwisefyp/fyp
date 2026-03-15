const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    lawyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lawyer',
        required: true
    },
    videoId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
    channelName: {
        type: String,
        required: true
    },
    watchedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Avoid duplicate history entries for the same video by the same lawyer
historySchema.index({ lawyerId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model('History', historySchema);
