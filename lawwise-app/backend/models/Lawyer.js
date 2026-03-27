// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// // Lawyer Schema
// const lawyerSchema = new mongoose.Schema({
//     // Basic account fields
//     fullName: {
//         type: String,
//         required: [true, 'Full name is required'],
//         trim: true,
//         minlength: [2, 'Name must be at least 2 characters']
//     },
//     email: {
//         type: String,
//         required: [true, 'Email is required'],
//         unique: true,
//         lowercase: true,
//         match: [/^\w+([.-]?\w+)@\w+([.-]?\w+)(\.\w{2,3})+$/, 'Please enter a valid email']
//     },
//     password: {
//         type: String,
//         required: [true, 'Password is required'],
//         minlength: [8, 'Password must be at least 8 characters']
//     },
//     // Nested profile fields (expanded to match lawyer-profile.html)
//     personalInfo: {
//         firstName: { type: String },
//         lastName: { type: String },
//         phone: { type: String },
//         bio: { type: String },
//         city: { type: String },
//         state: { type: String },
//         profilePicture: { type: String },
//     },
//     professionalInfo: {
//         yearsOfExperience: { type: Number },
//         hourlyRate: { type: Number },
//         practiceAreas: [{ type: String }],
//         barRegistrationNumber: { type: String },
//         isAvailable: { type: Boolean, default: true },
//     },
//     qualifications: [{
//         degree: { type: String },
//         institution: { type: String },
//         year: { type: Number },
//         certificateFile: { type: String }
//     }],
//     experience: [{
//         title: { type: String },
//         organization: { type: String },
//         startDate: { type: Date },
//         endDate: { type: Date },
//         isCurrent: { type: Boolean },
//         description: { type: String }
//     }],
//     isActive: {
//         type: Boolean,
//         default: true
//     },
//     loginAttempts: {
//         type: Number,
//         default: 0
//     },
//     lockUntil: Date,
//     lastLogin: Date
// }, {
//     timestamps: true
// });

// // Virtual for account lockout
// lawyerSchema.virtual('isLocked').get(function() {
//     return !!(this.lockUntil && this.lockUntil > Date.now());
// });

// // Pre-save middleware to hash password
// lawyerSchema.pre('save', async function(next) {
//     if (!this.isModified('password')) return next();

//     try {
//         const salt = await bcrypt.genSalt(12);
//         this.password = await bcrypt.hash(this.password, salt);
//         next();
//     } catch (error) {
//         next(error);
//     }
// });

// // Method to compare password
// lawyerSchema.methods.comparePassword = async function(candidatePassword) {
//     if (this.isLocked) {
//         throw new Error('Account is temporarily locked due to too many failed login attempts');
//     }

//     const isMatch = await bcrypt.compare(candidatePassword, this.password);

//     if (isMatch) {
//         // Reset login attempts on successful login
//         if (this.loginAttempts > 0) {
//             this.loginAttempts = 0;
//             this.lockUntil = undefined;
//         }
//         this.lastLogin = new Date();
//         await this.save();
//         return true;
//     } else {
//         // Increment login attempts
//         this.loginAttempts += 1;

//         // Lock account after 5 failed attempts for 30 minutes
//         if (this.loginAttempts >= 5) {
//             this.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
//         }

//         await this.save();
//         return false;
//     }
// };

// // Method to generate JWT token
// lawyerSchema.methods.generateAuthToken = function() {
//     return jwt.sign(
//         { 
//             id: this._id, 
//             email: this.email,
//             name: this.fullName 
//         },
//         process.env.JWT_SECRET || 'your-secret-key',
//         { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
//     );
// };

// const Lawyer = mongoose.model('Lawyer', lawyerSchema);

// module.exports = Lawyer;


















// models/Lawyer.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const QualificationSchema = new mongoose.Schema({
  degree: { type: String, required: true },
  institution: { type: String, required: true },
  year: { type: Number },
  certificateFile: { type: String } // path to uploaded file
}, { _id: false });

const ExperienceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  organization: { type: String, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  isCurrent: { type: Boolean, default: false },
  description: { type: String }
}, { _id: false });

const PersonalInfoSchema = new mongoose.Schema({
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  phone: { type: String, trim: true },
  bio: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  profilePicture: { type: String } // path to uploaded image
}, { _id: false });

const ProfessionalInfoSchema = new mongoose.Schema({
  yearsOfExperience: { type: Number, default: 0 },
  hourlyRate: { type: Number, default: 0 },
  practiceAreas: [{ type: String }],
  barRegistrationNumber: { type: String, trim: true },
  specialization: { type: String, trim: true },
  isAvailable: { type: Boolean, default: false }
}, { _id: false });

const RatingsSchema = new mongoose.Schema({
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 }
}, { _id: false });

const LawyerSchema = new mongoose.Schema({
  // -------- BASIC AUTH FIELDS (USED BY REGISTER/LOGIN) --------
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Official email address is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid official email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  barNumber: {
    type: String,
    required: [true, 'Bar number is required'],
    unique: true,
    trim: true
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    trim: true
  },

  // -------- ACCOUNT STATUS / SECURITY --------
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  isLocked: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },

  // Auth & Recovery
  resetPasswordOTP: { type: String },
  resetPasswordOTPExpires: { type: Date },
  phoneNumber: { type: String, trim: true },

  // -------- PROFILE DATA (USED BY PROFILE PAGE & SEARCH) --------
  personalInfo: PersonalInfoSchema,
  professionalInfo: ProfessionalInfoSchema,
  qualifications: [QualificationSchema],
  experience: [ExperienceSchema],
  isProfileComplete: { type: Boolean, default: false },

  // Professional connections (accepted networking requests)
  connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' }],

  // Optional ratings for search sorting
  ratings: RatingsSchema

  // NOTE: we NO LONGER require a separate `userId` here –
  // everything uses this Lawyer document directly.
}, { timestamps: true });

/* ------------ PASSWORD HASHING ------------ */
LawyerSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/* ------------ INSTANCE METHODS ------------ */

LawyerSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

LawyerSchema.methods.generateAuthToken = function () {
  const payload = { _id: this._id, email: this.email, role: 'lawyer' };
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

module.exports = mongoose.model('Lawyer', LawyerSchema);
