import mongoose from 'mongoose';

const DraftSchema = new mongoose.Schema({
    lawyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lawyer',
        required: true
    },
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template'
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    documentType: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    formData: {
        type: mongoose.Schema.Types.Mixed
    },
    details: {
        type: String
    },
    sourceFiles: [{
        name: String,
        path: String
    }],
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    history: [{
        content: String,
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lawyer'
        },
        updatedAt: {
            type: Date,
            default: Date.now
        },
        version: Number
    }],
    version: {
        type: Number,
        default: 1
    }
}, { timestamps: true });

const Draft = mongoose.models.Draft || mongoose.model('Draft', DraftSchema);
export default Draft;
