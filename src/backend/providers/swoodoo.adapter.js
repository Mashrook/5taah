/**
 * 5ATTH | خته — Swoodoo Provider Adapter
 * ⚠️ FEATURE FLAG ONLY — Disabled by default
 * Meta search provider (Kayak/Swoodoo)
 */
import { fetch } from 'wix-fetch';

function normalizeFlightOffer(raw, index) {
  return {
    providerName: 'swoodoo',
    providerOfferId: raw.id || `swoodoo_${index}`,
    productType: 'flight',
    totalAmount: parseFloat(raw.price?.totalAmount || 0),
    currency: raw.price?.currency || 'EUR',
    baseAmount: parseFloat(raw.price?.totalAmount || 0),
    taxesAmount: 0,
    markupAmount: 0,
    refundable: false,
    baggageSummaryJson: '[]',
    scoreJson: JSON.stringify({ score: raw.resultScore }),
    deepLinkUrl: raw.deepLink || '',
    itineraries: (raw.legs || []).map((leg, idx) => ({
      direction: idx === 0 ? 'outbound' : 'inbound',
      durationMinutes: leg.durationMinutes || 0,
      stopsCount: (leg.hops?.length || 1) - 1,
      segments: (leg.hops || []).map(hop => ({
        fromIata: hop.from?.code || '',
        toIata: hop.to?.code || '',
        departAt: hop.departure || '',
        arriveAt: hop.arrival || '',
        marketingCarrier: hop.airline?.code || '',
        operatingCarrier: hop.airline?.code || '',
        flightNumber: hop.flightNumber || '',
        cabin: '',
        fareClass: '',
        baggageJson: '{}',
      })),
    })),
  };
}

export async function searchFlights(endpoint, credentials, params) {
  const { origin, destination, departDate, returnDate, adults } = params;
  const body = {
    origin,
    destination,
    departDate,
    returnDate,
    adults: adults || 1,
    currency: params.currency || 'SAR',
  };

  const response = await fetch(`${endpoint.baseUrl}/api/flights/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Swoodoo API error ${response.status}`);
  const data = await response.json();
  return (data.results || []).map((r, i) => normalizeFlightOffer(r, i));
}

export async function priceOffer(endpoint, credentials, offerId, rawOffer) {
  return rawOffer;
}

export async function createBooking() {
  throw new Error('Swoodoo does not support direct booking. Use deepLink.');
}

export async function cancelBooking() {
  throw new Error('Swoodoo does not support cancellation.');
}

export async function testConnection(endpoint, credentials) {
  try {
    const response = await fetch(`${endpoint.baseUrl}/api/health`, {
      headers: { 'Authorization': `Bearer ${credentials.api_key}` },
    });
    return { success: response.ok, message: response.ok ? 'Swoodoo connection OK' : `Status: ${response.status}` };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
