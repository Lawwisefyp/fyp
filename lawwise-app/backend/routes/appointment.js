const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Lawyer = require('../models/Lawyer');
const auth = require('../middleware/auth');
const { createNotification } = require('./notification');

// Get lawyer's available slots
router.get('/lawyer/:lawyerId/slots', auth, async (req, res) => {
  try {
    const lawyer = await Lawyer.findById(req.params.lawyerId);
    if (!lawyer) return res.status(404).json({ success: false, message: 'Lawyer not found' });
    
    // For demo purposes, if no availability is set, provide defaults
    const availability = (lawyer.professionalInfo?.availability && lawyer.professionalInfo.availability.length > 0) 
      ? lawyer.professionalInfo.availability 
      : [
          { day: 'Monday', slots: [{ time: '10:00 AM' }, { time: '11:00 AM' }, { time: '02:00 PM' }] },
          { day: 'Tuesday', slots: [{ time: '09:00 AM' }, { time: '11:00 AM' }, { time: '03:00 PM' }] },
          { day: 'Wednesday', slots: [{ time: '10:00 AM' }, { time: '12:00 PM' }, { time: '04:00 PM' }] },
          { day: 'Thursday', slots: [{ time: '11:00 AM' }, { time: '01:00 PM' }, { time: '05:00 PM' }] },
          { day: 'Friday', slots: [{ time: '10:00 AM' }, { time: '02:00 PM' }, { time: '04:00 PM' }] }
        ];

    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Book an appointment
router.post('/book', auth, async (req, res) => {
  try {
    const { lawyerId, caseId, date, timeSlot, notes } = req.body;
    
    const appointment = new Appointment({
      clientId: req.user._id,
      lawyerId,
      caseId,
      date,
      timeSlot,
      notes,
      status: 'confirmed' // Auto-confirm for demo
    });

    await appointment.save();

    // 2. Mark the slot as booked in Lawyer's profile
    const lawyer = await Lawyer.findById(lawyerId);
    if (lawyer && lawyer.professionalInfo?.availability) {
      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      const dayData = lawyer.professionalInfo.availability.find(d => d.day === dayName);
      if (dayData) {
        const slot = dayData.slots.find(s => s.time === timeSlot);
        if (slot) slot.isBooked = true;
        await lawyer.save();
      }
    }

    // 3. Notify Lawyer
    await createNotification({
      recipient: lawyerId,
      recipientModel: 'Lawyer',
      type: 'appointment',
      title: 'New Consultation Booked!',
      message: `A client has booked a consultation for ${new Date(date).toLocaleDateString()} at ${timeSlot}.`,
      relatedId: appointment._id,
      onModel: 'Appointment'
    });

    res.json({ success: true, appointment, message: 'Appointment booked successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's appointments
router.get('/my-appointments', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ 
      $or: [{ clientId: req.user._id }, { lawyerId: req.user._id }] 
    })
    .populate('lawyerId', 'fullName specialization')
    .populate('clientId', 'fullName')
    .sort({ date: 1 });

    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
