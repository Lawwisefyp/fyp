import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function check() {
  console.log('Testing MongoDB connection...');
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check if Student model can be loaded
    const StudentSchema = new mongoose.Schema({ email: String });
    const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);
    console.log('✅ Student model loaded');
    
    const count = await Student.countDocuments();
    console.log('Current student count:', count);
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

check();
