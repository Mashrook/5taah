/**
 * 5ATTH | خته — Moyasar Webhook Handler (HTTP Function)
 * POST /_functions/moyasar/webhook
 */
import { ok, badRequest, serverError } from 'wix-http-functions';
import wixData from 'wix-data';
import { sendNotification } from './notificationService.web';

export async function post_moyasarWebhook(request) {
  try {
    const body = await request.body.json();

    if (!body.id || !body.status) {
      return badRequest({ body: JSON.stringify({ error: 'Invalid payload' }) });
    }

    const paymentId = body.id;
    const status = body.status; // paid, failed, refunded

    // Idempotency check
    const existingPayments = await wixData.query('payments')
      .eq('providerPaymentId', paymentId)
      .find();

    if (!existingPayments.items.length) {
      return badRequest({ body: JSON.stringify({ error: 'Payment not found' }) });
    }

    const paymentRecord = existingPayments.items[0];

    // Skip if already processed
    if (paymentRecord.status === status) {
      return ok({ body: JSON.stringify({ message: 'Already processed' }) });
    }

    // Update payment record
    await wixData.update('payments', {
      ...paymentRecord,
      status,
      paidAt: status === 'paid' ? new Date() : paymentRecord.paidAt,
      rawPayloadJson: JSON.stringify(body),
    });

    // Find and update invoice
    const invoices = await wixData.query('invoices')
      .eq('bookingId', body.metadata?.bookingId)
      .find();

    if (invoices.items.length) {
      const invoice = invoices.items[0];
      let invoiceStatus = invoice.status;
      if (status === 'paid') invoiceStatus = 'paid';
      else if (status === 'failed') invoiceStatus = 'failed';
      else if (status === 'refunded') invoiceStatus = 'refunded';

      await wixData.update('invoices', {
        ...invoice,
        status: invoiceStatus,
        updatedAt: new Date(),
      });
    }

    // Update booking status
    if (body.metadata?.bookingId) {
      const booking = await wixData.get('bookings', body.metadata.bookingId);
      if (booking) {
        let bookingStatus = booking.status;
        if (status === 'paid') bookingStatus = 'paid';
        else if (status === 'failed') bookingStatus = 'failed';
        else if (status === 'refunded') bookingStatus = 'refunded';

        await wixData.update('bookings', {
          ...booking,
          status: bookingStatus,
          updatedAt: new Date(),
        });

        // Send notifications
        if (booking.userId) {
          const templateMap = {
            paid: 'booking_payment_success',
            failed: 'booking_payment_failed',
            refunded: 'booking_refunded',
          };

          try {
            await sendNotification(booking.tenantId, booking.userId, templateMap[status] || 'payment_update', {
              bookingId: booking._id,
              amount: body.amount / 100,
              currency: body.currency,
              status,
            });
          } catch (notifErr) {
            console.error('Notification failed:', notifErr.message);
          }
        }
      }
    }

    // Audit log
    await wixData.insert('provider_audit_logs', {
      tenantId: body.metadata?.tenantId || '',
      providerName: 'moyasar',
      actorUserId: 'webhook',
      actionType: `PAYMENT_${status.toUpperCase()}`,
      oldValueJson: JSON.stringify({ previousStatus: paymentRecord.status }),
      newValueJson: JSON.stringify({ status, paymentId }),
      ipAddress: request.headers?.['x-forwarded-for'] || '',
      userAgent: request.headers?.['user-agent'] || '',
      createdAt: new Date(),
    });

    return ok({ body: JSON.stringify({ message: 'Webhook processed', status }) });
  } catch (err) {
    console.error('Moyasar webhook error:', err);
    return serverError({ body: JSON.stringify({ error: err.message }) });
  }
}
