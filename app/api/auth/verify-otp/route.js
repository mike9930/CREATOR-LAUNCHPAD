import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { verifyOTPHash, sendWelcomeEmail } from '@/lib/email';

/**
 * POST /api/auth/verify-otp
 * Verify email OTP code
 * 
 * Body: { userId?, email?, otpCode }
 * Max 5 attempts, OTP expires in 10 minutes
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, email, otpCode } = body;

    if ((!userId && !email) || !otpCode) {
      return NextResponse.json(
        { error: 'User ID/Email and OTP code are required' },
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
      return NextResponse.json({
        success: true,
        message: 'Email already verified',
        alreadyVerified: true,
      });
    }

    // Check max attempts (5)
    if (user.otpAttempts >= 5) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new code.' },
        { status: 429 }
      );
    }

    // Check expiration
    if (!user.otpExpires || new Date() > user.otpExpires) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP (support both hashed and plain for dev mode)
    const isValid = user.otpHash 
      ? verifyOTPHash(otpCode, user.otpHash)
      : (user.otpCode === otpCode); // Legacy support

    if (!isValid) {
      // Increment attempts
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();

      const remainingAttempts = 5 - user.otpAttempts;
      return NextResponse.json(
        { 
          error: `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`,
          attemptsRemaining: remainingAttempts,
        },
        { status: 400 }
      );
    }

    // Mark as verified
    user.emailVerified = true;
    user.otpHash = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    user.otpCode = undefined; // Clear legacy field
    await user.save();

    // Send welcome email (non-blocking)
    sendWelcomeEmail({ to: user.email, name: user.name, role: user.role }).catch(console.error);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
