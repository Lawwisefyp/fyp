// const jwt = require('jsonwebtoken');
// const Lawyer = require('../models/Lawyer');

// const auth = async (req, res, next) => {
//     try {
//         const token = req.header('Authorization')?.replace('Bearer ', '');

//         if (!token) {
//             return res.status(401).json({ error: 'Access denied. No token provided.' });
//         }

//         const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
//         const lawyer = await Lawyer.findById(decoded.id).select('-password');

//         if (!lawyer || !lawyer.isActive) {
//             return res.status(401).json({ error: 'Invalid token or account deactivated.' });
//         }

//         req.lawyer = lawyer;
//         next();
//     } catch (error) {
//         res.status(401).json({ error: 'Invalid token.' });
//     }
// };

// module.exports = auth;



const jwt = require('jsonwebtoken');
const Lawyer = require('../models/Lawyer');
const Client = require('../models/Client');
const Student = require('../models/Student');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_change_me');
    } catch (err) {
      console.error('JWT verify failed:', err.message);
      return res.status(401).json({ error: 'Invalid token or account expired.' });
    }

    const userId = decoded._id || decoded.id || decoded.lawyerId;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token payload.' });
    }

    const tokenRole = decoded.role;
    let user = null;
    let role = tokenRole;

    if (tokenRole === 'lawyer') {
      user = await Lawyer.findById(userId).select('-password');
    } else if (tokenRole === 'client') {
      user = await Client.findById(userId).select('-password');
    } else if (tokenRole === 'student') {
      user = await Student.findById(userId).select('-password');
    }

    // Fallback if role missing or user not found with specified role
    if (!user) {
      user = await Lawyer.findById(userId).select('-password');
      role = 'lawyer';
    }
    if (!user) {
      user = await Client.findById(userId).select('-password');
      role = 'client';
    }
    if (!user) {
      user = await Student.findById(userId).select('-password');
      role = 'student';
    }

    if (!user || (role === 'lawyer' && user.isActive === false)) {
      return res.status(401).json({ error: 'User not found or account deactivated.' });
    }


    // attach user to request
    req.user = user;
    req.role = role;
    req.token = token;

    // Backward compatibility for lawyer routes
    if (role === 'lawyer') {
      req.user.role = 'lawyer'; // Try to keep it on user as well
      req.lawyer = user;
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed.' });
  }
};

module.exports = auth;
