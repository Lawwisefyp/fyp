import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import Student from '@/lib/models/Student';

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }


        await dbConnect();
        const student = await Student.findById(auth.user._id);
        if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

        student.savedLibrary = student.savedLibrary.filter(doc => doc._id.toString() !== id);
        await student.save();

        return NextResponse.json({ success: true, message: 'Removed from your library', library: student.savedLibrary });
    } catch (error) {
        console.error('Delete from library error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
