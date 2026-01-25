/**
 * Email Utility for Africa One Voice
 * Uses Resend for transactional emails
 * 
 * Environment Variables:
 * - OTP_PROVIDER: "resend" for real emails, "mock" for development
 * - RESEND_API_KEY: Required when OTP_PROVIDER=resend
 * - EMAIL_FROM: Sender email address
 */

import { Resend } from 'resend';
import crypto from 'crypto';

const OTP_PROVIDER = process.env.OTP_PROVIDER || 'mock';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Africa One Voice <noreply@africaonevoice.com>';

// Only initialize Resend if we're using it
let resend = null;
if (OTP_PROVIDER === 'resend' && process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

/**
 * Check if we're in mock mode
 */
export function isMockMode() {
  return OTP_PROVIDER === 'mock' || !process.env.RESEND_API_KEY;
}

/**
 * Generate a 6-digit OTP
 */
export function generateOTP() {
  // In mock mode, use the dev OTP code if set
  if (isMockMode() && process.env.DEV_OTP_CODE) {
    return process.env.DEV_OTP_CODE;
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP for secure storage
 */
export function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Verify OTP against hash
 */
export function verifyOTPHash(otp, hash) {
  return hashOTP(otp) === hash;
}

/**
 * Send OTP email
 */
export async function sendOTPEmail({ to, otp, name }) {
  // In mock mode, log OTP to console for testing
  if (isMockMode()) {
    console.log('\n' + '='.repeat(60));
    console.log('📧 [MOCK EMAIL] OTP Verification Code');
    console.log('='.repeat(60));
    console.log(`To: ${to}`);
    console.log(`Name: ${name || 'User'}`);
    console.log(`\n🔑 OTP CODE: ${otp}\n`);
    console.log('⏰ Expires in: 10 minutes');
    console.log('🔄 Max attempts: 5');
    console.log('='.repeat(60) + '\n');
    return { success: true, mockMode: true, otp };
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      subject: 'Your Africa One Voice Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">Africa One Voice</h1>
            <p style="color: #666; margin: 5px 0 0;">Pan-African Digital Talent Show</p>
          </div>
          
          <div style="background: #f9fafb; border-radius: 12px; padding: 30px; text-align: center;">
            <h2 style="margin: 0 0 10px;">Hello${name ? ` ${name}` : ''}!</h2>
            <p style="color: #666; margin: 0 0 20px;">Your verification code is:</p>
            
            <div style="background: #16a34a; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px 40px; border-radius: 8px; display: inline-block;">
              ${otp}
            </div>
            
            <p style="color: #666; margin: 20px 0 0; font-size: 14px;">
              This code expires in <strong>10 minutes</strong>.
            </p>
          </div>
          
          <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
            <p>If you didn't request this code, please ignore this email.</p>
            <p>&copy; ${new Date().getFullYear()} Africa One Voice. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (result.error) {
      console.error('Resend Error:', result.error);
      throw new Error(result.error.message || 'Failed to send email');
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail({ to, name, role }) {
  if (process.env.OTP_MODE === 'dev') {
    console.log(`[DEV MODE] Welcome email for ${to}`);
    return { success: true, devMode: true };
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      subject: 'Welcome to Africa One Voice!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">Africa One Voice</h1>
          </div>
          
          <h2>Welcome${name ? `, ${name}` : ''}!</h2>
          
          <p>Your account has been verified successfully. You're now part of Africa's biggest digital talent show!</p>
          
          ${role === 'CONTESTANT' ? `
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Complete your contestant profile</li>
              <li>Upload your 60-90 second audition video</li>
              <li>Wait for admin approval</li>
              <li>Start receiving votes!</li>
            </ol>
          ` : `
            <p>Start supporting your favorite African talents today!</p>
          `}
          
          <p>Good luck!</p>
          <p>The Africa One Voice Team</p>
        </body>
        </html>
      `,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Welcome email error:', error);
    // Don't throw - welcome email is not critical
    return { success: false, error: error.message };
  }
}
