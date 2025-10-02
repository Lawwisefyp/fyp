const express = require('express');
const router = express.Router();
const Case = require('../models/Case');

// Add new case
router.post('/', async (req, res) => {
  try {
    const caseData = req.body;
    const newCase = new Case(caseData);
    await newCase.save();
    res.status(201).json({ success: true, case: newCase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all cases
router.get('/', async (req, res) => {
  try {
    const cases = await Case.find();
    res.status(200).json({ success: true, cases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
