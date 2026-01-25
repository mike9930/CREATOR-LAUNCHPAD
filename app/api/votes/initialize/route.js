import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Transaction from '@/lib/models/Transaction';
import ContestantProfile from '@/lib/models/ContestantProfile';
import Round from '@/lib/models/Round';
import Settings from '@/lib/models/Settings';
import { initializeTransaction, generateReference } from '@/lib/paystack';
import { paymentRateLimiter } from '@/lib/rate-limit';
import { getSetting } from '@/lib/helpers';

// POST /api/votes/initialize - Initialize payment for votes
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Please log in to vote' },
        { status: 401 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Rate limiting
    const rateLimitResult = paymentRateLimiter(`${session.user.id}-vote`);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many voting attempts. Please wait a moment.' },
        { status: 429 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { contestantId, voteCount } = body;

    // Validation
    if (!contestantId || !voteCount || voteCount < 1) {
      return NextResponse.json(
        { error: 'Contestant ID and vote count (minimum 1) are required' },
        { status: 400 }
      );
    }

    // Check active round
    const activeRound = await Round.findOne({ status: 'ACTIVE' });
    if (!activeRound) {
      return NextResponse.json(
        { error: 'No active voting round. Voting is currently closed.' },
        { status: 400 }
      );
    }

    // Check if within round window
    const now = new Date();
    if (now < activeRound.startDate || now > activeRound.endDate) {
      return NextResponse.json(
        { error: 'Voting window is closed for this round' },
        { status: 400 }
      );
    }

    // Check contestant exists and is approved
    const contestant = await ContestantProfile.findById(contestantId);
    if (!contestant || contestant.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Contestant not found or not approved' },
        { status: 404 }
      );
    }

    // Get vote price (in kobo)
    const votePrice = await getSetting('votePrice', 5000); // Default 50 NGN = 5000 kobo
    const maxVotes = await getSetting('maxVotesPerPurchase', 1000);

    if (voteCount > maxVotes) {
      return NextResponse.json(
        { error: `Maximum ${maxVotes} votes per purchase` },
        { status: 400 }
      );
    }

    const totalAmount = votePrice * voteCount; // In kobo
    const reference = generateReference();

    // Create pending transaction
    const transaction = await Transaction.create({
      userId: session.user.id,
      contestantId,
      roundId: activeRound._id,
      reference,
      votesPurchased: voteCount,
      amountPaid: totalAmount,
      currency: 'NGN',
      pricePerVote: votePrice,
      status: 'PENDING',
      userIp: ip,
      userAgent,
    });

    // Initialize Paystack transaction
    const paystackResult = await initializeTransaction({
      email: session.user.email,
      amount: totalAmount,
      reference,
      metadata: {
        transactionId: transaction._id,
        userId: session.user.id,
        contestantId,
        roundId: activeRound._id,
        voteCount,
        contestantName: contestant.stageName,
      },
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/votes/callback`,
    });

    if (!paystackResult.status) {
      // Update transaction as failed
      transaction.status = 'FAILED';
      transaction.paystackResponse = paystackResult;
      await transaction.save();

      return NextResponse.json(
        { error: paystackResult.message || 'Failed to initialize payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackResult.data.authorization_url,
      reference,
      transactionId: transaction._id,
      amount: totalAmount,
      amountFormatted: `₦${(totalAmount / 100).toLocaleString()}`,
      voteCount,
    });
  } catch (error) {
    console.error('Vote initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}
