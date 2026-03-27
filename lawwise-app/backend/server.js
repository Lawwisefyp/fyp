require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import models and middleware
const Lawyer = require('./models/Lawyer');
const Client = require('./models/Client');
const Student = require('./models/Student');
const auth = require('./middleware/auth');
const { sendLoginNotification, sendOTPEmail, sendVerificationEmail, checkAuthenticEmail } = require('./utils/emailService');
const lawyerRoutes = require('./routes/lawyer');
const notificationRoutes = require('./routes/notification');
const messageRoutes = require('./routes/message');
const chatBotRoutes = require('./routes/chatbot');
const draftingRoutes = require('./routes/drafting');
const efilingRoutes = require('./routes/efiling');
const historyRoutes = require('./routes/history');
const documentRoutes = require('./routes/document');
const officialEmailRoutes = require('./routes/officialEmail');
const studentRoutes = require('./routes/student');
const chatRoutes = require('./routes/chat');
const draftRoutes = require('./routes/draft');
const jwt = require('jsonwebtoken');


const app = express();

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use('/uploads', express.static('uploads'));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP
});
app.use(limiter);

// Routes
app.use('/api/lawyer', lawyerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chatbot', chatBotRoutes);
app.use('/api/drafting', draftingRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/cases', efilingRoutes);
app.use('/api/official-emails', officialEmailRoutes);
app.use('/api/students', studentRoutes);

// New Modules Integration
app.use('/api/chat', chatRoutes);
app.use('/api/draft', draftRoutes);


// Root route for GET /
app.get('/', (req, res) => {
    res.send('Lawwise API is running.');
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lawwise', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword, barNumber, specialization } = req.body;

        // Validate input
        if (!fullName || !email || !password || !confirmPassword || !barNumber || !specialization) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        // Check for existing lawyer
        const existingLawyer = await Lawyer.findOne({ $or: [{ email }, { barNumber }] });

        if (existingLawyer) {
            if (existingLawyer.email === email) {
                return res.status(400).json({ error: 'Email already registered' });
            }
            if (existingLawyer.barNumber === barNumber) {
                return res.status(400).json({ error: 'Bar number already registered' });
            }
        }

        // Check if email is authentic (format + domain check)
        const emailValidation = await checkAuthenticEmail(email);
        if (!emailValidation.success) {
            return res.status(400).json({ error: emailValidation.error });
        }

        const lawyer = new Lawyer({
            fullName,
            email,
            password,
            barNumber,
            specialization,
            isEmailVerified: false,
            emailVerificationToken: crypto.randomBytes(32).toString('hex')
        });

        await lawyer.save();

        // Send verification email
        const emailResult = await sendVerificationEmail(lawyer.email, lawyer.fullName, lawyer.emailVerificationToken, 'lawyer');

        if (!emailResult.success) {
            // Delete the unverified user if email failed (to allow retry with better email)
            await Lawyer.findByIdAndDelete(lawyer._id);
            return res.status(400).json({
                error: emailResult.error || 'Failed to send verification email. Please ensure you are using an authentic official email address.'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Account created successfully. Please check your official email to verify your account.',
            lawyer: {
                id: lawyer._id,
                name: lawyer.fullName,
                email: lawyer.email,
                specialization: lawyer.specialization,
                barNumber: lawyer.barNumber
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: errors.join(', ') });
        }
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        console.log(`Login attempt for email: ${email}`);
        const lawyer = await Lawyer.findOne({ email: email.toLowerCase() });

        if (!lawyer) {
            console.log(`Lawyer not found for email: ${email}`);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        console.log(`Lawyer found: ${lawyer.fullName}, IsActive: ${lawyer.isActive}`);

        if (!lawyer.isActive) {
            return res.status(401).json({ error: 'Account is deactivated. Please contact support.' });
        }

        if (!lawyer.isEmailVerified) {
            return res.status(403).json({
                error: 'Email not verified',
                message: 'Please verify your email address before logging in.',
                email: lawyer.email
            });
        }

        const isMatch = await lawyer.comparePassword(password);
        console.log(`Password match: ${isMatch}`);

        if (!isMatch) {
            return res.status(401).json({
                error: lawyer.isLocked
                    ? 'Account is temporarily locked due to too many failed login attempts'
                    : 'Invalid email or password'
            });
        }

        const token = lawyer.generateAuthToken();

        // Send login notification (realistic touch)
        sendLoginNotification(lawyer.email, lawyer.fullName).catch(console.error);

        res.json({
            success: true,
            message: `Welcome back, ${lawyer.fullName}!`,
            token,
            lawyer: {
                id: lawyer._id,
                name: lawyer.fullName,
                email: lawyer.email,
                specialization: lawyer.specialization,
                barNumber: lawyer.barNumber,
                lastLogin: lawyer.lastLogin
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Profile GET
app.get('/api/auth/profile', auth, async (req, res) => {
    try {
        const lawyer = await Lawyer.findById(req.lawyer._id).select('-password -loginAttempts -lockUntil');
        res.json({
            success: true,
            lawyer
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
});

// Profile Update
app.put('/api/auth/profile', auth, async (req, res) => {
    try {
        const { fullName, specialization } = req.body;
        const lawyer = await Lawyer.findById(req.lawyer._id);

        if (fullName) lawyer.fullName = fullName;
        if (specialization) lawyer.specialization = specialization;

        await lawyer.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            lawyer: {
                id: lawyer._id,
                name: lawyer.fullName,
                email: lawyer.email,
                specialization: lawyer.specialization,
                barNumber: lawyer.barNumber
            }
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Server error updating profile' });
    }
});

// Change Password
app.put('/api/auth/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ error: 'All password fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'New passwords do not match' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters long' });
        }

        const lawyer = await Lawyer.findById(req.lawyer._id);
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, lawyer.password);

        if (!isCurrentPasswordValid) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        lawyer.password = newPassword;
        await lawyer.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Server error changing password' });
    }
});

// Logout
app.post('/api/auth/logout', auth, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Server error during logout' });
    }
});

// Get all lawyers
app.get('/api/lawyers', async (req, res) => {
    try {
        const lawyers = await Lawyer.find({ isActive: true, isProfileComplete: true })
            .select('-password -loginAttempts -lockUntil')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: lawyers.length,
            lawyers
        });
    } catch (error) {
        console.error('Fetch lawyers error:', error);
        res.status(500).json({ error: 'Server error fetching lawyers' });
    }
});

// Client Registration
app.post('/api/clients/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        if (!fullName || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }
        // Check for existing client
        const existingClient = await Client.findOne({ email });
        if (existingClient) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        // Check if email is authentic (format + domain check)
        const emailValidation = await checkAuthenticEmail(email);
        if (!emailValidation.success) {
            return res.status(400).json({ error: emailValidation.error });
        }

        const client = new Client({
            fullName,
            email,
            password,
            isEmailVerified: false,
            emailVerificationToken: crypto.randomBytes(32).toString('hex')
        });
        await client.save();

        // Send verification email
        const emailResult = await sendVerificationEmail(client.email, client.fullName, client.emailVerificationToken, 'client');

        if (!emailResult.success) {
            await Client.findByIdAndDelete(client._id);
            return res.status(400).json({
                error: emailResult.error || 'Failed to send verification email. Please ensure you are using an authentic official email address.'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Client account created successfully. Please check your official email to verify your account.',
            client: { id: client._id, fullName: client.fullName, email: client.email }
        });
    } catch (error) {
        console.error('Client registration error:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: errors.join(', ') });
        }
        res.status(500).json({ error: 'Server error during client registration' });
    }
});

// Client Login
app.post('/api/clients/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const client = await Client.findOne({ email: email.toLowerCase() });
        if (!client) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isMatch = await client.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!client.isEmailVerified) {
            return res.status(403).json({
                error: 'Email not verified',
                message: 'Please verify your email address before logging in.',
                email: client.email
            });
        }

        const token = jwt.sign({ id: client._id, role: 'client' }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || '30d'
        });

        // Send login notification
        sendLoginNotification(client.email, client.fullName).catch(console.error);

        res.json({
            success: true,
            message: `Welcome, ${client.fullName}!`,
            token,
            client: {
                id: client._id,
                fullName: client.fullName,
                email: client.email
            }
        });
    } catch (error) {
        console.error('Client login error:', error);
        res.status(500).json({ error: 'Server error during client login' });
    }
});


// Student Registration
app.post('/api/students/register', async (req, res) => {
    try {
        const { fullName, email, password, university, yearOfStudy } = req.body;
        if (!fullName || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }
        // Check for existing student
        const existingStudent = await Student.findOne({ email });
        if (existingStudent) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        // Check if email is authentic
        const emailValidation = await checkAuthenticEmail(email);
        if (!emailValidation.success) {
            return res.status(400).json({ error: emailValidation.error });
        }

        const student = new Student({
            fullName,
            email,
            password,
            university,
            yearOfStudy,
            isEmailVerified: false,
            emailVerificationToken: crypto.randomBytes(32).toString('hex')
        });
        await student.save();

        // Send verification email
        const emailResult = await sendVerificationEmail(student.email, student.fullName, student.emailVerificationToken, 'student');

        if (!emailResult.success) {
            await Student.findByIdAndDelete(student._id);
            return res.status(400).json({
                error: emailResult.error || 'Failed to send verification email.'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Student account created successfully. Please check your email to verify your account.',
            student: { id: student._id, fullName: student.fullName, email: student.email }
        });
    } catch (error) {
        console.error('Student registration error:', error);
        res.status(500).json({ error: 'Server error during student registration' });
    }
});

// Student Login
app.post('/api/students/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const student = await Student.findOne({ email: email.toLowerCase() });
        if (!student) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isMatch = await student.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!student.isEmailVerified) {
            return res.status(403).json({
                error: 'Email not verified',
                message: 'Please verify your email address before logging in.',
                email: student.email
            });
        }

        const token = jwt.sign({ id: student._id, role: 'student' }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || '30d'
        });

        // Send login notification
        sendLoginNotification(student.email, student.fullName).catch(console.error);

        res.json({
            success: true,
            message: `Welcome, ${student.fullName}!`,
            token,
            student: {
                id: student._id,
                fullName: student.fullName,
                email: student.email
            }
        });
    } catch (error) {
        console.error('Student login error:', error);
        res.status(500).json({ error: 'Server error during student login' });
    }
});

// Resend Verification Email
app.post('/api/auth/resend-verification', async (req, res) => {
    try {
        const { email, userType } = req.body;
        let Model;
        if (userType === 'client') Model = Client;
        else if (userType === 'student') Model = Student;
        else Model = Lawyer;

        const user = await Model.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }

        // Generate new token if needed or reuse
        if (!user.emailVerificationToken) {
            user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
            await user.save();
        }

        const emailResult = await sendVerificationEmail(user.email, user.fullName, user.emailVerificationToken, userType);

        if (!emailResult.success) {
            return res.status(400).json({
                error: emailResult.error || 'Failed to resend verification email.'
            });
        }

        res.json({
            success: true,
            message: 'Verification email resent. Please check your official inbox.'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify Email Endpoint
app.get('/api/auth/verify-email', async (req, res) => {
    try {
        const { token, type } = req.query;
        if (!token || !type) {
            return res.status(400).json({ error: 'Token and type are required' });
        }

        let Model;
        if (type === 'client') Model = Client;
        else if (type === 'student') Model = Student;
        else Model = Lawyer;

        const user = await Model.findOne({ emailVerificationToken: token });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        await user.save();

        res.json({ success: true, message: 'Email verified successfully! You can now log in.' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Server error during verification' });
    }
});

// -------- PASSWORD RESET FLOW --------

// 1. Forgot Password - Send OTP
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email, userType } = req.body; // userType: 'lawyer', 'client', or 'student'
        if (!email) return res.status(400).json({ error: 'Email is required' });

        let Model;
        if (userType === 'client') Model = Client;
        else if (userType === 'student') Model = Student;
        else Model = Lawyer;

        const user = await Model.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        await sendOTPEmail(user.email, otp);
        res.json({ success: true, message: 'Verification code sent to your email' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp, userType } = req.body;
        let Model;
        if (userType === 'client') Model = Client;
        else if (userType === 'student') Model = Student;
        else Model = Lawyer;

        const user = await Model.findOne({
            email: email.toLowerCase(),
            resetPasswordOTP: otp,
            resetPasswordOTPExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification code' });
        }

        res.json({ success: true, message: 'OTP verified successfully' });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// 3. Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword, userType } = req.body;
        let Model;
        if (userType === 'client') Model = Client;
        else if (userType === 'student') Model = Student;
        else Model = Lawyer;

        const user = await Model.findOne({
            email: email.toLowerCase(),
            resetPasswordOTP: otp,
            resetPasswordOTPExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification session' });
        }

        user.password = newPassword;
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Lawwise API is running',
        timestamp: new Date().toISOString()
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`🚀 Lawwise backend server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});
