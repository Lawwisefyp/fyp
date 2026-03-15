import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Document from '@/lib/models/Document';
import { verifyAuth } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const title = formData.get('title');
    const category = formData.get('category') || 'personal';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    await dbConnect();
    const document = new Document({
      lawyerId: auth.user._id,
      title: title || file.name,
      category,
      fileName: file.name,
      fileType: file.type,
      fileSize: `${Math.round(file.size / 1024)} KB`,
      filePath: `uploads/documents/${fileName}`
    });

    await document.save();

    return NextResponse.json({ success: true, document }, { status: 201 });
  } catch (error) {
    console.error('Upload document error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
