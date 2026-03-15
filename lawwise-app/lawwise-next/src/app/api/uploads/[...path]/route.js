import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req, { params }) {
  try {
    const { path: pathSegments } = await params;
    const filePath = path.join(process.cwd(), 'uploads', ...pathSegments);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    let contentType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.doc') contentType = 'application/msword';
    else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
    });

  } catch (error) {
    console.error('Serve upload error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
