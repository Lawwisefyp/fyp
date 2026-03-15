import mongoose from 'mongoose';

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

historySchema.index({ lawyerId: 1, videoId: 1 }, { unique: true });

const History = mongoose.models.History || mongoose.model('History', historySchema);
export default History;
