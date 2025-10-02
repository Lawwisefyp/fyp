require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import models and middleware
const Lawyer = require('./models/Lawyer');
const Client = require('./models/Client');
const auth = require('./middleware/auth');
const lawyerRoutes = require('./routes/lawyer');
const notificationRoutes = require('./routes/notification');

const app = express();

// Middleware
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(cors({
    origin: true,
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP
});
app.use(limiter);

// Routes
app.use('/api/lawyer', lawyerRoutes);
app.use('/api/notifications', notificationRoutes);
const caseRoutes = require('./routes/case');
app.use('/api/cases', caseRoutes);
    
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

        const lawyer = new Lawyer({
            fullName,
            email,
            password,
            barNumber,
            specialization
        });

        await lawyer.save();
        const token = lawyer.generateAuthToken();

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token,
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

        const lawyer = await Lawyer.findOne({ email: email.toLowerCase() });

        if (!lawyer) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!lawyer.isActive) {
            return res.status(401).json({ error: 'Account is deactivated. Please contact support.' });
        }

        const isMatch = await lawyer.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                error: lawyer.isLocked
                    ? 'Account is temporarily locked due to too many failed login attempts'
                    : 'Invalid email or password'
            });
        }

        const token = lawyer.generateAuthToken();

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
        const lawyers = await Lawyer.find({ isActive: true })
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
        const client = new Client({ fullName, email, password });
        await client.save();
        res.status(201).json({ success: true, message: 'Client account created successfully', client: { id: client._id, fullName: client.fullName, email: client.email } });
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
        res.json({
            success: true,
            message: `Welcome, ${client.fullName}!`,
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


// Health check
// ChatGPT API endpoint for lawyer chatbot
const axios = require('axios');
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a helpful lawyer chatbot. Answer law-related questions clearly and concisely.' },
                    { role: 'user', content: message }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        const answer = response.data.choices[0].message.content;
        res.json({ answer });
    } catch (error) {
        console.error('OpenAI API error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to get response from ChatGPT' });
    }
});
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
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Lawwise backend server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});
