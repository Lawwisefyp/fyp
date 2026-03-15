import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    fromLawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' },
    fromClientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    toLawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' },
    toClientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    fromLawyerName: { type: String },
    fromClientName: { type: String },
    title: { type: String },
    message: { type: String, required: true },
    type: { type: String, enum: ['connection_request', 'connection_response', 'reminder', 'hearing_reminder', 'deadline'], default: 'connection_request' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'unread', 'read'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export default Notification;
