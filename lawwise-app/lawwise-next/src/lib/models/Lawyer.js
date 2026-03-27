import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const QualificationSchema = new mongoose.Schema({
  degree: { type: String, required: true },
  institution: { type: String, required: true },
  year: { type: Number },
  certificateFile: { type: String }
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
  profilePicture: { type: String }
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
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  isLocked: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  resetPasswordOTP: { type: String },
  resetPasswordOTPExpires: { type: Date },
  phoneNumber: { type: String, trim: true },
  personalInfo: PersonalInfoSchema,
  professionalInfo: ProfessionalInfoSchema,
  qualifications: [QualificationSchema],
  experience: [ExperienceSchema],
  isProfileComplete: { type: Boolean, default: false },
  connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' }],
  ratings: RatingsSchema
}, { timestamps: true });

LawyerSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

LawyerSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

LawyerSchema.methods.generateAuthToken = function () {
  const payload = { _id: this._id, email: this.email, role: 'lawyer' };
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

const Lawyer = mongoose.models.Lawyer || mongoose.model('Lawyer', LawyerSchema);
export default Lawyer;
