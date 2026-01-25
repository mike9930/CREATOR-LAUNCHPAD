/**
 * PayPal API Utility for Africa One Voice
 * Handles order creation, capture, and webhook verification
 * 
 * Environment Variables:
 * - PAYPAL_MODE: "sandbox" or "live" 
 * - PAYPAL_CLIENT_ID: PayPal Client ID
 * - PAYPAL_CLIENT_SECRET: PayPal Client Secret
 * - PAYPAL_WEBHOOK_ID: PayPal Webhook ID (for webhook signature verification)
 */

// Support both PAYPAL_MODE and PAYPAL_ENVIRONMENT for flexibility
const PAYPAL_MODE = process.env.PAYPAL_MODE || process.env.PAYPAL_ENVIRONMENT || 'sandbox';
const PAYPAL_API_URL = PAYPAL_MODE === 'live' || PAYPAL_MODE === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

/**
 * Check if PayPal is configured
 */
export function isPayPalConfigured() {
  return Boolean(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);
}

/**
 * Get PayPal environment info
 */
export function getPayPalInfo() {
  return {
    mode: PAYPAL_MODE,
    apiUrl: PAYPAL_API_URL,
    configured: isPayPalConfigured(),
  };
}

/**
 * Get PayPal access token
 */
export async function getPayPalAccessToken() {
  if (!isPayPalConfigured()) {
    throw new Error('PayPal is not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
  }
  
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error('PayPal Auth Error:', data);
    throw new Error(`PayPal Auth Error: ${data.error_description || 'Failed to get access token'}`);
  }
  
  return data.access_token;
}

/**
 * Create a PayPal order
 */
export async function createPayPalOrder({ amount, currency = 'USD', description, referenceId, returnUrl, cancelUrl }) {
  const accessToken = await getPayPalAccessToken();
  
  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
        description: description || 'Vote Purchase - Africa One Voice',
        reference_id: referenceId,
      }],
      application_context: {
        brand_name: 'Africa One Voice',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error('PayPal Create Order Error:', data);
    throw new Error(data.message || 'Failed to create PayPal order');
  }
  
  return data;
}

/**
 * Capture a PayPal order (finalize payment)
 */
export async function capturePayPalOrder(orderId) {
  const accessToken = await getPayPalAccessToken();
  
  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error('PayPal Capture Error:', data);
    throw new Error(data.message || 'Failed to capture PayPal order');
  }
  
  return data;
}

/**
 * Get PayPal order details
 */
export async function getPayPalOrder(orderId) {
  const accessToken = await getPayPalAccessToken();
  
  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error('PayPal Get Order Error:', data);
    throw new Error(data.message || 'Failed to get PayPal order');
  }
  
  return data;
}

/**
 * Verify PayPal webhook signature
 */
export async function verifyPayPalWebhookSignature(headers, body) {
  const accessToken = await getPayPalAccessToken();
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: PAYPAL_WEBHOOK_ID,
      webhook_event: body,
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error('PayPal Webhook Verification Error:', data);
    return false;
  }
  
  return data.verification_status === 'SUCCESS';
}

/**
 * Generate a unique reference ID for orders
 */
export function generateOrderReference() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `AOV-${timestamp}-${randomStr}`.toUpperCase();
}
