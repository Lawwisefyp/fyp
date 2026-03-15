import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import lawCrawler from '@/lib/services/lawCrawler';

export async function GET(req) {
    try {
        const auth = await verifyAuth(req);
        if (!auth || auth.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');
        const mode = searchParams.get('mode'); // 'statutes' or 'web'

        let result;
        if (mode === 'web' && q) {
            result = await lawCrawler.searchWebForNotes(q, {
                university: auth.user.university,
                year: auth.user.yearOfStudy
            });
        } else {
            result = await lawCrawler.searchOnline(q || '');
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Online search API error:', error);
        return NextResponse.json({ error: 'Server error searching online' }, { status: 500 });
    }
}
