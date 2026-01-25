import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ContestantProfile from '@/lib/models/ContestantProfile';
import Transaction from '@/lib/models/Transaction';
import Round from '@/lib/models/Round';
import User from '@/lib/models/User';

// GET /api/leaderboard - Get leaderboard data
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const country = searchParams.get('country');
    const roundId = searchParams.get('roundId');
    const limit = parseInt(searchParams.get('limit')) || 50;

    // Get active round if no specific round requested
    let targetRoundId = roundId;
    if (!targetRoundId) {
      const activeRound = await Round.findOne({ status: 'ACTIVE' });
      if (activeRound) {
        targetRoundId = activeRound._id;
      }
    }

    // Build aggregation pipeline for round-specific votes
    let leaderboardData;

    if (targetRoundId) {
      // Get votes for specific round
      const matchStage = { roundId: targetRoundId, status: 'SUCCESS' };

      const votesByContestant = await Transaction.aggregate([
        { $match: matchStage },
        { $group: { _id: '$contestantId', roundVotes: { $sum: '$votesPurchased' } } },
        { $sort: { roundVotes: -1 } },
        { $limit: limit },
      ]);

      const contestantIds = votesByContestant.map(v => v._id);
      
      // Get contestant details
      const contestantQuery = { 
        _id: { $in: contestantIds },
        status: 'APPROVED',
      };
      if (category) contestantQuery.category = category;
      if (country) contestantQuery.country = country;

      const contestants = await ContestantProfile.find(contestantQuery).lean();
      const contestantMap = contestants.reduce((acc, c) => ({ ...acc, [c._id]: c }), {});

      // Get user names
      const userIds = contestants.map(c => c.userId);
      const users = await User.find({ _id: { $in: userIds } }).select('name').lean();
      const userMap = users.reduce((acc, u) => ({ ...acc, [u._id]: u }), {});

      leaderboardData = votesByContestant
        .filter(v => contestantMap[v._id])
        .map((v, index) => {
          const contestant = contestantMap[v._id];
          return {
            rank: index + 1,
            contestant: {
              ...contestant,
              userName: userMap[contestant.userId]?.name,
            },
            roundVotes: v.roundVotes,
            totalVotes: contestant.totalVotes,
          };
        });
    } else {
      // Overall leaderboard (no active round)
      const query = { status: 'APPROVED' };
      if (category) query.category = category;
      if (country) query.country = country;

      const contestants = await ContestantProfile.find(query)
        .sort({ totalVotes: -1 })
        .limit(limit)
        .lean();

      const userIds = contestants.map(c => c.userId);
      const users = await User.find({ _id: { $in: userIds } }).select('name').lean();
      const userMap = users.reduce((acc, u) => ({ ...acc, [u._id]: u }), {});

      leaderboardData = contestants.map((c, index) => ({
        rank: index + 1,
        contestant: {
          ...c,
          userName: userMap[c.userId]?.name,
        },
        roundVotes: c.totalVotes,
        totalVotes: c.totalVotes,
      }));
    }

    // Get round info
    const activeRound = await Round.findOne({ status: 'ACTIVE' }).lean();
    const allRounds = await Round.find({ status: { $in: ['ACTIVE', 'CLOSED'] } }).sort({ roundNumber: 1 }).lean();

    return NextResponse.json({
      leaderboard: leaderboardData,
      activeRound,
      rounds: allRounds,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
