import jwt from 'jsonwebtoken';
import Lawyer from './models/Lawyer';
import Client from './models/Client';
import Student from './models/Student';
import dbConnect from './dbConnect';

export const verifyAuth = async (req) => {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_change_me');
    const userId = decoded._id || decoded.id;

    if (!userId) return null;

    await dbConnect();

    let user = null;
    const role = decoded.role;

    if (role === 'lawyer') {
      user = await Lawyer.findById(userId).select('-password');
    } else if (role === 'client') {
      user = await Client.findById(userId).select('-password');
    } else if (role === 'student') {
      user = await Student.findById(userId).select('-password');
    }

    if (!user) return null;

    return { user, role };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
};
