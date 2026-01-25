import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { generateOTP, hashOTP, sendOTPEmail } from '@/lib/email';
import { loginRateLimiter } from '@/lib/rate-limit';

/**
 * POST /api/auth/resend-otp
 * Resend OTP code to user's email
 * Rate limited: max 3 resends per 10 minutes
 * 
 * Body: { userId? | email? }
 */
export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Rate limit resends (3 per 10 minutes)
    const rateLimitResult = loginRateLimiter(`resend-${ip}`);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many resend attempts. Please wait a few minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { userId, email } = body;

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID or email is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const query = userId ? { _id: userId } : { email: email.toLowerCase() };
    const user = await User.findOne(query);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Check cooldown (minimum 60 seconds between resends)
    if (user.otpLastSent) {
      const timeSinceLastSend = Date.now() - new Date(user.otpLastSent).getTime();
      if (timeSinceLastSend < 60000) {
        const waitSeconds = Math.ceil((60000 - timeSinceLastSend) / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitSeconds} seconds before requesting a new code.` },
          { status: 429 }
        );
      }
    }

    // Generate new OTP
    const otp = process.env.OTP_MODE === 'dev' 
      ? process.env.DEV_OTP_CODE || '123456'
      : generateOTP();
    
    const otpHash = hashOTP(otp);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user
    user.otpHash = otpHash;
    user.otpExpires = otpExpires;
    user.otpAttempts = 0; // Reset attempts on new OTP
    user.otpLastSent = new Date();
    await user.save();

    // Send OTP email
    try {
      await sendOTPEmail({ to: user.email, otp, name: user.name });
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      if (process.env.OTP_MODE !== 'dev') {
        return NextResponse.json(
          { error: 'Failed to send verification email. Please try again.' },
          { status: 500 }
        );
      }
    }

    const response = {
      success: true,
      message: 'Verification code sent to your email.',
    };

    if (process.env.OTP_MODE === 'dev') {
      response.devOtpHint = `Use code ${otp} for verification (dev mode)`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification code' },
      { status: 500 }
    );
  }
}
