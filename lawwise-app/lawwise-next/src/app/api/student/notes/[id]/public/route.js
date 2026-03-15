import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import SharedNote from '@/lib/models/SharedNote';

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { isPublic } = await req.json();

        await dbConnect();
        const note = await SharedNote.findOne({ _id: id, uploader: auth.user._id });

        if (!note) {
            return NextResponse.json({ error: 'Note not found or access denied' }, { status: 404 });
        }

        note.isPublic = isPublic;
        await note.save();

        return NextResponse.json({ 
            success: true, 
            message: `Note is now ${isPublic ? 'Public' : 'Private'}`, 
            note 
        });
    } catch (error) {
        console.error('Toggle public status error:', error);
        return NextResponse.json({ error: 'Server error toggling public status' }, { status: 500 });
    }
}
