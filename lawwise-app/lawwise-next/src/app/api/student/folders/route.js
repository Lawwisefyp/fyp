import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import Folder from '@/lib/models/Folder';

export async function GET(req) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const folders = await Folder.find({ owner: auth.user._id }).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, folders });
    } catch (error) {
        console.error('Fetch folders error:', error);
        return NextResponse.json({ error: 'Server error fetching folders' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name } = await req.json();
        if (!name) {
            return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
        }

        await dbConnect();
        const folder = new Folder({
            name,
            owner: auth.user._id
        });
        await folder.save();

        return NextResponse.json({ success: true, folder }, { status: 201 });
    } catch (error) {
        console.error('Create folder error:', error);
        return NextResponse.json({ error: 'Server error creating folder' }, { status: 500 });
    }
}
