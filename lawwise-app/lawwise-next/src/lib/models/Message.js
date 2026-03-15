import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'senderModel'
    },
    senderModel: {
        type: String,
        required: true,
        enum: ['Lawyer', 'Client']
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'receiverModel'
    },
    receiverModel: {
        type: String,
        required: true,
        enum: ['Lawyer', 'Client']
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

MessageSchema.index({ senderId: 1, receiverId: 1 });
MessageSchema.index({ createdAt: -1 });

const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
export default Message;
