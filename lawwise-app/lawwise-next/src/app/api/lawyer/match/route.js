import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Lawyer from '@/lib/models/Lawyer';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const practiceArea = searchParams.get('practiceArea');
    const description = searchParams.get('description');
    const city = searchParams.get('city');

    if (!practiceArea) {
      return NextResponse.json({ error: 'Practice area is required' }, { status: 400 });
    }

    await dbConnect();

    const areaRegex = new RegExp(practiceArea.trim(), 'i');
    const potentialLawyers = await Lawyer.find({
      $or: [
        { 'professionalInfo.practiceAreas': areaRegex },
        { 'specialization': areaRegex }
      ],
      isActive: true
    });

    if (potentialLawyers.length === 0) {
      return NextResponse.json({ success: true, match: null });
    }

    const scoredLawyers = potentialLawyers.map(lawyer => {
      let score = 0;
      const details = [];

      if (description) {
        const descLower = description.toLowerCase();
        const bioLower = (lawyer.personalInfo?.bio || '').toLowerCase();
        const specLower = (lawyer.specialization || '').toLowerCase();
        const keywords = description.split(' ').filter(w => w.length > 3);
        let matchCount = 0;
        keywords.forEach(kw => {
          if (bioLower.includes(kw.toLowerCase()) || specLower.includes(kw.toLowerCase())) {
            matchCount++;
          }
        });
        const keywordScore = Math.min((matchCount / (keywords.length || 1)) * 40, 40);
        score += keywordScore;
        if (keywordScore > 10) details.push('Strong expertise match');
      }

      const exp = lawyer.professionalInfo?.yearsOfExperience || 0;
      const expScore = Math.min(exp * 2, 30);
      score += expScore;
      if (exp > 10) details.push('Highly experienced');

      const rating = lawyer.ratings?.averageRating || 0;
      score += rating * 4;
      if (rating >= 4.5) details.push('Top-rated professional');

      if (city && lawyer.personalInfo?.city?.toLowerCase() === city.toLowerCase()) {
        score += 10;
        details.push('Local specialist');
      }

      return {
        ...lawyer.toObject(),
        matchScore: Math.round(score),
        matchDetails: details.slice(0, 2)
      };
    });

    scoredLawyers.sort((a, b) => b.matchScore - a.matchScore);
    const perfectMatch = scoredLawyers[0];

    return NextResponse.json({ success: true, match: perfectMatch });

  } catch (error) {
    console.error('Match error:', error);
    return NextResponse.json({ error: 'Matching algorithm failed' }, { status: 500 });
  }
}
