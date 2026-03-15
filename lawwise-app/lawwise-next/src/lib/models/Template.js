import mongoose from 'mongoose';

const TemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['Legal Notice', 'Court Draft', 'Affidavit', 'Agreement', 'Property Document', 'Other']
    },
    jurisdiction: {
        type: String,
        default: 'General'
    },
    description: String,
    sections: [{
        title: String,
        content: String,
        type: {
            type: String,
            enum: ['header', 'body', 'footer', 'static'],
            default: 'static'
        }
    }],
    fields: [],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Template = mongoose.models.Template || mongoose.model('Template', TemplateSchema);
export default Template;
