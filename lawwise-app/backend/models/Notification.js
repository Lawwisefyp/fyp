const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    fromLawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' },
    fromClientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    toLawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' },
    toClientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    fromLawyerName: { type: String },
    fromClientName: { type: String },
    title: { type: String }, // For richer headers
    message: { type: String, required: true },
    caseId: { type: String }, // Link to Case
    reminderId: { type: String }, // Link to specific Reminder/Deadline
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // Generic ID for related objects
    onModel: { type: String }, // Model for relatedId
    type: { type: String, enum: ['connection_request', 'reminder', 'hearing_reminder', 'deadline', 'accepted', 'rejected'], default: 'connection_request' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'unread', 'read'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
