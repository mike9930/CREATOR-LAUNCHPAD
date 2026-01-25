import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export async function initializeTransaction({ email, amount, reference, metadata, callbackUrl }) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount, // Amount in kobo
      reference,
      metadata,
      callback_url: callbackUrl,
    }),
  });

  const data = await response.json();
  return data;
}

export async function verifyTransaction(reference) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  return data;
}

export function verifyWebhookSignature(body, signature) {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(body))
    .digest('hex');
  return hash === signature;
}

export function generateReference() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `AOV-${timestamp}-${randomStr}`.toUpperCase();
}
