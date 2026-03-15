import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['mcq', 'short', 'long'],
        required: true
    },
    question: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String },
    explanation: { type: String }
}, { _id: false });

const QuizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    questions: [QuestionSchema],
    difficulty: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    noteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SharedNote'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    }
}, { timestamps: true });

const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);
export default Quiz;
