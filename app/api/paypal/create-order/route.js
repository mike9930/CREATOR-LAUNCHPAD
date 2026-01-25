import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Transaction from '@/lib/models/Transaction';
import ContestantProfile from '@/lib/models/ContestantProfile';
import Round from '@/lib/models/Round';
import { createPayPalOrder, generateOrderReference, isPayPalConfigured, getPayPalInfo } from '@/lib/paypal';
import { getSetting } from '@/lib/helpers';
import { paymentRateLimiter } from '@/lib/rate-limit';

/**
 * POST /api/paypal/create-order
 * Creates a PayPal order for purchasing votes
 * 
 * Body: { contestantId, roundId?, votesQty }
 * Returns: { orderId, approvalUrl, transactionId }
 */
export async function POST(request) {
  try {
    // Check if PayPal is configured
    if (!isPayPalConfigured()) {
      const info = getPayPalInfo();
      return NextResponse.json(
        { 
          error: 'Payment system not configured', 
          message: 'PayPal credentials are not set. Please contact support.',
          paypalMode: info.mode,
        },
        { status: 503 }
      );
    }

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
    const rateLimitResult = paymentRateLimiter(`${session.user.id}-paypal`);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many payment attempts. Please wait a moment.' },
        { status: 429 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { contestantId, votesQty, roundId } = body;

    // Validation
    if (!contestantId || !votesQty || votesQty < 1) {
      return NextResponse.json(
        { error: 'Contestant ID and vote quantity (minimum 1) are required' },
        { status: 400 }
      );
    }

    // Get active round (use provided roundId or find active one)
    let activeRound;
    if (roundId) {
      activeRound = await Round.findById(roundId);
      if (!activeRound || activeRound.status !== 'ACTIVE') {
        return NextResponse.json(
          { error: 'Invalid or inactive round' },
          { status: 400 }
        );
      }
    } else {
      activeRound = await Round.findOne({ status: 'ACTIVE' });
      if (!activeRound) {
        return NextResponse.json(
          { error: 'No active voting round. Voting is currently closed.' },
          { status: 400 }
        );
      }
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

    // Get vote price (stored in kobo/cents, convert to dollars)
    const votePriceKobo = await getSetting('votePrice', 5000); // Default 50 NGN = 5000 kobo
    const maxVotes = await getSetting('maxVotesPerPurchase', 1000);
    const currency = await getSetting('voteCurrency', 'USD');
    
    // For PayPal, we'll use USD. Convert if needed (simplified: 1 USD = 1500 NGN approx)
    const votePriceUSD = votePriceKobo / 100 / 15; // Convert kobo to USD (rough conversion)
    const pricePerVote = Math.max(0.10, votePriceUSD); // Minimum $0.10 per vote

    if (votesQty > maxVotes) {
      return NextResponse.json(
        { error: `Maximum ${maxVotes} votes per purchase` },
        { status: 400 }
      );
    }

    const totalAmount = pricePerVote * votesQty;
    const reference = generateOrderReference();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Create pending transaction in database first
    const transaction = await Transaction.create({
      userId: session.user.id,
      contestantId,
      roundId: activeRound._id,
      reference,
      votesQty,
      pricePerVote: Math.round(pricePerVote * 100), // Store in cents
      amount: totalAmount,
      currency: 'USD',
      status: 'PENDING',
      userIp: ip,
      userAgent,
    });

    // Create PayPal order
    const paypalOrder = await createPayPalOrder({
      amount: totalAmount,
      currency: 'USD',
      description: `${votesQty} vote(s) for ${contestant.stageName} - Africa One Voice`,
      referenceId: reference,
      returnUrl: `${baseUrl}/votes/success?reference=${reference}`,
      cancelUrl: `${baseUrl}/votes/cancel?reference=${reference}`,
    });

    // Update transaction with PayPal order ID
    transaction.paypalOrderId = paypalOrder.id;
    transaction.paypalResponse = { createTime: paypalOrder.create_time, links: paypalOrder.links };
    await transaction.save();

    // Find the approval URL
    const approvalLink = paypalOrder.links.find(link => link.rel === 'approve');

    return NextResponse.json({
      success: true,
      orderId: paypalOrder.id,
      approvalUrl: approvalLink?.href,
      transactionId: transaction._id,
      reference,
      amount: totalAmount,
      amountFormatted: `$${totalAmount.toFixed(2)}`,
      votesQty,
      contestant: {
        id: contestant._id,
        stageName: contestant.stageName,
      },
    });
  } catch (error) {
    console.error('PayPal create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order', message: error.message },
      { status: 500 }
    );
  }
}
