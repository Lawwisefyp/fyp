const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');
const { syncUserNotifications } = require('./notification');

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
      description,
      budget,
      priority,
      consultationRequested,
      consultationDate,
      consultationTime
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
      budget: parseFloat(budget) || 0,
      priority: priority || 'medium',
      consultation: {
        requested: consultationRequested === 'true' || consultationRequested === true,
        date: consultationDate,
        time: consultationTime
      },
      documents,
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
    const unassignedCases = await Case.find({ lawyerId: null, status: 'pending' }).sort({ createdDate: -1 });

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

// Helper: compute real-time status from deadline state
function computeCaseStatus(deadlines) {
  if (!deadlines || deadlines.length === 0) return 'pending';
  // Note: Lawyer must manually mark case as 'completed' via the PATCH route
  return 'active';
}

// Update case details (handles field edits + deadline isCompleted patches)
router.put('/:caseId', auth, async (req, res) => {
  try {
    const { title, opposingParty, court, judge, jurisdiction, nextHearingDate, description, deadlines } = req.body;
    const caseData = await Case.findOne({ id: req.params.caseId, lawyerId: req.user._id });

    if (!caseData) {
      return res.status(404).json({ success: false, message: 'Case not found or unauthorized' });
    }

    // Basic field updates
    if (title) caseData.title = title;
    if (opposingParty) caseData.opposingParty = opposingParty;
    if (court) caseData.court = court;
    if (judge) caseData.judge = judge;
    if (jurisdiction) caseData.jurisdiction = jurisdiction;
    if (nextHearingDate !== undefined) caseData.nextHearingDate = nextHearingDate;
    if (description) caseData.description = description;

    // Patch individual deadlines by _id (preserves documents attached to each deadline)
    if (deadlines && Array.isArray(deadlines)) {
      // Only update isCompleted flag to avoid wiping documents
      deadlines.forEach(incoming => {
        const existing = caseData.deadlines.find(
          d => d._id.toString() === (incoming._id || '').toString()
        );
        if (existing) {
          if (incoming.isCompleted !== undefined) existing.isCompleted = incoming.isCompleted;
          if (incoming.title) existing.title = incoming.title;
          if (incoming.dueDate) existing.dueDate = incoming.dueDate;
        }
      });

      // Auto-compute status only when not already manually forced to 'completed'
      if (caseData.status !== 'completed') {
        caseData.status = computeCaseStatus(caseData.deadlines);
      }
    }

    // Ensure status is valid (migration for old data)
    const allowedStatuses = ['pending', 'active', 'completed'];
    if (!allowedStatuses.includes(caseData.status)) {
      caseData.status = computeCaseStatus(caseData.deadlines);
    }

    caseData.lastUpdateDate = new Date().toISOString().split('T')[0];
    await caseData.save();

    // Trigger sync for any new dates
    await syncUserNotifications(req.user._id);

    res.status(200).json({ success: true, message: 'Case updated successfully', case: caseData });
  } catch (error) {
    console.error('Case update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /:caseId/status — lawyer manually marks case as completed
router.patch('/:caseId/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'active', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Allowed: pending, active, completed' });
    }

    const caseData = await Case.findOne({ id: req.params.caseId, lawyerId: req.user._id });
    if (!caseData) {
      return res.status(404).json({ success: false, message: 'Case not found or unauthorized' });
    }

    caseData.status = status;
    caseData.lastUpdateDate = new Date().toISOString().split('T')[0];
    await caseData.save();

    res.status(200).json({ success: true, message: `Case status updated to '${status}'`, case: caseData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    // Verify access - lawyer must own this case
    if (req.user.role === 'lawyer' && caseData.lawyerId) {
      const lawyerIdStr = String(caseData.lawyerId);
      const userIdStr = String(req.user._id);
      if (lawyerIdStr !== userIdStr) {
        console.error(`Auth mismatch: Case ${caseData.id} belongs to ${lawyerIdStr}, requested by ${userIdStr}`);
        return res.status(403).json({ success: false, message: 'Access denied: You are not the owner of this case' });
      }
    }

    // Search in main case documents
    let document = caseData.documents.find(doc => doc.filename === req.params.documentId);

    // If not found, search in deadlines/reminders
    if (!document && caseData.deadlines) {
      for (const deadline of caseData.deadlines) {
        const found = deadline.documents?.find(doc => doc.filename === req.params.documentId);
        if (found) {
          document = found;
          break;
        }
      }
    }

    if (!document) {
      console.error(`Document ${req.params.documentId} not found in case ${req.params.caseId}`);
      return res.status(404).json({
        success: false,
        message: 'Document not found in database record'
      });
    }

    console.log(`Attempting to download: ${document.filepath}`);

    if (!document.filepath || !fs.existsSync(document.filepath)) {
      console.error(`File missing on disk: ${document.filepath}`);
      return res.status(404).json({
        success: false,
        message: 'Document file not found on server storage'
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

// View case document inline
router.get('/:caseId/documents/:documentId/view', auth, async (req, res) => {
  try {
    const caseData = await Case.findOne({ id: req.params.caseId });
    if (!caseData) return res.status(404).json({ success: false, message: 'Case not found' });

    // Verify access - lawyer must own this case
    if (req.user.role === 'lawyer' && caseData.lawyerId) {
      const lawyerIdStr = String(caseData.lawyerId);
      const userIdStr = String(req.user._id);
      if (lawyerIdStr !== userIdStr) {
        return res.status(403).json({ success: false, message: 'Access denied to this case' });
      }
    }

    let document = caseData.documents.find(doc => doc.filename === req.params.documentId);
    if (!document && caseData.deadlines) {
      for (const deadline of caseData.deadlines) {
        const found = deadline.documents?.find(doc => doc.filename === req.params.documentId);
        if (found) { document = found; break; }
      }
    }

    if (!document || !fs.existsSync(document.filepath)) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    res.sendFile(path.resolve(document.filepath));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

// Add reminder with documents
router.post('/:caseId/reminders', auth, upload.array('documents', 5), async (req, res) => {
  try {
    const { title, dueDate, description } = req.body;
    const caseData = await Case.findOne({ id: req.params.caseId, lawyerId: req.user._id });

    if (!caseData) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const reminderDocuments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      filepath: file.path
    })) : [];

    const newReminder = {
      title,
      dueDate,
      description,
      isCompleted: false,
      documents: reminderDocuments
    };

    caseData.deadlines.push(newReminder);

    // Auto-update status when adding a reminder
    if (caseData.status !== 'completed') {
      caseData.status = computeCaseStatus(caseData.deadlines);
    } else {
      // If case was completed but we are adding a reminder, maybe it should be active again?
      // User said "case should only be closed hwen the lawyer itself clicked"
      // So if it was manually completed, we keep it completed unless lawyer changes it?
      // For now, let's keep it 'completed' as per the manual-only rule.
    }

    caseData.lastUpdateDate = new Date().toISOString().split('T')[0];

    // Migration: If status is still an old value, force it to a valid one
    const allowed = ['pending', 'active', 'completed'];
    if (!allowed.includes(caseData.status)) {
      caseData.status = computeCaseStatus(caseData.deadlines);
    }

    await caseData.save();

    // Trigger sync for the newly added reminder
    await syncUserNotifications(req.user._id);

    res.status(201).json({
      success: true,
      message: 'Reminder added successfully',
      reminder: caseData.deadlines[caseData.deadlines.length - 1],
      case: caseData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a reminder
router.delete('/:caseId/reminders/:reminderId', auth, async (req, res) => {
  try {
    const caseData = await Case.findOne({ id: req.params.caseId, lawyerId: req.user._id });
    if (!caseData) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const reminderIndex = caseData.deadlines.findIndex(d => d._id.toString() === req.params.reminderId);
    if (reminderIndex === -1) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    // Delete associated files from storage
    const reminder = caseData.deadlines[reminderIndex];
    if (reminder.documents && reminder.documents.length > 0) {
      reminder.documents.forEach(doc => {
        if (doc.filepath && fs.existsSync(doc.filepath)) {
          fs.unlinkSync(doc.filepath);
        }
      });
    }

    caseData.deadlines.splice(reminderIndex, 1);
    caseData.lastUpdateDate = new Date().toISOString().split('T')[0];
    await caseData.save();

    res.json({ success: true, message: 'Reminder deleted successfully', case: caseData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
