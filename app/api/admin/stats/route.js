import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import ContestantProfile from '@/lib/models/ContestantProfile';
import Transaction from '@/lib/models/Transaction';
import Round from '@/lib/models/Round';
import Settings from '@/lib/models/Settings';
import { getSetting } from '@/lib/helpers';

// GET /api/admin/stats - Get dashboard stats
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, totalContestants, pendingContestants, approvedContestants, activeRound, totalRevenue, todayRevenue, todayVotes, topContestants, recentTransactions, flaggedTransactions] = await Promise.all([
      User.countDocuments(),
      ContestantProfile.countDocuments(),
      ContestantProfile.countDocuments({ status: 'PENDING' }),
      ContestantProfile.countDocuments({ status: 'APPROVED' }),
      Round.findOne({ status: 'ACTIVE' }),
      Transaction.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]),
      Transaction.aggregate([
        { $match: { status: 'SUCCESS', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' }, votes: { $sum: '$votesPurchased' } } },
      ]),
      Transaction.aggregate([
        { $match: { status: 'SUCCESS', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$votesPurchased' } } },
      ]),
      ContestantProfile.find({ status: 'APPROVED' })
        .sort({ totalVotes: -1 })
        .limit(10)
        .lean(),
      Transaction.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Transaction.countDocuments({ isFlagged: true }),
    ]);

    // Get current vote price
    const votePrice = await getSetting('votePrice', 5000);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalContestants,
        pendingContestants,
        approvedContestants,
        totalRevenue: totalRevenue[0]?.total || 0,
        todayRevenue: todayRevenue[0]?.total || 0,
        todayVotes: todayVotes[0]?.total || 0,
        flaggedTransactions,
        votePrice,
      },
      activeRound,
      topContestants,
      recentTransactions,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
