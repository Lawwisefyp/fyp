import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import SharedNote from '@/lib/models/SharedNote';

export async function GET(req) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const notes = await SharedNote.find({ isPublic: true })
            .populate('uploader', 'fullName')
            .sort({ createdAt: -1 });
            
        return NextResponse.json({ success: true, notes });
    } catch (error) {
        console.error('Fetch public notes error:', error);
        return NextResponse.json({ error: 'Server error fetching public notes' }, { status: 500 });
    }
}
