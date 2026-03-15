import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Draft from '@/lib/models/Draft';
import { verifyAuth } from '@/lib/auth';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

export async function GET(req, { params }) {
  try {
    const auth = await verifyAuth(req);
    if (!auth || auth.role !== 'lawyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();
    const draft = await Draft.findOne({ _id: id, lawyerId: auth.user._id });
    if (!draft) return NextResponse.json({ success: false, error: 'Draft not found' }, { status: 404 });

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: draft.title.toUpperCase(),
                bold: true,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          ...draft.content.split('\n').map(line => {
            if (line.startsWith('### ')) {
              return new Paragraph({
                children: [
                  new TextRun({
                    text: line.replace('### ', '').toUpperCase(),
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { before: 400, after: 200 },
              });
            }
            return new Paragraph({
              children: [new TextRun(line)],
              spacing: { after: 200 },
            });
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename=${draft.title.replace(/\s+/g, '_')}.docx`,
      },
    });

  } catch (error) {
    console.error('Export failed:', error);
    return NextResponse.json({ success: false, error: 'Export failed' }, { status: 500 });
  }
}
