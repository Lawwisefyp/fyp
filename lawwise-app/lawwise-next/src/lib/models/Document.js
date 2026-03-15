import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    lawyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lawyer',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['statutes', 'rules', 'cases', 'personal'],
        default: 'personal'
    },
    fileName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    fileSize: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);
export default Document;
