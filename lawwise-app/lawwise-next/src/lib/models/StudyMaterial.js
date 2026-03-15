import mongoose from 'mongoose';

const StudyMaterialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        enum: ['Notes', 'Past Papers', 'Case Summaries'],
        required: true
    },
    fileUrl: {
        type: String
    },
    content: {
        type: String
    },
    subjectTag: {
        type: String,
        trim: true
    }
}, { timestamps: true });

const StudyMaterial = mongoose.models.StudyMaterial || mongoose.model('StudyMaterial', StudyMaterialSchema);
export default StudyMaterial;
