const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    fromLawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' },
    fromClientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    toLawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' },
    fromLawyerName: { type: String },
    fromClientName: { type: String },
    title: { type: String }, // For richer headers
    message: { type: String, required: true },
    type: { type: String, enum: ['connection_request', 'reminder', 'hearing_reminder', 'deadline'], default: 'connection_request' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'unread', 'read'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
