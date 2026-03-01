/**
 * 5ATTH | خته — Booking Service (Backend / Web Module)
 */
import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { getProviderConfig, getProviderCredentials, logProviderAudit } from './providers/providerBase';
import * as amadeus from './providers/amadeus.adapter';
import * as sabre from './providers/sabre.adapter';
import * as travelport from './providers/travelport.adapter';

const adapters = { amadeus, sabre, travelport };

export const createBooking = webMethod(
  Permissions.SiteMember,
  async (tenantId, userId, offerId, travelers, contact) => {
    // Get offer
    const offer = await wixData.get('offers', offerId);
    if (!offer) throw new Error('العرض غير موجود');

    // Create booking draft
    const booking = await wixData.insert('bookings', {
      tenantId,
      userId,
      productType: offer.productType,
      providerName: offer.providerName,
      status: 'draft',
      selectedOfferId: offerId,
      providerOrderId: '',
      travelersJson: JSON.stringify(travelers),
      contactJson: JSON.stringify(contact),
      pricingJson: JSON.stringify({
        base: offer.baseAmount,
        taxes: offer.taxesAmount,
        markup: offer.markupAmount,
        total: offer.totalAmount,
        currency: offer.currency,
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create invoice
    const invoice = await wixData.insert('invoices', {
      tenantId,
      bookingId: booking._id,
      amount: offer.totalAmount,
      currency: offer.currency,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Update booking status
    await wixData.update('bookings', { ...booking, status: 'pending_payment', updatedAt: new Date() });

    return {
      bookingId: booking._id,
      invoiceId: invoice._id,
      amount: offer.totalAmount,
      currency: offer.currency,
      status: 'pending_payment',
    };
  }
);

export const confirmBooking = webMethod(
  Permissions.SiteMember,
  async (bookingId) => {
    const booking = await wixData.get('bookings', bookingId);
    if (!booking) throw new Error('الحجز غير موجود');

    // Check payment
    const invoices = await wixData.query('invoices')
      .eq('bookingId', bookingId)
      .eq('status', 'paid')
      .find();

    if (!invoices.items.length) {
      throw new Error('لم يتم الدفع بعد');
    }

    // Attempt provider booking if supported
    const adapter = adapters[booking.providerName];
    if (adapter?.createBooking) {
      try {
        const offer = await wixData.get('offers', booking.selectedOfferId);
        const endpoint = await getProviderConfig(booking.tenantId, booking.providerName);
        const credentials = await getProviderCredentials(booking.tenantId, booking.providerName);
        const travelers = JSON.parse(booking.travelersJson);
        const contact = JSON.parse(booking.contactJson);

        const result = await adapter.createBooking(endpoint, credentials, offer, travelers, contact);

        await wixData.update('bookings', {
          ...booking,
          providerOrderId: result.providerOrderId || result.pnr || '',
          status: 'confirmed',
          updatedAt: new Date(),
        });

        return { bookingId, status: 'confirmed', pnr: result.pnr || result.providerOrderId };
      } catch (err) {
        await wixData.update('bookings', { ...booking, status: 'failed', updatedAt: new Date() });
        throw new Error(`فشل تأكيد الحجز: ${err.message}`);
      }
    }

    // For meta providers (deeplink only)
    await wixData.update('bookings', { ...booking, status: 'confirmed', updatedAt: new Date() });
    return { bookingId, status: 'confirmed', pnr: '' };
  }
);

export const cancelBooking = webMethod(
  Permissions.SiteMember,
  async (bookingId, userId) => {
    const booking = await wixData.get('bookings', bookingId);
    if (!booking) throw new Error('الحجز غير موجود');
    if (booking.userId !== userId) throw new Error('غير مصرح');

    if (['cancelled', 'refunded'].includes(booking.status)) {
      throw new Error('الحجز ملغي بالفعل');
    }

    const adapter = adapters[booking.providerName];
    if (adapter?.cancelBooking && booking.providerOrderId) {
      try {
        const endpoint = await getProviderConfig(booking.tenantId, booking.providerName);
        const credentials = await getProviderCredentials(booking.tenantId, booking.providerName);
        await adapter.cancelBooking(endpoint, credentials, booking.providerOrderId);
      } catch (err) {
        console.error('Provider cancellation failed:', err.message);
      }
    }

    await wixData.update('bookings', { ...booking, status: 'cancelled', updatedAt: new Date() });
    return { bookingId, status: 'cancelled' };
  }
);

export const getUserBookings = webMethod(
  Permissions.SiteMember,
  async (userId) => {
    const bookings = await wixData.query('bookings')
      .eq('userId', userId)
      .descending('createdAt')
      .find();

    return bookings.items;
  }
);

export const getBookingDetails = webMethod(
  Permissions.SiteMember,
  async (bookingId, userId) => {
    const booking = await wixData.get('bookings', bookingId);
    if (!booking) throw new Error('الحجز غير موجود');
    if (booking.userId !== userId) throw new Error('غير مصرح');

    // Get offer details
    const offer = booking.selectedOfferId
      ? await wixData.get('offers', booking.selectedOfferId)
      : null;

    // Get invoices
    const invoices = await wixData.query('invoices')
      .eq('bookingId', bookingId)
      .find();

    return {
      booking,
      offer,
      invoices: invoices.items,
    };
  }
);
