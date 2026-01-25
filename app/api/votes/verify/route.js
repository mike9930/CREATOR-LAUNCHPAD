import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Transaction from '@/lib/models/Transaction';
import ContestantProfile from '@/lib/models/ContestantProfile';
import { verifyTransaction } from '@/lib/paystack';

// GET /api/votes/verify?reference=xxx - Verify payment after callback
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find transaction
    const transaction = await Transaction.findOne({ reference });
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // If already verified, return current status
    if (transaction.status === 'SUCCESS') {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        transaction: {
          id: transaction._id,
          status: transaction.status,
          votesPurchased: transaction.votesPurchased,
          contestantId: transaction.contestantId,
        },
      });
    }

    // Verify with Paystack
    const paystackResult = await verifyTransaction(reference);

    if (!paystackResult.status) {
      return NextResponse.json(
        { error: paystackResult.message || 'Verification failed' },
        { status: 400 }
      );
    }

    const paymentData = paystackResult.data;

    // Update transaction based on Paystack response
    transaction.paystackResponse = paymentData;
    transaction.verifiedAt = new Date();

    if (paymentData.status === 'success') {
      // Only process if not already SUCCESS (idempotency)
      if (transaction.status !== 'SUCCESS') {
        transaction.status = 'SUCCESS';

        // Update contestant vote count
        await ContestantProfile.findByIdAndUpdate(
          transaction.contestantId,
          { $inc: { totalVotes: transaction.votesPurchased } }
        );
      }
    } else {
      transaction.status = 'FAILED';
    }

    await transaction.save();

    return NextResponse.json({
      success: transaction.status === 'SUCCESS',
      message: transaction.status === 'SUCCESS' ? 'Payment verified! Votes credited.' : 'Payment not successful',
      transaction: {
        id: transaction._id,
        status: transaction.status,
        votesPurchased: transaction.votesPurchased,
        contestantId: transaction.contestantId,
      },
    });
  } catch (error) {
    console.error('Vote verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
