import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';

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

    if (user.phoneVerified) {
      return NextResponse.json(
        { success: true, message: 'Phone already verified' },
        { status: 200 }
      );
    }

    // Check OTP
    if (user.otpCode !== otpCode) {
      return NextResponse.json(
        { error: 'Invalid OTP code' },
        { status: 400 }
      );
    }

    if (user.otpExpires && new Date() > user.otpExpires) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Mark as verified
    user.phoneVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Phone verified successfully',
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
