// const express = require('express');
// const router = express.Router();
// const Lawyer = require('../models/Lawyer');
// const upload = require('../middleware/upload');
// const auth = require('../middleware/auth'); // Your existing auth middleware

// // Create or Update Lawyer Profile
// router.post('/profile', auth, upload.fields([
//   { name: 'profilePicture', maxCount: 1 },
//   { name: 'certificate', maxCount: 5 }
// ]), async (req, res) => {
//   try {
//     // Parse profile data from form
//     const profileData = JSON.parse(req.body.profileData);
//     const files = req.files;
//     // Attach uploaded files to profileData
//     if (files.profilePicture) {
//       profileData.personalInfo = profileData.personalInfo || {};
//       profileData.personalInfo.profilePicture = files.profilePicture[0].path;
//     }
//     if (files.certificate && profileData.qualifications) {
//       files.certificate.forEach((file, index) => {
//         if (profileData.qualifications[index]) {
//           profileData.qualifications[index].certificateFile = file.path;
//         }
//       });
//     }
//     // Only update the logged-in user's profile (never create a new Lawyer here)
//     const lawyer = await Lawyer.findById(req.lawyer._id);
//     if (!lawyer) {
//       return res.status(404).json({ success: false, message: 'Lawyer not found' });
//     }
//     // Update only nested fields
//     lawyer.personalInfo = profileData.personalInfo || {};
//     lawyer.professionalInfo = profileData.professionalInfo || {};
//     lawyer.qualifications = profileData.qualifications || [];
//     lawyer.experience = profileData.experience || [];
//     // Optionally, set a flag if profile is complete
//     lawyer.isProfileComplete = true;
//     await lawyer.save();
//     res.status(200).json({
//       success: true,
//       message: 'Profile saved successfully',
//       lawyer: lawyer
//     });
//   } catch (error) {
//     console.error('Profile save error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error saving profile',
//       error: error.message
//     });
//   }
// });

// // Get Lawyer Profile
// router.get('/profile', auth, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const lawyer = await Lawyer.findOne({ userId }).populate('userId', 'email');

//     if (!lawyer) {
//       return res.status(404).json({
//         success: false,
//         message: 'Profile not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       lawyer: lawyer
//     });

//   } catch (error) {
//     console.error('Get profile error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching profile',
//       error: error.message
//     });
//   }
// });

// // Search Lawyers
// router.get('/search', async (req, res) => {
//   try {
//     const { 
//       query, 
//       practiceArea, 
//       city, 
//       minExperience, 
//       maxRate, 
//       isAvailable,
//       page = 1, 
//       limit = 10 
//     } = req.query;

//     // Build search criteria
//     let searchCriteria = {};

//     // Text search
//     if (query) {
//       searchCriteria.$text = { $search: query };
//     }

//     // Filter by practice area
//     if (practiceArea) {
//       searchCriteria['professionalInfo.practiceAreas'] = practiceArea;
//     }

//     // Filter by city
//     if (city) {
//       searchCriteria['personalInfo.city'] = new RegExp(city, 'i');
//     }

//     // Filter by experience
//     if (minExperience) {
//       searchCriteria['professionalInfo.yearsOfExperience'] = { 
//         $gte: parseInt(minExperience) 
//       };
//     }

//     // Filter by hourly rate
//     if (maxRate) {
//       searchCriteria['professionalInfo.hourlyRate'] = { 
//         $lte: parseFloat(maxRate) 
//       };
//     }

//     // Filter by availability
//     if (isAvailable === 'true') {
//       searchCriteria['professionalInfo.isAvailable'] = true;
//     }

//     // Only show complete profiles
//     searchCriteria.isProfileComplete = true;

//     const skip = (page - 1) * limit;

//     const lawyers = await Lawyer.find(searchCriteria)
//       .populate('userId', 'email')
//       .select('-__v')
//       .sort({ 'ratings.averageRating': -1, createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//     const total = await Lawyer.countDocuments(searchCriteria);

//     res.status(200).json({
//       success: true,
//       lawyers: lawyers,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(total / limit),
//         totalResults: total,
//         hasNext: page * limit < total
//       }
//     });

//   } catch (error) {
//     console.error('Search error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error searching lawyers',
//       error: error.message
//     });
//   }
// });

// // Get Single Lawyer Profile (Public)
// router.get('/:id', async (req, res) => {
//   try {
//     const lawyer = await Lawyer.findById(req.params.id)
//       .populate('userId', 'email')
//       .select('-__v');

//     if (!lawyer) {
//       return res.status(404).json({
//         success: false,
//         message: 'Lawyer not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       lawyer: lawyer
//     });

//   } catch (error) {
//     console.error('Get lawyer error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching lawyer profile',
//       error: error.message
//     });
//   }
// });

// // Helper function to check if profile is complete
// function isProfileComplete(lawyer) {
//   return !!(
//     lawyer.personalInfo?.firstName &&
//     lawyer.personalInfo?.lastName &&
//     lawyer.personalInfo?.city &&
//     lawyer.professionalInfo?.practiceAreas?.length > 0 &&
//     lawyer.professionalInfo?.yearsOfExperience >= 0 &&
//     lawyer.qualifications?.length > 0
//   );
// }

// module.exports = router;

const express = require('express');
const router = express.Router();
const Lawyer = require('../models/Lawyer');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth'); // Your existing auth middleware

// =======================
// Create or Update Lawyer Profile
// =======================
router.post(
  '/profile',
  auth,
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'certificate', maxCount: 5 }
  ]),
  async (req, res) => {
    try {
      // Parse profile data from form
      const profileData = JSON.parse(req.body.profileData || '{}');
      const files = req.files || {};

      // Attach uploaded files to profileData
      if (files.profilePicture && files.profilePicture[0]) {
        profileData.personalInfo = profileData.personalInfo || {};
        profileData.personalInfo.profilePicture = files.profilePicture[0].path;
      }

      if (files.certificate && profileData.qualifications) {
        files.certificate.forEach((file, index) => {
          if (profileData.qualifications[index]) {
            profileData.qualifications[index].certificateFile = file.path;
          }
        });
      }

      // Only update the logged-in user's profile (never create a new Lawyer here)
      const lawyerId = req.lawyer?._id || req.user?._id;
      if (!lawyerId) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated – no lawyer id on request'
        });
      }

      const lawyer = await Lawyer.findById(lawyerId);
      if (!lawyer) {
        return res.status(404).json({ success: false, message: 'Lawyer not found' });
      }

      // Update fields with merging logic
      if (profileData.personalInfo) {
        lawyer.personalInfo = {
          ...(lawyer.personalInfo?.toObject() || {}),
          ...profileData.personalInfo
        };
        // Keep top-level fullName in sync if possible
        if (profileData.personalInfo.firstName && profileData.personalInfo.lastName) {
          lawyer.fullName = `${profileData.personalInfo.firstName} ${profileData.personalInfo.lastName}`;
        }
      }

      if (profileData.professionalInfo) {
        lawyer.professionalInfo = {
          ...(lawyer.professionalInfo?.toObject() || {}),
          ...profileData.professionalInfo
        };
        // Sync specialization if updated in professional info
        if (profileData.professionalInfo.specialization) {
          lawyer.specialization = profileData.professionalInfo.specialization;
        }
      }

      if (profileData.qualifications) {
        lawyer.qualifications = profileData.qualifications;
      }

      if (profileData.experience) {
        lawyer.experience = profileData.experience;
      }

      // Explicitly mark as complete
      lawyer.isProfileComplete = true;

      // Force Mongoose to recognize changes in nested objects
      lawyer.markModified('personalInfo');
      lawyer.markModified('professionalInfo');
      lawyer.markModified('qualifications');
      lawyer.markModified('experience');

      const savedLawyer = await lawyer.save();

      res.status(200).json({
        success: true,
        message: 'Profile saved successfully',
        lawyer: savedLawyer
      });
    } catch (error) {
      console.error('Profile save error:', error);
      res.status(500).json({
        success: false,
        message: 'Error saving profile',
        error: error.message
      });
    }
  }
);

// =======================
// Get Lawyer Profile  ✅ FIXED
// =======================
router.get('/profile', auth, async (req, res) => {
  try {
    // Use the id that auth middleware attaches
    const lawyerId = req.lawyer?._id || req.user?._id;

    if (!lawyerId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated – no lawyer id on request'
      });
    }

    // If there is no separate User model relation, just find by _id
    const lawyer = await Lawyer.findById(lawyerId)
      .select('-password -loginAttempts -lockUntil');

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      lawyer
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

// =======================
// Perfect Match Algorithm
// =======================
router.get('/match', async (req, res) => {
  try {
    const { practiceArea, description, city } = req.query;

    if (!practiceArea) {
      return res.status(400).json({ success: false, message: 'Practice area is required' });
    }

    // 1. Get all potential lawyers in that field
    const areaRegex = new RegExp(practiceArea.trim(), 'i');
    const potentialLawyers = await Lawyer.find({
      $or: [
        { 'professionalInfo.practiceAreas': areaRegex },
        { 'specialization': areaRegex },
        { 'professionalInfo.specialization': areaRegex }
      ],
      isActive: true
    });

    if (potentialLawyers.length === 0) {
      return res.json({ success: true, match: null });
    }

    // 2. Score each lawyer
    const scoredLawyers = potentialLawyers.map(lawyer => {
      let score = 0;
      const details = [];

      // A. Keyword Match (Max 40 points)
      if (description) {
        const descLower = description.toLowerCase();
        const bioLower = (lawyer.personalInfo?.bio || '').toLowerCase();
        const specLower = (lawyer.specialization || '').toLowerCase();

        // Simple keyword match - can be expanded with more advanced NLP
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

      // B. Experience Score (Max 30 points)
      const exp = lawyer.professionalInfo?.yearsOfExperience || 0;
      const expScore = Math.min(exp * 2, 30);
      score += expScore;
      if (exp > 10) details.push('Highly experienced');

      // C. Ratings Score (Max 20 points)
      const rating = lawyer.ratings?.averageRating || 0;
      const ratingScore = rating * 4;
      score += ratingScore;
      if (rating >= 4.5) details.push('Top-rated professional');

      // D. Location Bonus (Max 10 points)
      if (city && lawyer.personalInfo?.city) {
        if (lawyer.personalInfo.city.toLowerCase() === city.toLowerCase()) {
          score += 10;
          details.push('Local specialist');
        }
      }

      // Final Math: Convert to Percentage (Max possible is 100)
      const matchPercentage = Math.round(score);

      return {
        ...lawyer.toObject(),
        matchScore: matchPercentage,
        matchDetails: details.slice(0, 2) // Top 2 reasons for match
      };
    });

    // 3. Sort and Return the Single Best Match
    scoredLawyers.sort((a, b) => b.matchScore - a.matchScore);
    const perfectMatch = scoredLawyers[0];

    res.json({
      success: true,
      match: perfectMatch
    });

  } catch (error) {
    console.error('Match error:', error);
    res.status(500).json({ success: false, message: 'Matching algorithm failed' });
  }
});

// =======================
// Search Lawyers
// =======================
router.get('/search', async (req, res) => {
  try {
    const {
      query,
      practiceArea,
      city,
      minExperience,
      maxRate,
      isAvailable,
      rating,
      page = 1,
      limit = 10,
      showAll = 'false'
    } = req.query;

    // Build search criteria
    let searchCriteria = {};

    // Text search
    if (query && query.trim()) {
      // Search in multiple fields for flexibility
      searchCriteria.$or = [
        { 'personalInfo.firstName': new RegExp(query, 'i') },
        { 'personalInfo.lastName': new RegExp(query, 'i') },
        { 'fullName': new RegExp(query, 'i') }, // Added fullName search
        { 'specialization': new RegExp(query, 'i') },
        { 'professionalInfo.practiceAreas': new RegExp(query, 'i') }
      ];
    }

    // Filter by practice area (check both practiceAreas array and specialization strings)
    if (practiceArea && practiceArea.trim()) {
      const areaRegex = { $regex: practiceArea.trim(), $options: 'i' };

      // If $or already exists (from query), we must use $and to combine them
      if (searchCriteria.$or) {
        searchCriteria.$and = [
          { $or: searchCriteria.$or },
          {
            $or: [
              { 'professionalInfo.practiceAreas': areaRegex },
              { 'specialization': areaRegex },
              { 'professionalInfo.specialization': areaRegex }
            ]
          }
        ];
        delete searchCriteria.$or;
      } else {
        searchCriteria.$or = [
          { 'professionalInfo.practiceAreas': areaRegex },
          { 'specialization': areaRegex },
          { 'professionalInfo.specialization': areaRegex }
        ];
      }
    }

    // Filter by city
    if (city && city.trim()) {
      searchCriteria['personalInfo.city'] = new RegExp(city, 'i');
    }

    // Filter by experience
    if (minExperience) {
      searchCriteria['professionalInfo.yearsOfExperience'] = {
        $gte: parseInt(minExperience)
      };
    }

    // Filter by hourly rate
    if (maxRate) {
      searchCriteria['professionalInfo.hourlyRate'] = {
        $lte: parseFloat(maxRate)
      };
    }

    // Filter by availability
    if (isAvailable === 'true') {
      searchCriteria['professionalInfo.isAvailable'] = true;
    }

    // Filter by minimum rating
    if (rating) {
      searchCriteria['ratings.averageRating'] = {
        $gte: parseFloat(rating)
      };
    }

    // Only show active lawyers
    searchCriteria.isActive = true;

    // For networking, we might want to show all verified lawyers even if profile isn't "complete"
    if (showAll === 'true') {
      // Still prefer verified emails to prevent spam appearing in network
      searchCriteria.isEmailVerified = true;
    } else {
      searchCriteria.isProfileComplete = true;
    }

    const skip = (page - 1) * limit;

    console.log('Search criteria:', JSON.stringify(searchCriteria, null, 2));

    const lawyers = await Lawyer.find(searchCriteria)
      .select('-password -loginAttempts -lockUntil -__v')
      .sort({ 'ratings.averageRating': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Lawyer.countDocuments(searchCriteria);

    console.log(`Found ${lawyers.length} lawyers, total: ${total}`);

    res.status(200).json({
      success: true,
      lawyers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        hasNext: page * limit < total
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching lawyers',
      error: error.message
    });
  }
});

// =======================
// Get Single Lawyer Profile (Public)
// =======================
router.get('/:id', async (req, res) => {
  try {
    console.log('Fetching lawyer details for ID:', req.params.id);
    const lawyer = await Lawyer.findById(req.params.id)
      .select('-password -loginAttempts -lockUntil -__v');

    if (!lawyer) {
      console.log('Lawyer not found for ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Lawyer not found'
      });
    }

    res.status(200).json({
      success: true,
      lawyer
    });

  } catch (error) {
    console.error('Get lawyer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lawyer profile',
      error: error.message
    });
  }
});

// Helper function to check if profile is complete
function isProfileComplete(lawyer) {
  return !!(
    lawyer.personalInfo?.firstName &&
    lawyer.personalInfo?.lastName &&
    lawyer.personalInfo?.city &&
    lawyer.professionalInfo?.practiceAreas?.length > 0 &&
    lawyer.professionalInfo?.yearsOfExperience >= 0 &&
    lawyer.qualifications?.length > 0
  );
}

module.exports = router;
