const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Lawyer Schema
const lawyerSchema = new mongoose.Schema({
    // Basic account fields
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)@\w+([.-]?\w+)(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters']
    },
    // Nested profile fields (expanded to match lawyer-profile.html)
    personalInfo: {
        firstName: { type: String },
        lastName: { type: String },
        phone: { type: String },
        bio: { type: String },
        city: { type: String },
        state: { type: String },
        profilePicture: { type: String },
    },
    professionalInfo: {
        yearsOfExperience: { type: Number },
        hourlyRate: { type: Number },
        practiceAreas: [{ type: String }],
        barRegistrationNumber: { type: String },
        isAvailable: { type: Boolean, default: true },
    },
    qualifications: [{
        degree: { type: String },
        institution: { type: String },
        year: { type: Number },
        certificateFile: { type: String }
    }],
    experience: [{
        title: { type: String },
        organization: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        isCurrent: { type: Boolean },
        description: { type: String }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    lastLogin: Date
}, {
    timestamps: true
});

// Virtual for account lockout
lawyerSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
lawyerSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
lawyerSchema.methods.comparePassword = async function(candidatePassword) {
    if (this.isLocked) {
        throw new Error('Account is temporarily locked due to too many failed login attempts');
    }
    
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    
    if (isMatch) {
        // Reset login attempts on successful login
        if (this.loginAttempts > 0) {
            this.loginAttempts = 0;
            this.lockUntil = undefined;
        }
        this.lastLogin = new Date();
        await this.save();
        return true;
    } else {
        // Increment login attempts
        this.loginAttempts += 1;
        
        // Lock account after 5 failed attempts for 30 minutes
        if (this.loginAttempts >= 5) {
            this.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
        }
        
        await this.save();
        return false;
    }
};

// Method to generate JWT token
lawyerSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { 
            id: this._id, 
            email: this.email,
            name: this.fullName 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

const Lawyer = mongoose.model('Lawyer', lawyerSchema);

module.exports = Lawyer;