import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import SharedNote from '@/lib/models/SharedNote';

export async function POST(req, { params }) {
    try {
        const { id } = await params;
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }


        await dbConnect();
        const note = await SharedNote.findByIdAndUpdate(
            id, 
            { $inc: { downloadsCount: 1 } }, 
            { new: true }
        );

        if (!note) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, downloadsCount: note.downloadsCount });
    } catch (error) {
        console.error('Download tracking error:', error);
        return NextResponse.json({ error: 'Server error tracking download' }, { status: 500 });
    }
}
