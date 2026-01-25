import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { loginRateLimiter } from '@/lib/rate-limit';
import { generateOTP, hashOTP, sendOTPEmail } from '@/lib/email';

/**
 * POST /api/auth/register
 * Register a new user with email OTP verification
 * 
 * Body: { email, password, name, phone?, country?, role? }
 * Phone is OPTIONAL and does NOT trigger OTP
 */
export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = loginRateLimiter(ip);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password, name, phone, role = 'VOTER', country } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const validRoles = ['VOTER', 'CONTESTANT'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be VOTER or CONTESTANT' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP
    const otp = process.env.OTP_MODE === 'dev' 
      ? process.env.DEV_OTP_CODE || '123456'
      : generateOTP();
    
    const otpHash = hashOTP(otp);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user with unverified email
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      phone: phone || undefined, // Phone is optional
      country,
      role,
      otpHash,
      otpExpires,
      otpAttempts: 0,
      otpLastSent: new Date(),
      emailVerified: false,
    });

    // Send OTP email
    try {
      await sendOTPEmail({ to: email, otp, name });
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Don't fail registration if email fails in dev mode
      if (process.env.OTP_MODE !== 'dev') {
        // Rollback user creation
        await User.findByIdAndDelete(user._id);
        return NextResponse.json(
          { error: 'Failed to send verification email. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Response
    const response = {
      success: true,
      message: 'Account created. Please check your email for the verification code.',
      userId: user._id,
      email: user.email,
    };

    // In dev mode, include OTP hint
    if (process.env.OTP_MODE === 'dev') {
      response.devOtpHint = `Use code ${otp} for verification (dev mode)`;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
