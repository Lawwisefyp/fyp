const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const StudentSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email address is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters']
    },
    university: {
        type: String,
        trim: true
    },
    yearOfStudy: {
        type: String,
        trim: true
    },
    interests: [{
        type: String
    }],
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    resetPasswordOTP: { type: String },
    resetPasswordOTPExpires: { type: Date },
    lastLogin: { type: Date },
    savedLibrary: [{
        title: { type: String, required: true },
        fileUrl: { type: String, required: true },
        description: { type: String },
        source: { type: String },
        category: { type: String },
        savedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

StudentSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

StudentSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

StudentSchema.methods.generateAuthToken = function () {
    const payload = { id: this._id, role: 'student' };
    const secret = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
    return jwt.sign(payload, secret, { expiresIn: '7d' });
};

module.exports = mongoose.model('Student', StudentSchema);
