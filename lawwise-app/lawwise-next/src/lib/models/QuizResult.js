import mongoose from 'mongoose';

const QuizResultSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    difficulty: {
        type: String
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const QuizResult = mongoose.models.QuizResult || mongoose.model('QuizResult', QuizResultSchema);
export default QuizResult;
