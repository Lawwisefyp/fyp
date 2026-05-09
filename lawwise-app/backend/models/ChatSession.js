const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userType: { type: String, enum: ['Lawyer', 'Student', 'Client'], default: 'Lawyer' },
    title: { type: String, default: 'New Chat' },
    messages: [{
        role: { type: String, enum: ['user', 'ai'], required: true },
        content: { type: String, required: true },
        context: { type: mongoose.Schema.Types.Mixed }
    }]
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
