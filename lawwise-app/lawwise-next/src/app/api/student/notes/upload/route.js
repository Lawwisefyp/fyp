import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import SharedNote from '@/lib/models/SharedNote';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('noteFile');
        const title = formData.get('title');
        const description = formData.get('description');
        const subject = formData.get('subject');
        const folderId = formData.get('folderId');
        const isPublic = formData.get('isPublic') === 'true';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Path to save: public/uploads/notes/
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'notes');
        
        // Ensure directory exists
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (err) {
            // Directory exists or other error
        }

        const fileName = `${Date.now()}-${file.name}`;
        const filePath = path.join(uploadDir, fileName);
        
        await writeFile(filePath, buffer);
        
        // Save to DB (relative URL for frontend access)
        const fileUrl = `uploads/notes/${fileName}`;

        await dbConnect();
        const newNote = new SharedNote({
            title,
            description,
            subject,
            uploader: auth.user._id,
            fileUrl: fileUrl,
            folderId: folderId || undefined,
            isPublic: isPublic
        });

        await newNote.save();
        
        return NextResponse.json({ 
            success: true, 
            message: 'Note uploaded successfully', 
            note: newNote 
        }, { status: 201 });

    } catch (error) {
        console.error('Upload note route error:', error);
        return NextResponse.json({ error: 'Server error uploading note' }, { status: 500 });
    }
}
