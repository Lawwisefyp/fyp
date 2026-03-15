const nodemailer = require('nodemailer');
const dns = require('dns').promises;

let transporter;

// List of common domains to check for typos
const TYPO_DOMAINS = {
    'gmal.com': 'gmail.com',
    'gmil.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gnail.com': 'gmail.com',
    'gmaill.com': 'gmail.com',
    'outlook.co': 'outlook.com',
    'outlok.com': 'outlook.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com'
};

// Expanded list of common disposable email domains
const DISPOSABLE_DOMAINS = [
    'mailinator.com', 'yopmail.com', 'guerrillamail.com', 'temp-mail.org',
    '10minutemail.com', 'getairmail.com', 'sharklasers.com', 'dispostable.com',
    'maildrop.cc', 'meltmail.com', 'trashmail.com', 'tempmail.com',
    'fakeinbox.com', 'mailness.com', 'disposable.com', 'temp-mail.com'
];

/**
 * Checks if an email is "authentic" using regex, domain checks, and typo detection.
 */
const checkAuthenticEmail = async (email) => {
    if (!email) return { success: false, error: 'Email is required.' };

    email = email.toLowerCase().trim();

    // 1. Basic Format Validation (Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { success: false, error: 'Invalid email format.' };
    }

    const [prefix, domain] = email.split('@');
    if (!domain) return { success: false, error: 'Invalid email domain.' };

    // 2. Check for "test" or "spam" patterns in prefix
    const spamPatterns = ['test', 'spam', 'fake', 'admin', 'noreply', '123456'];
    if (spamPatterns.includes(prefix) || prefix.length < 3) {
        return {
            success: false,
            error: 'This email address looks like a test or generic account. Please use a real official email.'
        };
    }

    // 3. Typo Detection
    if (TYPO_DOMAINS[domain]) {
        return {
            success: false,
            error: `Did you mean "${prefix}@${TYPO_DOMAINS[domain]}"? Please correct the typo.`
        };
    }

    // 4. Check if it's a known disposable domain
    if (DISPOSABLE_DOMAINS.includes(domain)) {
        return {
            success: false,
            error: 'We do not accept registrations from temporary or disposable email providers. Please use a permanent email address.'
        };
    }

    // 5. DNS Verification (MX Records)
    try {
        const mxRecords = await dns.resolveMx(domain);
        if (!mxRecords || mxRecords.length === 0) {
            return {
                success: false,
                error: `The domain "${domain}" does not appear to have valid mail servers. Please check for typos.`
            };
        }
    } catch (err) {
        console.warn(`DNS lookup failed for ${domain}:`, err.message);
        if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
            return {
                success: false,
                error: `The email domain "${domain}" could not be found or is invalid. Please use a real email address.`
            };
        }
    }

    return { success: true };
};


const initTransporter = async () => {
    if (transporter) return transporter;

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // Reject placeholders
    if (!smtpUser || smtpUser === 'your-email@gmail.com' || !smtpPass || smtpPass === 'your-gmail-app-password') {
        throw new Error('Email service is not configured. Please set real SMTP credentials in the .env file.');
    }

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 465,
        secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
        auth: {
            user: smtpUser,
            pass: smtpPass
        },
        // Force IPv4 to avoid ECONNREFUSED on IPv6
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP connection verified');
    } catch (err) {
        console.error('❌ SMTP verification failed:', err.message);
        throw new Error('Failed to connect to email server. Check your credentials.');
    }

    return transporter;
};

const sendEmail = async (to, subject, html) => {
    try {
        // First check for authentic email domain
        const validation = await checkAuthenticEmail(to);
        if (!validation.success) {
            return {
                success: false,
                error: validation.error
            };
        }

        const mailTransporter = await initTransporter();
        const mailOptions = {
            from: `"Lawwise" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        };

        const info = await mailTransporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${to}: ${info.messageId}`);

        return { success: true, info };
    } catch (error) {
        console.error('❌ Email send error:', error.message);
        return { success: false, error: error.message };
    }
};

const sendLoginNotification = async (email, name) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #0f172a;">Login Notification</h2>
            <p>Hello <b>${name}</b>,</p>
            <p>This is to inform you that you have just logged into your <b>Lawwise</b> account.</p>
            <p>If this wasn't you, please change your password immediately.</p>
            <br>
            <p>Best regards,<br>The Lawwise Team</p>
        </div>
    `;
    return sendEmail(email, 'Lawwise Login Notification', html);
};

const sendOTPEmail = async (email, otp) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #c19651;">Password Reset Code</h2>
            <p>Your verification code for password reset is:</p>
            <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #0f172a;">
                ${otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
            <br>
            <p>Best regards,<br>The Lawwise Team</p>
        </div>
    `;
    return sendEmail(email, 'Your Lawwise Verification Code', html);
};

const sendVerificationEmail = async (email, name, token, type) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}&type=${type}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #0f172a;">Welcome to Lawwise!</h2>
            <p>Hello <b>${name}</b>,</p>
            <p>Thank you for registering with <b>Lawwise</b>. Please verify your email address to activate your account:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" style="background-color: #c19651; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #64748b; font-size: 14px;">${verifyUrl}</p>
            <p>If you did not create an account, please ignore this email.</p>
            <br>
            <p>Best regards,<br>The Lawwise Team</p>
        </div>
    `;
    return sendEmail(email, 'Verify your Lawwise email address', html);
};

module.exports = {
    sendEmail,
    sendLoginNotification,
    sendOTPEmail,
    sendVerificationEmail,
    checkAuthenticEmail
};

