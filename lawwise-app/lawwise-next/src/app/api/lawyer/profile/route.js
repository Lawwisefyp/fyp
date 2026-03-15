import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Lawyer from '@/lib/models/Lawyer';
import { verifyAuth } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const lawyer = await Lawyer.findById(auth.user._id).select('-password');

    if (!lawyer) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, lawyer });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const profileDataStr = formData.get('profileData');
    const profilePicture = formData.get('profilePicture');
    
    if (!profileDataStr) {
      return NextResponse.json({ error: 'Missing profile data' }, { status: 400 });
    }

    const profileData = JSON.parse(profileDataStr);
    
    await dbConnect();
    const lawyer = await Lawyer.findById(auth.user._id);

    if (!lawyer) {
      return NextResponse.json({ error: 'Lawyer not found' }, { status: 404 });
    }

    // Handle profile picture upload
    if (profilePicture && typeof profilePicture !== 'string') {
      const bytes = await profilePicture.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const fileName = `${Date.now()}-${profilePicture.name}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      
      // Store relative path
      if (!profileData.personalInfo) profileData.personalInfo = {};
      profileData.personalInfo.profilePicture = `uploads/profiles/${fileName}`;
    }

    // Update lawyer fields
    if (profileData.personalInfo) {
      lawyer.personalInfo = { ...lawyer.personalInfo?.toObject(), ...profileData.personalInfo };
      if (profileData.personalInfo.firstName && profileData.personalInfo.lastName) {
        lawyer.fullName = `${profileData.personalInfo.firstName} ${profileData.personalInfo.lastName}`;
      }
    }
    
    if (profileData.professionalInfo) {
      lawyer.professionalInfo = { ...lawyer.professionalInfo?.toObject(), ...profileData.professionalInfo };
      if (profileData.professionalInfo.specialization) {
        lawyer.specialization = profileData.professionalInfo.specialization;
      }
    }
    
    if (profileData.qualifications) lawyer.qualifications = profileData.qualifications;
    if (profileData.experience) lawyer.experience = profileData.experience;
    
    lawyer.isProfileComplete = true;
    
    await lawyer.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      lawyer
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
