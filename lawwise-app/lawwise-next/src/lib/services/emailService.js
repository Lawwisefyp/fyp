import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


export const sendLoginNotification = async (email, name) => {
  try {
    await transporter.sendMail({
      from: `"Lawwise" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'New Login Detected',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello, ${name}</h2>
          <p>A new login was detected for your Lawwise account.</p>
          <p>If this wasn't you, please reset your password immediately.</p>
          <p>Best regards,<br>The Lawwise Team</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

export const sendVerificationEmail = async (email, name, token, type) => {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${token}&type=${type}`;
  
  try {
    await transporter.sendMail({
      from: `"Lawwise" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Lawwise, ${name}!</h2>
          <p>Please click the button below to verify your email address:</p>
          <a href="${verifyUrl}" style="background: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          <p>Or copy this link: ${verifyUrl}</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

export const sendOTPEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"Lawwise" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Password Reset Code',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Your verification code is: <strong style="font-size: 24px; color: #0070f3;">${otp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

export const sendOfficialEmail = async (to, subject, content, senderName) => {
  try {
    await transporter.sendMail({
      from: `"${senderName} via Lawwise" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
          <h2 style="color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Official Communication</h2>
          <p style="white-space: pre-wrap; font-size: 16px; color: #334155;">${content}</p>
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b;">
            <p>Sent by: <strong>${senderName}</strong></p>
            <p>This is an official communication sent via the Lawwise platform.</p>
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};
