const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// Generate unique case ID
function generateCaseId() {
  return 'CASE-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// File case with document uploads (E-Filing)
router.post('/file', auth, upload.array('documents', 10), async (req, res) => {
  try {
    const {
      caseType,
      title,
      client,
      clientEmail,
      clientPhone,
      opposingParty,
      court,
      jurisdiction,
      filingDate,
      description
    } = req.body;

    // Validate required fields
    if (!caseType || !title || !client || !clientEmail || !opposingParty || !court || !jurisdiction || !filingDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    // Check if at least one document is uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one document must be uploaded'
      });
    }

    const caseId = generateCaseId();
    const documents = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      filepath: file.path,
      uploadDate: new Date(),
      fileSize: file.size,
      documentType: file.mimetype
    }));

    // Associate with lawyer if user is a lawyer
    // For Marketplace/E-Filing module, cases should start unassigned regardless of who files them
    const lawyerId = null;

    const newCase = new Case({
      id: caseId,
      caseType,
      title,
      client,
      clientEmail,
      clientPhone,
      opposingParty,
      lawyerId,
      court,
      jurisdiction,
      filingDate,
      description,
      documents,
      status: 'filed',
      currentStage: 0,
      createdDate: new Date(),
      lastUpdateDate: new Date().toISOString().split('T')[0]
    });

    await newCase.save();

    // Notify lawyer if associated
    if (lawyerId) {
      const filingNotif = new Notification({
        toLawyerId: lawyerId,
        title: '📂 New Case Filed',
        message: `A new case "${title}" has been filed by client "${client}".`,
        type: 'reminder',
        status: 'unread'
      });
      await filingNotif.save();
    }

    res.status(201).json({
      success: true,
      message: 'Case filed successfully',
      caseId: caseId,
      case: newCase
    });

  } catch (error) {
    // Clean up uploaded files if database save fails
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error filing case: ' + error.message
    });
  }
});

// Get all unassigned cases (Marketplace for lawyers)
router.get('/unassigned', auth, async (req, res) => {
  try {
    if (req.role !== 'lawyer') {
      return res.status(403).json({ success: false, message: 'Only lawyers can access the marketplace' });
    }

    const lawyer = req.user;
    const unassignedCases = await Case.find({ lawyerId: null, status: 'filed' }).sort({ createdDate: -1 });

    // Define keywords for each case type
    const typeToSpec = {
      'civil': ['civil'],
      'criminal': ['criminal'],
      'family': ['family'],
      'corporate': ['corporate', 'business'],
      'labor': ['labor', 'employment'],
      'intellectual': ['intellectual', 'patent', 'trademark', 'copyright']
    };

    // Extract lawyer's specializations and practice areas
    const specArray = [];
    if (lawyer.specialization) specArray.push(lawyer.specialization.toLowerCase());
    if (lawyer.professionalInfo?.specialization) specArray.push(lawyer.professionalInfo.specialization.toLowerCase());
    if (lawyer.professionalInfo?.practiceAreas) {
      lawyer.professionalInfo.practiceAreas.forEach(area => specArray.push(area.toLowerCase()));
    }

    const uniqueLawyerSpecs = [...new Set(specArray)];

    // Filter cases based on lawyer's expertise
    const filteredCases = unassignedCases.filter(c => {
      const keywords = typeToSpec[c.caseType] || [c.caseType.toLowerCase()];
      // Check if any of the lawyer's specializations contain any of the case's keywords
      return uniqueLawyerSpecs.some(spec => keywords.some(kw => spec.includes(kw)));
    });

    res.status(200).json({
      success: true,
      cases: filteredCases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching marketplace: ' + error.message
    });
  }
});

// Claim an unassigned case
router.post('/claim/:caseId', auth, async (req, res) => {
  try {
    if (req.role !== 'lawyer') {
      return res.status(403).json({ success: false, message: 'Only lawyers can claim cases' });
    }

    const caseData = await Case.findOne({ id: req.params.caseId, lawyerId: null });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found or already assigned'
      });
    }

    caseData.lawyerId = req.user._id;
    caseData.status = 'assigned';
    caseData.lastUpdateDate = new Date().toISOString().split('T')[0];

    await caseData.save();

    // Notify lawyer
    const claimNotif = new Notification({
      toLawyerId: req.user._id,
      title: '💼 Case Claimed',
      message: `You have successfully claimed the case "${caseData.title}".`,
      type: 'reminder',
      status: 'unread'
    });
    await claimNotif.save();

    res.status(200).json({
      success: true,
      message: 'Case claimed successfully',
      case: caseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error claiming case: ' + error.message
    });
  }
});

// Get all cases (contextual based on user)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.role === 'lawyer') {
      query = { lawyerId: req.user._id };
    } else if (req.role === 'client') {
      query = { clientEmail: req.user.email };
    }

    const cases = await Case.find(query).sort({ createdDate: -1 });
    res.status(200).json({
      success: true,
      cases: cases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get case by ID
router.get('/:caseId', auth, async (req, res) => {
  try {
    const caseData = await Case.findOne({ id: req.params.caseId });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Verify access
    if (req.user.role === 'lawyer' && caseData.lawyerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.status(200).json({
      success: true,
      case: caseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update case details
router.put('/:caseId', auth, async (req, res) => {
  try {
    const { title, opposingParty, court, judge, jurisdiction, nextHearingDate, description } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (opposingParty) updateData.opposingParty = opposingParty;
    if (court) updateData.court = court;
    if (judge) updateData.judge = judge;
    if (jurisdiction) updateData.jurisdiction = jurisdiction;
    if (nextHearingDate) updateData.nextHearingDate = nextHearingDate;
    if (description) updateData.description = description;
    updateData.lastUpdateDate = new Date().toISOString().split('T')[0];

    const caseData = await Case.findOneAndUpdate(
      { id: req.params.caseId, lawyerId: req.user._id },
      updateData,
      { new: true }
    );

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found or unauthorized'
      });
    }

    // If nextHearingDate was updated, create a notification
    if (nextHearingDate) {
      const reminder = new Notification({
        toLawyerId: req.user._id,
        title: '⚖️ New Hearing Scheduled',
        message: `A new hearing for "${caseData.title}" has been set for ${new Date(nextHearingDate).toLocaleDateString()}.`,
        type: 'hearing_reminder',
        status: 'unread'
      });
      await reminder.save();
    }

    res.status(200).json({
      success: true,
      message: 'Case updated successfully',
      case: caseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete case
router.delete('/:caseId', auth, async (req, res) => {
  try {
    const caseData = await Case.findOneAndDelete({ id: req.params.caseId, lawyerId: req.user._id });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found or unauthorized'
      });
    }

    // Delete associated documents
    if (caseData.documents && caseData.documents.length > 0) {
      caseData.documents.forEach(doc => {
        fs.unlink(doc.filepath, (err) => {
          if (err) console.error('Error deleting document:', err);
        });
      });
    }

    res.status(200).json({
      success: true,
      message: 'Case deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Download case document
router.get('/:caseId/documents/:documentId', auth, async (req, res) => {
  try {
    const caseData = await Case.findOne({ id: req.params.caseId });

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Verify access
    if (req.user.role === 'lawyer' && caseData.lawyerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const document = caseData.documents.find(doc => doc.filename === req.params.documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    if (!fs.existsSync(document.filepath)) {
      return res.status(404).json({
        success: false,
        message: 'Document file not found on server'
      });
    }

    res.download(document.filepath, document.originalName);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add new case (traditional method)
router.post('/', auth, async (req, res) => {
  try {
    const caseData = req.body;
    const caseId = generateCaseId();

    const newCase = new Case({
      ...caseData,
      id: caseId,
      lawyerId: req.user._id,
      status: 'filed',
      createdDate: new Date(),
      lastUpdateDate: new Date().toISOString().split('T')[0]
    });

    await newCase.save();
    res.status(201).json({
      success: true,
      case: newCase
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update Case Stage/Progress
router.put('/:caseId/progress', auth, async (req, res) => {
  try {
    const { stageId } = req.body;

    // Find case and verify lawyer ownership
    const caseData = await Case.findOne({ id: req.params.caseId, lawyerId: req.user._id });

    if (!caseData) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const completionDate = new Date().toISOString().split('T')[0];

    // Check if stage already completed to avoid duplicates
    const isAlreadyCompleted = caseData.stageHistory.some(s => s.stageId === stageId);

    if (!isAlreadyCompleted) {
      caseData.stageHistory.push({
        stageId: stageId,
        completedDate: completionDate
      });
      caseData.completedStages.push(stageId);
    }

    caseData.currentStage = stageId;
    caseData.lastUpdateDate = completionDate;

    // Auto-update status based on stage
    if (stageId === 1) caseData.status = 'filed';
    if (stageId >= 2 && stageId <= 5) caseData.status = 'in-progress';
    if (stageId >= 6 && stageId <= 8) caseData.status = 'hearings';
    if (stageId === 9) caseData.status = 'completed';

    await caseData.save();

    res.status(200).json({
      success: true,
      message: `Stage ${stageId} marked as completed`,
      case: caseData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
