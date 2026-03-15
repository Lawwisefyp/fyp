const mongoose = require('mongoose');

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
        content: String, // The Professional Boilerplate/Syntax
        type: {
            type: String,
            enum: ['header', 'body', 'footer', 'static'],
            default: 'static'
        }
    }],
    fields: [], // We will no longer use structured fields per template

    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Template', TemplateSchema);
