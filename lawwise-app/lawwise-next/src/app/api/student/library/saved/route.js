import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import Student from '@/lib/models/Student';

export async function GET(req) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const student = await Student.findById(auth.user._id);
        if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

        return NextResponse.json({ success: true, savedLibrary: student.savedLibrary || [] });
    } catch (error) {
        console.error('Fetch saved library error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, fileUrl, description, source, category } = await req.json();

        await dbConnect();
        const student = await Student.findById(auth.user._id);
        if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

        // Check if already saved
        const isAlreadySaved = student.savedLibrary.some(doc => doc.fileUrl === fileUrl);
        if (isAlreadySaved) {
            return NextResponse.json({ error: 'Document already saved in your library' }, { status: 400 });
        }

        student.savedLibrary.push({ title, fileUrl, description, source, category });
        await student.save();

        return NextResponse.json({ success: true, message: 'Saved to your library', library: student.savedLibrary });
    } catch (error) {
        console.error('Save to library error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
