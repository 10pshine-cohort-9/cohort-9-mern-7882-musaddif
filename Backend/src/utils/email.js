import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Normalize and sanitize SMTP config
const smtpHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.EMAIL_PORT) || 587;
const smtpUser = process.env.EMAIL_USER || '';
const rawPassword = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || '';
const smtpPass = rawPassword.replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: false, // use STARTTLS
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

if (process.env.NODE_ENV === 'development') {
  console.log(`[Email] SMTP configured host=${smtpHost} port=${smtpPort} user=${smtpUser ? smtpUser : '<none>'}`);
}

// Verify transporter connection early and log safe info with non-secret details
transporter.verify((err, success) => {
  if (err) {
    console.error('[Email Error] SMTP verification failed:', err && err.message ? err.message : err);
    if (err && err.code) console.error('[Email Error] code:', err.code);
    if (err && err.response) console.error('[Email Error] response:', err.response);
    // Common hints
    if (err && (err.code === 'EAUTH' || err.response && /Authentication failed/i.test(err.response))) {
      console.error('[Email Hint] Authentication failed. Ensure you are using a Gmail App Password and that it is set as EMAIL_PASSWORD in .env (no spaces).');
    }
  } else {
    console.log('[Email] SMTP transporter verified');
  }
});

/**
 * Send a password reset email to the user.
 * @param {string} toEmail - Recipient's email address
 * @param {string} resetUrl  - The full reset password URL
 */
export const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM ? `"Notes App" <${process.env.EMAIL_FROM}>` : `"Notes App" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Password Reset Request — Notes App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #faf9ff; border-radius: 16px; overflow: hidden; border: 1px solid #e8e0ff;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 32px 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">📝 Notes App</h1>
        </div>

        <!-- Body -->
        <div style="padding: 40px;">
          <h2 style="color: #1e1b4b; margin: 0 0 12px 0; font-size: 22px;">Reset Your Password</h2>
          <p style="color: #64748b; line-height: 1.6; margin: 0 0 24px 0;">
            We received a request to reset the password for your Notes account. Click the button below to choose a new password.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" 
              style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(109,40,217,0.35);">
              Reset Password
            </a>
          </div>

          <div style="background: #f1f5f9; border-radius: 10px; padding: 16px 20px; margin: 24px 0;">
            <p style="color: #475569; font-size: 13px; margin: 0 0 6px 0; font-weight: 600;">Or copy this link into your browser:</p>
            <p style="color: #7c3aed; font-size: 12px; margin: 0; word-break: break-all;">${resetUrl}</p>
          </div>

          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
            ⏱️ This link is valid for <strong>15 minutes</strong> only.<br/>
            If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8f7ff; padding: 20px 40px; text-align: center; border-top: 1px solid #ede9fe;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Notes App. Your notes are private and secure.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    // Log a safe confirmation without exposing secrets
    console.log(`[Email] Password reset email queued for ${toEmail}. MessageId: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('[Email Error] Failed to send password reset email to', toEmail, '-', err && err.message ? err.message : err);
    if (err && err.code) console.error('[Email Error] code:', err.code);
    if (err && err.response) console.error('[Email Error] response:', err.response);
    throw err;
  }
};
