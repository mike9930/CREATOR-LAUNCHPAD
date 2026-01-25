import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Transaction from '@/lib/models/Transaction';
import ContestantProfile from '@/lib/models/ContestantProfile';
import { capturePayPalOrder, getPayPalOrder } from '@/lib/paypal';

/**
 * POST /api/paypal/verify-or-capture
 * Verifies and captures a PayPal order, then credits votes
 * 
 * Body: { orderId } or { reference }
 * Returns: { success, transaction, votesCredited }
 */
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { orderId, reference } = body;

    if (!orderId && !reference) {
      return NextResponse.json(
        { error: 'Order ID or reference is required' },
        { status: 400 }
      );
    }

    // Find transaction
    const query = orderId 
      ? { paypalOrderId: orderId }
      : { reference };
    
    const transaction = await Transaction.findOne(query);
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Idempotency: If already completed, return success
    if (transaction.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified and votes credited',
        transaction: {
          id: transaction._id,
          reference: transaction.reference,
          status: transaction.status,
          votesQty: transaction.votesQty,
          contestantId: transaction.contestantId,
        },
        alreadyProcessed: true,
      });
    }

    // Get PayPal order status
    const paypalOrder = await getPayPalOrder(transaction.paypalOrderId);
    
    // If order is APPROVED, capture it
    let captureData = null;
    if (paypalOrder.status === 'APPROVED') {
      captureData = await capturePayPalOrder(transaction.paypalOrderId);
    } else if (paypalOrder.status === 'COMPLETED') {
      captureData = paypalOrder;
    } else if (paypalOrder.status === 'CREATED') {
      // Not yet approved by user
      return NextResponse.json({
        success: false,
        message: 'Payment not yet approved. Please complete PayPal checkout.',
        status: paypalOrder.status,
      });
    } else {
      // Failed or cancelled
      transaction.status = 'FAILED';
      transaction.paypalResponse = paypalOrder;
      await transaction.save();
      
      return NextResponse.json({
        success: false,
        message: 'Payment was not successful',
        status: paypalOrder.status,
      });
    }

    // Verify amount matches
    const capturedAmount = parseFloat(captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || captureData.purchase_units?.[0]?.amount?.value);
    if (Math.abs(capturedAmount - transaction.amount) > 0.01) {
      console.error('Amount mismatch:', { expected: transaction.amount, received: capturedAmount });
      transaction.status = 'FAILED';
      transaction.isFlagged = true;
      transaction.flagReason = 'Amount mismatch';
      transaction.paypalResponse = captureData;
      await transaction.save();
      
      return NextResponse.json(
        { error: 'Payment amount mismatch. Please contact support.' },
        { status: 400 }
      );
    }

    // Mark as completed and credit votes
    transaction.status = 'COMPLETED';
    transaction.verifiedAt = new Date();
    transaction.paypalResponse = captureData;
    transaction.captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    await transaction.save();

    // Credit votes to contestant
    await ContestantProfile.findByIdAndUpdate(
      transaction.contestantId,
      { $inc: { totalVotes: transaction.votesQty } }
    );

    console.log('Votes credited:', {
      reference: transaction.reference,
      contestantId: transaction.contestantId,
      votes: transaction.votesQty,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified! Votes credited successfully.',
      transaction: {
        id: transaction._id,
        reference: transaction.reference,
        status: transaction.status,
        votesQty: transaction.votesQty,
        contestantId: transaction.contestantId,
        amount: transaction.amount,
      },
    });
  } catch (error) {
    console.error('PayPal verify/capture error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/paypal/verify-or-capture?reference=xxx
 * Check payment status by reference (for redirect callback)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const orderId = searchParams.get('orderId');

    if (!reference && !orderId) {
      return NextResponse.json(
        { error: 'Reference or Order ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const query = orderId 
      ? { paypalOrderId: orderId }
      : { reference };
    
    const transaction = await Transaction.findOne(query);
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      transaction: {
        id: transaction._id,
        reference: transaction.reference,
        status: transaction.status,
        votesQty: transaction.votesQty,
        contestantId: transaction.contestantId,
        amount: transaction.amount,
        verifiedAt: transaction.verifiedAt,
      },
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    return NextResponse.json(
      { error: 'Failed to get transaction status' },
      { status: 500 }
    );
  }
}
