import mongoose from 'mongoose';

const FolderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    }
}, { timestamps: true });

const Folder = mongoose.models.Folder || mongoose.model('Folder', FolderSchema);
export default Folder;
