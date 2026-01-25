import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { connectDB } from '@/lib/db';
import Transaction from '@/lib/models/Transaction';
import ContestantProfile from '@/lib/models/ContestantProfile';
import { verifyPayPalWebhookSignature } from '@/lib/paypal';

/**
 * POST /api/paypal/webhook
 * Handles PayPal webhook events
 * Must be idempotent - same PayPal orderId cannot credit votes twice
 */
export async function POST(request) {
  try {
    // Get headers for signature verification
    const headersList = headers();
    const paypalHeaders = {
      'paypal-auth-algo': headersList.get('paypal-auth-algo'),
      'paypal-cert-url': headersList.get('paypal-cert-url'),
      'paypal-transmission-id': headersList.get('paypal-transmission-id'),
      'paypal-transmission-sig': headersList.get('paypal-transmission-sig'),
      'paypal-transmission-time': headersList.get('paypal-transmission-time'),
    };

    // Get raw body for signature verification
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);

    // Verify webhook signature (skip in dev mode if no webhook ID configured)
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (webhookId && webhookId !== 'your_paypal_webhook_id_here') {
      const isVerified = await verifyPayPalWebhookSignature(paypalHeaders, body);
      if (!isVerified) {
        console.error('Invalid PayPal webhook signature');
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    } else {
      console.log('[DEV MODE] Skipping webhook signature verification');
    }

    await connectDB();

    const eventType = body.event_type;
    const resource = body.resource;

    console.log(`Processing PayPal webhook: ${eventType}`);

    // Handle PAYMENT.CAPTURE.COMPLETED event
    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      // Get order ID from capture data
      const orderId = resource.supplementary_data?.related_ids?.order_id;
      const captureId = resource.id;

      if (!orderId) {
        console.error('Order ID not found in webhook payload');
        return NextResponse.json({ received: true });
      }

      // Find transaction by PayPal order ID
      const transaction = await Transaction.findOne({ paypalOrderId: orderId });

      if (!transaction) {
        console.error(`Transaction not found for order: ${orderId}`);
        return NextResponse.json({ received: true });
      }

      // IDEMPOTENCY: Skip if already completed
      if (transaction.status === 'COMPLETED') {
        console.log(`Transaction already completed: ${orderId}`);
        return NextResponse.json({ received: true, alreadyProcessed: true });
      }

      // Verify amount
      const capturedAmount = parseFloat(resource.amount?.value);
      if (Math.abs(capturedAmount - transaction.amount) > 0.01) {
        console.error('Amount mismatch in webhook:', { expected: transaction.amount, received: capturedAmount });
        transaction.status = 'FAILED';
        transaction.isFlagged = true;
        transaction.flagReason = 'Amount mismatch (webhook)';
        transaction.webhookReceivedAt = new Date();
        transaction.paypalResponse = resource;
        await transaction.save();
        return NextResponse.json({ received: true });
      }

      // Update transaction status
      transaction.status = 'COMPLETED';
      transaction.captureId = captureId;
      transaction.verifiedAt = new Date();
      transaction.webhookReceivedAt = new Date();
      transaction.paypalResponse = resource;
      await transaction.save();

      // Credit votes to contestant
      await ContestantProfile.findByIdAndUpdate(
        transaction.contestantId,
        { $inc: { totalVotes: transaction.votesQty } }
      );

      console.log('Votes credited via webhook:', {
        orderId,
        contestantId: transaction.contestantId,
        votes: transaction.votesQty,
      });
    }

    // Handle CHECKOUT.ORDER.APPROVED event (optional - for tracking)
    if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      const orderId = resource.id;
      const transaction = await Transaction.findOne({ paypalOrderId: orderId });
      
      if (transaction && transaction.status === 'PENDING') {
        transaction.status = 'APPROVED';
        await transaction.save();
        console.log(`Order approved: ${orderId}`);
      }
    }

    // Handle payment failures
    if (eventType === 'PAYMENT.CAPTURE.DENIED' || eventType === 'PAYMENT.CAPTURE.REFUNDED') {
      const orderId = resource.supplementary_data?.related_ids?.order_id;
      if (orderId) {
        const transaction = await Transaction.findOne({ paypalOrderId: orderId });
        if (transaction) {
          const previousStatus = transaction.status;
          transaction.status = eventType.includes('REFUNDED') ? 'REFUNDED' : 'FAILED';
          transaction.webhookReceivedAt = new Date();
          transaction.paypalResponse = resource;
          await transaction.save();

          // If was completed, reverse votes
          if (previousStatus === 'COMPLETED') {
            await ContestantProfile.findByIdAndUpdate(
              transaction.contestantId,
              { $inc: { totalVotes: -transaction.votesQty } }
            );
            console.log('Votes reversed:', { orderId, votes: transaction.votesQty });
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    // Always return 200 to prevent PayPal from retrying
    return NextResponse.json({ received: true, error: error.message });
  }
}

/**
 * GET /api/paypal/webhook
 * Health check for webhook endpoint
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'active',
    message: 'PayPal webhook endpoint is ready',
    timestamp: new Date().toISOString(),
  });
}
