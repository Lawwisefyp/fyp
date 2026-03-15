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

        const { searchParams } = new URL(req.url);
        const folderId = searchParams.get('folderId');

        await dbConnect();
        let query = { uploader: auth.user._id };
        if (folderId && folderId !== 'all') {
            query.folderId = folderId;
        }

        const notes = await SharedNote.find(query).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, notes });
    } catch (error) {
        console.error('Fetch student notes error:', error);
        return NextResponse.json({ error: 'Server error fetching notes' }, { status: 500 });
    }
}
