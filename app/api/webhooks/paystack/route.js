import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Transaction from '@/lib/models/Transaction';
import ContestantProfile from '@/lib/models/ContestantProfile';
import { verifyWebhookSignature } from '@/lib/paystack';

export async function POST(request) {
  try {
    const signature = request.headers.get('x-paystack-signature');
    const body = await request.json();

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid Paystack webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = body.event;
    const data = body.data;

    await connectDB();

    // Handle charge.success event
    if (event === 'charge.success') {
      const reference = data.reference;

      // Find transaction
      const transaction = await Transaction.findOne({ reference });
      if (!transaction) {
        console.error('Transaction not found for webhook:', reference);
        return NextResponse.json({ received: true });
      }

      // Idempotency: skip if already processed
      if (transaction.status === 'SUCCESS') {
        console.log('Transaction already processed:', reference);
        return NextResponse.json({ received: true });
      }

      // Verify amount matches
      if (data.amount !== transaction.amountPaid) {
        console.error('Amount mismatch:', { expected: transaction.amountPaid, received: data.amount });
        transaction.status = 'FAILED';
        transaction.paystackResponse = data;
        transaction.isFlagged = true;
        transaction.flagReason = 'Amount mismatch';
        await transaction.save();
        return NextResponse.json({ received: true });
      }

      // Update transaction
      transaction.status = 'SUCCESS';
      transaction.paystackResponse = data;
      transaction.webhookReceivedAt = new Date();
      transaction.verifiedAt = new Date();
      await transaction.save();

      // Update contestant vote count
      await ContestantProfile.findByIdAndUpdate(
        transaction.contestantId,
        { $inc: { totalVotes: transaction.votesPurchased } }
      );

      console.log('Vote credited via webhook:', {
        reference,
        contestantId: transaction.contestantId,
        votes: transaction.votesPurchased,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Always return 200 to Paystack to prevent retries for server errors
    return NextResponse.json({ received: true });
  }
}

// Paystack sends GET to verify endpoint is live
export async function GET() {
  return NextResponse.json({ status: 'Webhook endpoint active' });
}
