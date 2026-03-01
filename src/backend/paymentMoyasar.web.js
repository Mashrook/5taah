/**
 * 5ATTH | خته — Moyasar Payment Service (Backend Only)
 * No secret keys on frontend
 */
import { Permissions, webMethod } from 'wix-web-module';
import { secrets } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';
import wixData from 'wix-data';

const MOYASAR_API_URL = 'https://api.moyasar.com/v1';

async function getMoyasarSecretKey(tenantId) {
  const cred = await wixData.query('provider_credentials')
    .eq('tenantId', tenantId)
    .eq('providerName', 'moyasar')
    .eq('keyName', 'secret_key')
    .eq('isActive', true)
    .find();

  if (!cred.items.length || !cred.items[0].secretRefName) {
    throw new Error('Moyasar secret key not configured');
  }

  return secrets.getSecret(cred.items[0].secretRefName);
}

async function moyasarRequest(secretKey, method, path, body = null) {
  const encoded = Buffer.from(`${secretKey}:`).toString('base64');
  const options = {
    method,
    headers: {
      'Authorization': `Basic ${encoded}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${MOYASAR_API_URL}${path}`, options);
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Moyasar error ${response.status}: ${errText}`);
  }
  return response.json();
}

// ─── Create Invoice/Payment ────────────────────────────────
export const createInvoice = webMethod(
  Permissions.SiteMember,
  async (tenantId, bookingId, amount, currency, description, callbackUrl, successUrl, failureUrl) => {
    const secretKey = await getMoyasarSecretKey(tenantId);

    // Amount in halalas (smallest unit)
    const amountInHalalas = Math.round(amount * 100);

    const invoice = await moyasarRequest(secretKey, 'POST', '/invoices', {
      amount: amountInHalalas,
      currency: currency || 'SAR',
      description: description || `حجز رقم ${bookingId}`,
      callback_url: callbackUrl,
      success_url: successUrl,
      failure_url: failureUrl,
      metadata: {
        bookingId,
        tenantId,
      },
    });

    // Store in our payments collection
    await wixData.insert('payments', {
      invoiceId: bookingId, // Link to our invoice
      providerName: 'moyasar',
      providerPaymentId: invoice.id,
      status: 'created',
      paidAt: null,
      rawPayloadJson: JSON.stringify(invoice),
    });

    return {
      invoiceId: invoice.id,
      paymentUrl: invoice.url,
      amount: invoice.amount / 100,
      currency: invoice.currency,
      status: invoice.status,
    };
  }
);

// ─── Fetch Payment Status ─────────────────────────────────
export const fetchPayment = webMethod(
  Permissions.SiteMember,
  async (tenantId, paymentId) => {
    const secretKey = await getMoyasarSecretKey(tenantId);
    const payment = await moyasarRequest(secretKey, 'GET', `/payments/${paymentId}`);

    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount / 100,
      currency: payment.currency,
      source: payment.source?.type,
      createdAt: payment.created_at,
    };
  }
);

// ─── Refund Payment ────────────────────────────────────────
export const refundPayment = webMethod(
  Permissions.SiteMember,
  async (tenantId, paymentId, amount) => {
    const secretKey = await getMoyasarSecretKey(tenantId);
    const body = amount ? { amount: Math.round(amount * 100) } : {};
    const refund = await moyasarRequest(secretKey, 'POST', `/payments/${paymentId}/refund`, body);

    return {
      id: refund.id,
      status: refund.status,
      amount: refund.amount / 100,
      currency: refund.currency,
    };
  }
);

// ─── Get Publishable Key (safe for frontend) ──────────────
export const getPublishableKey = webMethod(
  Permissions.Anyone,
  async (tenantId) => {
    const cred = await wixData.query('provider_credentials')
      .eq('tenantId', tenantId)
      .eq('providerName', 'moyasar')
      .eq('keyName', 'publishable_key')
      .eq('isActive', true)
      .find();

    if (!cred.items.length) return null;
    return cred.items[0].plainValue || null;
  }
);
