import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Lawyer from '@/lib/models/Lawyer';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const practiceArea = searchParams.get('practiceArea');
    const city = searchParams.get('city');
    const minExperience = searchParams.get('minExperience');
    const maxRate = searchParams.get('maxRate');
    const isAvailable = searchParams.get('isAvailable');
    const rating = searchParams.get('rating');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const showAll = searchParams.get('showAll') === 'true';

    await dbConnect();

    let searchCriteria = { isActive: true };

    if (query?.trim()) {
      searchCriteria.$or = [
        { fullName: new RegExp(query, 'i') },
        { specialization: new RegExp(query, 'i') },
        { 'professionalInfo.practiceAreas': new RegExp(query, 'i') }
      ];
    }

    if (practiceArea?.trim()) {
      const areaRegex = new RegExp(practiceArea.trim(), 'i');
      const areaFilter = {
        $or: [
          { 'professionalInfo.practiceAreas': areaRegex },
          { specialization: areaRegex }
        ]
      };
      if (searchCriteria.$or) {
        searchCriteria.$and = [{ $or: searchCriteria.$or }, areaFilter];
        delete searchCriteria.$or;
      } else {
        searchCriteria.$or = areaFilter.$or;
      }
    }

    if (city?.trim()) searchCriteria['personalInfo.city'] = new RegExp(city, 'i');
    if (minExperience) searchCriteria['professionalInfo.yearsOfExperience'] = { $gte: parseInt(minExperience) };
    if (maxRate) searchCriteria['professionalInfo.hourlyRate'] = { $lte: parseFloat(maxRate) };
    if (isAvailable === 'true') searchCriteria['professionalInfo.isAvailable'] = true;
    if (rating) searchCriteria['ratings.averageRating'] = { $gte: parseFloat(rating) };

    if (!showAll) searchCriteria.isProfileComplete = true;

    const skip = (page - 1) * limit;

    const lawyers = await Lawyer.find(searchCriteria)
      .select('-password -loginAttempts -lockUntil')
      .sort({ 'ratings.averageRating': -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Lawyer.countDocuments(searchCriteria);

    return NextResponse.json({
      success: true,
      lawyers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        hasNext: page * limit < total
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Server error searching lawyers' }, { status: 500 });
  }
}
