import { NextResponse } from 'next/server';

/**
 * GET /api/paypal/client-id
 * Returns the PayPal client ID for frontend initialization
 */
export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID;
  const environment = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
  
  if (!clientId) {
    return NextResponse.json(
      { error: 'PayPal client ID not configured' },
      { status: 500 }
    );
  }
  
  return NextResponse.json({ 
    clientId,
    environment,
  });
}
