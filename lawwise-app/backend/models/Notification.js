const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    fromLawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' },
    toLawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' },
    fromLawyerName: { type: String }, // Added for displaying lawyer name in notifications
    message: { type: String, required: true },
    type: { type: String, enum: ['connection_request', 'reminder'], default: 'connection_request' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
