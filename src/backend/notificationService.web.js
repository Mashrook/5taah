/**
 * 5ATTH | خته — Notification Service (Backend)
 * Extensible: Push (Firebase) + Email (SendGrid) + SMS (Twilio)
 */
import { Permissions, webMethod } from 'wix-web-module';
import { secrets } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';
import wixData from 'wix-data';

// ─── Provider: Firebase Push ───────────────────────────────
async function sendFirebasePush(tenantId, userId, payload) {
  const creds = await getNotifCredentials(tenantId, 'firebase');
  if (!creds.server_key) throw new Error('Firebase server key not configured');

  // Get user FCM token (stored in user profile or separate collection)
  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Authorization': `key=${creds.server_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: payload.fcmToken || `/topics/user_${userId}`,
      notification: {
        title: payload.title || '5ATTH | خته',
        body: payload.body || '',
        click_action: payload.clickAction || '',
      },
      data: payload.data || {},
    }),
  });

  if (!response.ok) throw new Error(`Firebase error: ${response.status}`);
  return response.json();
}

// ─── Provider: SendGrid Email ──────────────────────────────
async function sendSendGridEmail(tenantId, userId, templateKey, payload) {
  const creds = await getNotifCredentials(tenantId, 'sendgrid');
  if (!creds.api_key) throw new Error('SendGrid API key not configured');

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${creds.api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: payload.email }],
        dynamic_template_data: payload.templateData || {},
      }],
      from: { email: creds.from_email || 'noreply@5atth.com', name: creds.from_name || '5ATTH | خته' },
      template_id: payload.templateId || templateKey,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`SendGrid error: ${response.status} - ${errText}`);
  }
  return { success: true };
}

// ─── Provider: Twilio SMS ──────────────────────────────────
async function sendTwilioSms(tenantId, userId, payload) {
  const creds = await getNotifCredentials(tenantId, 'twilio');
  if (!creds.account_sid || !creds.auth_token) throw new Error('Twilio credentials not configured');

  const encoded = Buffer.from(`${creds.account_sid}:${creds.auth_token}`).toString('base64');

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${creds.account_sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encoded}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `To=${encodeURIComponent(payload.phone)}&From=${encodeURIComponent(creds.from_phone || '+966')}&Body=${encodeURIComponent(payload.body)}`,
    }
  );

  if (!response.ok) throw new Error(`Twilio error: ${response.status}`);
  return response.json();
}

// ─── Helpers ───────────────────────────────────────────────
async function getNotifCredentials(tenantId, providerName) {
  const creds = await wixData.query('provider_credentials')
    .eq('tenantId', tenantId)
    .eq('providerName', providerName)
    .eq('isActive', true)
    .find();

  const credentials = {};
  for (const cred of creds.items) {
    if (cred.isSecret && cred.secretRefName) {
      try {
        credentials[cred.keyName] = await secrets.getSecret(cred.secretRefName);
      } catch (e) {
        console.error(`Failed to get secret: ${cred.secretRefName}`);
      }
    } else {
      credentials[cred.keyName] = cred.plainValue;
    }
  }
  return credentials;
}

async function logNotification(tenantId, userId, channel, templateKey, payload, status) {
  await wixData.insert('notifications_log', {
    tenantId,
    userId,
    channel,
    templateKey,
    payloadJson: JSON.stringify(payload),
    status,
    createdAt: new Date(),
  });
}

// ─── Public API ────────────────────────────────────────────
export const sendPush = webMethod(
  Permissions.SiteMember,
  async (tenantId, userId, payload) => {
    try {
      const result = await sendFirebasePush(tenantId, userId, payload);
      await logNotification(tenantId, userId, 'push', payload.templateKey || 'push', payload, 'sent');
      return result;
    } catch (err) {
      await logNotification(tenantId, userId, 'push', payload.templateKey || 'push', payload, 'failed');
      throw err;
    }
  }
);

export const sendEmail = webMethod(
  Permissions.SiteMember,
  async (tenantId, userId, templateKey, payload) => {
    try {
      const result = await sendSendGridEmail(tenantId, userId, templateKey, payload);
      await logNotification(tenantId, userId, 'email', templateKey, payload, 'sent');
      return result;
    } catch (err) {
      await logNotification(tenantId, userId, 'email', templateKey, payload, 'failed');
      throw err;
    }
  }
);

export const sendSms = webMethod(
  Permissions.SiteMember,
  async (tenantId, userId, payload) => {
    try {
      const result = await sendTwilioSms(tenantId, userId, payload);
      await logNotification(tenantId, userId, 'sms', payload.templateKey || 'sms', payload, 'sent');
      return result;
    } catch (err) {
      await logNotification(tenantId, userId, 'sms', payload.templateKey || 'sms', payload, 'failed');
      throw err;
    }
  }
);

// ─── Unified Send (used internally) ───────────────────────
export async function sendNotification(tenantId, userId, templateKey, data) {
  // Determine which channels to use
  const channels = ['push', 'email']; // Default channels

  for (const channel of channels) {
    try {
      if (channel === 'push') {
        await sendFirebasePush(tenantId, userId, { ...data, templateKey });
      } else if (channel === 'email' && data.email) {
        await sendSendGridEmail(tenantId, userId, templateKey, data);
      } else if (channel === 'sms' && data.phone) {
        await sendTwilioSms(tenantId, userId, data);
      }
      await logNotification(tenantId, userId, channel, templateKey, data, 'sent');
    } catch (err) {
      console.error(`Notification channel ${channel} failed:`, err.message);
      await logNotification(tenantId, userId, channel, templateKey, data, 'failed');
    }
  }
}
