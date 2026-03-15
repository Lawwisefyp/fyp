const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/emailService');
const auth = require('../middleware/auth');

// @route   POST api/official-emails/send
// @desc    Send an official email to a contact
// @access  Private
router.post('/send', auth, async (req, res) => {
    try {
        const { to, subject, content } = req.body;

        if (!to || !subject || !content) {
            return res.status(400).json({
                success: false,
                error: 'Recipient, subject, and content are required.'
            });
        }

        const result = await sendEmail(to, subject, content);

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Official email sent successfully.'
            });
        } else {
            return res.status(500).json({
                success: false,
                error: result.error || 'Failed to send email.'
            });
        }
    } catch (error) {
        console.error('Official email route error:', error);
        res.status(500).json({ success: false, error: 'Server error while sending email.' });
    }
});

module.exports = router;
