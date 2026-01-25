import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import ContestantProfile from '@/lib/models/ContestantProfile';
import Transaction from '@/lib/models/Transaction';

// GET /api/me - Get current user profile
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id)
      .select('-password -otpCode')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let contestantProfile = null;
    let voteStats = null;

    // If contestant, get profile
    if (user.role === 'CONTESTANT') {
      contestantProfile = await ContestantProfile.findOne({ userId: user._id }).lean();
      
      if (contestantProfile) {
        // Get vote stats
        const votesByRound = await Transaction.aggregate([
          { $match: { contestantId: contestantProfile._id, status: 'SUCCESS' } },
          { $group: { _id: '$roundId', totalVotes: { $sum: '$votesPurchased' }, totalAmount: { $sum: '$amountPaid' } } },
        ]);

        const totalVotesReceived = await Transaction.aggregate([
          { $match: { contestantId: contestantProfile._id, status: 'SUCCESS' } },
          { $group: { _id: null, total: { $sum: '$votesPurchased' } } },
        ]);

        voteStats = {
          votesByRound,
          totalVotes: totalVotesReceived[0]?.total || 0,
        };
      }
    }

    // If voter, get voting history
    let votingHistory = null;
    if (user.role === 'VOTER') {
      votingHistory = await Transaction.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    }

    return NextResponse.json({
      user,
      contestantProfile,
      voteStats,
      votingHistory,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT /api/me - Update current user
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { name, phone, country, avatar } = body;

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (country) user.country = country;
    if (avatar) user.avatar = avatar;

    await user.save();

    return NextResponse.json({
      success: true,
      user: { ...user.toObject(), password: undefined, otpCode: undefined },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
