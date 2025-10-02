const express = require('express');
const router = express.Router();
const Lawyer = require('../models/Lawyer');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth'); // Your existing auth middleware

// Create or Update Lawyer Profile
router.post('/profile', auth, upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'certificate', maxCount: 5 }
]), async (req, res) => {
  try {
    // Parse profile data from form
    const profileData = JSON.parse(req.body.profileData);
    const files = req.files;
    // Attach uploaded files to profileData
    if (files.profilePicture) {
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
    const lawyer = await Lawyer.findById(req.lawyer._id);
    if (!lawyer) {
      return res.status(404).json({ success: false, message: 'Lawyer not found' });
    }
    // Update only nested fields
    lawyer.personalInfo = profileData.personalInfo || {};
    lawyer.professionalInfo = profileData.professionalInfo || {};
    lawyer.qualifications = profileData.qualifications || [];
    lawyer.experience = profileData.experience || [];
    // Optionally, set a flag if profile is complete
    lawyer.isProfileComplete = true;
    await lawyer.save();
    res.status(200).json({
      success: true,
      message: 'Profile saved successfully',
      lawyer: lawyer
    });
  } catch (error) {
    console.error('Profile save error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving profile',
      error: error.message
    });
  }
});

// Get Lawyer Profile
router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const lawyer = await Lawyer.findOne({ userId }).populate('userId', 'email');
    
    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      lawyer: lawyer
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

// Search Lawyers
router.get('/search', async (req, res) => {
  try {
    const { 
      query, 
      practiceArea, 
      city, 
      minExperience, 
      maxRate, 
      isAvailable,
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build search criteria
    let searchCriteria = {};
    
    // Text search
    if (query) {
      searchCriteria.$text = { $search: query };
    }
    
    // Filter by practice area
    if (practiceArea) {
      searchCriteria['professionalInfo.practiceAreas'] = practiceArea;
    }
    
    // Filter by city
    if (city) {
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
    
    // Only show complete profiles
    searchCriteria.isProfileComplete = true;
    
    const skip = (page - 1) * limit;
    
    const lawyers = await Lawyer.find(searchCriteria)
      .populate('userId', 'email')
      .select('-__v')
      .sort({ 'ratings.averageRating': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Lawyer.countDocuments(searchCriteria);
    
    res.status(200).json({
      success: true,
      lawyers: lawyers,
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

// Get Single Lawyer Profile (Public)
router.get('/:id', async (req, res) => {
  try {
    const lawyer = await Lawyer.findById(req.params.id)
      .populate('userId', 'email')
      .select('-__v');
    
    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer not found'
      });
    }
    
    res.status(200).json({
      success: true,
      lawyer: lawyer
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