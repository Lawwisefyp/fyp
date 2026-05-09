const express = require('express');
const router = express.Router();
const CaseRequest = require('../models/CaseRequest');
const Lawyer = require('../models/Lawyer');
const Connection = require('../models/Connection');
const Case = require('../models/Case');
const Message = require('../models/Message');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const { analyzeCaseRequest } = require('../services/aiService');

// Generate unique ID
function generateRequestId() {
  return 'REQ-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Generate Formatted Case ID: CASE-2026-1045
function generateCaseId() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `CASE-${year}-${random}`;
}

// File a new Case Request
router.post('/file', auth, upload.array('documents', 10), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      urgency,
      opponentDetails,
      location,
      budget
    } = req.body;

    if (!title || !description || !urgency || !location) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const requestId = generateRequestId();
    const caseId = generateCaseId();
    
    const evidence = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      filepath: file.path,
      uploadDate: new Date(),
      fileSize: file.size,
      fileType: file.mimetype
    }));

    // Perform AI Analysis
    console.log(`Starting AI analysis for request ${requestId}...`);
    let aiResults;
    try {
      aiResults = await analyzeCaseRequest({
        title,
        description,
        category,
        location
      });
    } catch (aiError) {
      console.error("AI Analysis Failed, using fallback:", aiError);
      aiResults = {
        predictedCategory: category || "General Law",
        predictedPriority: urgency || "normal",
        aiSummary: description.substring(0, 150) + "...",
        aiKeywords: ["Legal"]
      };
    }

    const newRequest = new CaseRequest({
      id: requestId,
      caseId: caseId, // New formatted ID
      title,
      description,
      category: category || 'civil',
      urgency,
      opponentDetails,
      location,
      budget: parseFloat(budget) || 0,
      clientId: req.user._id,
      clientInfo: {
        name: req.user.fullName,
        email: req.user.email,
        phone: req.user.phoneNumber
      },
      evidence,
      status: 'analyzed', // Set to analyzed since we did it on the fly
      aiAnalysis: {
        summary: aiResults.aiSummary,
        predictedCategory: aiResults.predictedCategory,
        predictedPriority: aiResults.predictedPriority,
        keywords: aiResults.aiKeywords,
        analyzedAt: new Date()
      }
    });

    await newRequest.save();

    // Find recommended lawyers based on AI predicted category
    let suggestedLawyers = [];
    try {
      // Use a more focused regex or exact match if possible, but regex 'i' is usually good for variations
      const categoryRegex = new RegExp(aiResults.predictedCategory, 'i');
      
      suggestedLawyers = await Lawyer.find({
        $or: [
          { specialization: categoryRegex },
          { 'professionalInfo.practiceAreas': categoryRegex }
        ],
        isActive: true
      })
      .sort({ 'ratings.averageRating': -1, 'professionalInfo.yearsOfExperience': -1 }) // Best ratings first, then most experience
      .limit(6) // Fetch a few more to filter if needed
      .select('fullName specialization personalInfo professionalInfo ratings');

      // Final strict filter: Ensure the specialization or at least one practice area contains the category keywords
      const commonWords = ['law', 'specialist', 'expert', 'case', 'practitioner', 'attorney', 'legal'];
      const searchKeywords = aiResults.predictedCategory.split(' ')
        .filter(kw => kw.length > 2 && !commonWords.includes(kw.toLowerCase()));
      
      suggestedLawyers = suggestedLawyers.filter(lawyer => {
        const spec = (lawyer.specialization || '').toLowerCase();
        const areas = (lawyer.professionalInfo?.practiceAreas || []).map(a => a.toLowerCase());
        // Match if ANY of the specific keywords (Family, Criminal, etc.) are found
        return searchKeywords.some(kw => spec.includes(kw.toLowerCase()) || areas.some(area => area.includes(kw.toLowerCase())));
      }).slice(0, 4); // Take top 4 after filtering

      // Check connection status for each suggested lawyer
      const suggestedWithStatus = await Promise.all(suggestedLawyers.map(async (lawyer) => {
        const connection = await Connection.findOne({
          client: req.user._id,
          lawyer: lawyer._id
        });
        return {
          ...lawyer.toObject(),
          connectionStatus: connection ? connection.status : 'not_connected'
        };
      }));
      suggestedLawyers = suggestedWithStatus;

    } catch (lawyerErr) {
      console.error("Failed to fetch suggested lawyers:", lawyerErr);
    }

    res.status(201).json({
      success: true,
      message: 'Case request submitted and analyzed successfully',
      requestId: requestId,
      caseId: caseId,
      analysis: aiResults,
      suggestedLawyers: suggestedLawyers
    });
  } catch (error) {
    console.error('Case Request Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during submission' });
  }
});

// Get client's requests
router.get('/my-requests', auth, async (req, res) => {
  try {
    const requests = await CaseRequest.find({ clientId: req.user._id })
      .populate('assignedLawyerId', 'fullName specialization personalInfo.profilePicture')
      .sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    console.error('Fetch my-requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
});

// --- LAWYER ENDPOINTS ---

// Get requests for the lawyer's marketplace
router.get('/marketplace', auth, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const lawyerId = req.user._id;
    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) return res.status(404).json({ success: false, message: 'Lawyer not found' });

    // Build the query to include:
    // 1. Cases explicitly assigned to this lawyer
    // 2. Cases matching specialization (general marketplace)
    const categoryRegex = new RegExp(lawyer.specialization || 'NO_SPEC', 'i');
    
    const requests = await CaseRequest.find({
      $or: [
        { assignedLawyerId: lawyerId, status: { $in: ['analyzed', 'pending_review', 'pending'] } },
        { category: categoryRegex, status: 'analyzed' }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Marketplace Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch marketplace requests' });
  }
});

// Assign a request to a specific lawyer (Client action)
router.post('/assign-lawyer', auth, async (req, res) => {
  try {
    const { requestId, lawyerId } = req.body;
    if (!requestId || !lawyerId) {
      return res.status(400).json({ success: false, message: 'Request ID and Lawyer ID are required' });
    }

    const request = await CaseRequest.findOne({ id: requestId });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.assignedLawyerId = lawyerId;
    request.status = 'pending_review'; // Change status to show it's now with a lawyer
    await request.save();

    // Silently update/create connection to 'pending' if it was rejected or didn't exist
    // This ensures the client UI shows "Pending" and the lawyer sees it in the marketplace
    await Connection.findOneAndUpdate(
      { client: request.clientId, lawyer: lawyerId },
      { status: 'pending', updatedAt: new Date() },
      { upsert: true }
    );

    res.json({ success: true, message: 'Case request sent directly to lawyer' });
  } catch (error) {
    console.error('Assign Error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign lawyer' });
  }
});

// Respond to a request (Accept/Reject)
router.post('/:id/respond', auth, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { status, lawyerNote } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const request = await CaseRequest.findOne({ id: req.params.id });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.status = status;
    request.lawyerNote = lawyerNote;
    request.respondedAt = new Date();

    await request.save();

    // Automatically create/update connection when a case is accepted
    if (status === 'accepted') {
      // 1. Update Connection
      await Connection.findOneAndUpdate(
        { client: request.clientId, lawyer: req.user._id },
        { status: 'accepted', updatedAt: new Date() },
        { upsert: true }
      );

      // 2. Create actual Case record for tracking
      const newCase = new Case({
        id: request.caseId || `CASE-${Date.now()}`,
        title: request.title,
        description: request.description,
        client: request.clientInfo?.name,
        clientEmail: request.clientInfo?.email,
        clientPhone: request.clientInfo?.phone,
        lawyerId: req.user._id,
        caseType: request.category || 'civil',
        priority: request.urgency || 'medium',
        budget: request.budget || 0,
        status: 'active',
        createdDate: new Date(),
        documents: request.evidence.map(e => ({
          filename: e.filename,
          originalName: e.originalName,
          filepath: e.filepath,
          uploadDate: e.uploadDate,
          fileSize: e.fileSize,
          documentType: 'initial_evidence'
        }))
      });
      await newCase.save();

      // 3. Notify Client
      const { createNotification } = require('./notification');
      await createNotification({
        recipient: request.clientId,
        recipientModel: 'Client',
        type: 'accepted',
        title: 'Case Request Accepted!',
        message: `Lawyer ${req.user.fullName} has accepted your request: ${request.title}. You can now start communicating.`,
        relatedId: newCase._id,
        onModel: 'Case'
      });

      // 4. Send the lawyer's note as the first chat message if provided
      if (lawyerNote) {
        const welcomeMessage = new Message({
          senderId: req.user._id,
          senderModel: 'Lawyer',
          receiverId: request.clientId,
          receiverModel: 'Client',
          content: lawyerNote
        });
        await welcomeMessage.save();
      }

    } else if (status === 'rejected') {
      // If rejected, we might want to un-assign or mark connection as rejected
      await Connection.findOneAndUpdate(
        { client: request.clientId, lawyer: req.user._id, status: 'pending' },
        { status: 'rejected', updatedAt: new Date() }
      );
    }

    res.json({ success: true, message: `Request ${status} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to respond to request' });
  }
});

module.exports = router;
