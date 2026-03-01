/**
 * 5ATTH | خته — Skiplagged Provider Adapter
 * ⚠️ FEATURE FLAG ONLY — Disabled by default
 * Meta provider for hidden-city ticketing flights
 */
import { fetch } from 'wix-fetch';

function normalizeFlightOffer(raw, index) {
  return {
    providerName: 'skiplagged',
    providerOfferId: raw.id || `skiplagged_${index}`,
    productType: 'flight',
    totalAmount: parseFloat(raw.price || 0),
    currency: raw.currency || 'USD',
    baseAmount: parseFloat(raw.price || 0),
    taxesAmount: 0,
    markupAmount: 0,
    refundable: false,
    baggageSummaryJson: '[]',
    scoreJson: JSON.stringify({ savings: raw.savings }),
    deepLinkUrl: raw.url || '',
    itineraries: (raw.flights || []).map((flight, idx) => ({
      direction: idx === 0 ? 'outbound' : 'inbound',
      durationMinutes: flight.duration || 0,
      stopsCount: (flight.segments?.length || 1) - 1,
      segments: (flight.segments || []).map(seg => ({
        fromIata: seg.from || '',
        toIata: seg.to || '',
        departAt: seg.departure || '',
        arriveAt: seg.arrival || '',
        marketingCarrier: seg.airline || '',
        operatingCarrier: seg.airline || '',
        flightNumber: seg.flightNumber || '',
        cabin: 'ECONOMY',
        fareClass: '',
        baggageJson: '{}',
      })),
    })),
  };
}

export async function searchFlights(endpoint, credentials, params) {
  const { origin, destination, departDate, returnDate, adults } = params;
  const url = `${endpoint.baseUrl}/api/search.php?from=${origin}&to=${destination}&depart=${departDate}${returnDate ? `&return=${returnDate}` : ''}&passengers=${adults || 1}`;

  const response = await fetch(url, {
    headers: credentials.api_key ? { 'X-Api-Key': credentials.api_key } : {},
  });

  if (!response.ok) throw new Error(`Skiplagged API error ${response.status}`);
  const data = await response.json();

  return (data.flights || data.results || []).map((f, i) => normalizeFlightOffer(f, i));
}

export async function priceOffer(endpoint, credentials, offerId, rawOffer) {
  return rawOffer;
}

export async function createBooking() {
  throw new Error('Skiplagged does not support direct booking. Use deepLink.');
}

export async function cancelBooking() {
  throw new Error('Skiplagged does not support cancellation.');
}

export async function testConnection(endpoint, credentials) {
  try {
    const response = await fetch(`${endpoint.baseUrl}/api/search.php?from=RUH&to=DXB&depart=2026-04-01`, {
      headers: credentials.api_key ? { 'X-Api-Key': credentials.api_key } : {},
    });
    return { success: response.ok, message: response.ok ? 'Skiplagged connection OK' : `Status: ${response.status}` };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
