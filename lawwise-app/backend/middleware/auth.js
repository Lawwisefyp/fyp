const jwt = require('jsonwebtoken');
const Lawyer = require('../models/Lawyer');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const lawyer = await Lawyer.findById(decoded.id).select('-password');
        
        if (!lawyer || !lawyer.isActive) {
            return res.status(401).json({ error: 'Invalid token or account deactivated.' });
        }

        req.lawyer = lawyer;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

module.exports = auth;