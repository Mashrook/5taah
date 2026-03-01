/**
 * 5ATTH | خته — Skyscanner Provider Adapter
 * Meta Search Provider for Flights
 */
import { fetch } from 'wix-fetch';

async function skyscannerRequest(endpoint, credentials, path, body) {
  const response = await fetch(`${endpoint.baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'x-api-key': credentials.api_key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Skyscanner API error ${response.status}`);
  return response.json();
}

function normalizeFlightOffer(raw, index) {
  const price = raw.price || {};
  return {
    providerName: 'skyscanner',
    providerOfferId: raw.id || `sky_${index}`,
    productType: 'flight',
    totalAmount: parseFloat(price.amount || 0),
    currency: price.currency || 'SAR',
    baseAmount: parseFloat(price.amount || 0),
    taxesAmount: 0,
    markupAmount: 0,
    refundable: false,
    baggageSummaryJson: '[]',
    scoreJson: JSON.stringify({ score: raw.score }),
    deepLinkUrl: raw.deepLink || raw.url || '',
    itineraries: (raw.legs || []).map((leg, idx) => ({
      direction: idx === 0 ? 'outbound' : 'inbound',
      durationMinutes: leg.duration || 0,
      stopsCount: (leg.stops || []).length,
      segments: (leg.segments || []).map(seg => ({
        fromIata: seg.origin?.displayCode || '',
        toIata: seg.destination?.displayCode || '',
        departAt: seg.departure || '',
        arriveAt: seg.arrival || '',
        marketingCarrier: seg.marketingCarrier?.alternateId || '',
        operatingCarrier: seg.operatingCarrier?.alternateId || '',
        flightNumber: `${seg.marketingCarrier?.alternateId || ''}${seg.flightNumber || ''}`,
        cabin: '',
        fareClass: '',
        baggageJson: '{}',
      })),
    })),
  };
}

export async function searchFlights(endpoint, credentials, params) {
  const { origin, destination, departDate, returnDate, adults, cabin, currency } = params;

  const body = {
    query: {
      market: 'SA',
      locale: 'ar-SA',
      currency: currency || 'SAR',
      queryLegs: [
        {
          originPlaceId: { iata: origin },
          destinationPlaceId: { iata: destination },
          date: { year: parseInt(departDate.split('-')[0]), month: parseInt(departDate.split('-')[1]), day: parseInt(departDate.split('-')[2]) },
        },
      ],
      adults: adults || 1,
      cabinClass: cabin ? cabin.toUpperCase() : 'CABIN_CLASS_ECONOMY',
    },
  };

  if (returnDate) {
    body.query.queryLegs.push({
      originPlaceId: { iata: destination },
      destinationPlaceId: { iata: origin },
      date: { year: parseInt(returnDate.split('-')[0]), month: parseInt(returnDate.split('-')[1]), day: parseInt(returnDate.split('-')[2]) },
    });
  }

  const data = await skyscannerRequest(endpoint, credentials, '/api/v3/flights/live/search/create', body);

  // Poll for results
  let results = data;
  if (data.sessionToken) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const pollResponse = await fetch(`${endpoint.baseUrl}/api/v3/flights/live/search/poll/${data.sessionToken}`, {
      headers: { 'x-api-key': credentials.api_key },
    });
    if (pollResponse.ok) results = await pollResponse.json();
  }

  const itineraries = Object.values(results?.content?.results?.itineraries || {});
  return itineraries.slice(0, 50).map((itin, i) => normalizeFlightOffer(itin, i));
}

export async function priceOffer(endpoint, credentials, offerId, rawOffer) {
  // Skyscanner deeplink — no repricing
  return rawOffer;
}

export async function createBooking() {
  throw new Error('Skyscanner does not support direct booking. Use deepLink.');
}

export async function cancelBooking() {
  throw new Error('Skyscanner does not support cancellation.');
}

export async function testConnection(endpoint, credentials) {
  try {
    const response = await fetch(`${endpoint.baseUrl}/api/v3/culture/markets/ar-SA`, {
      headers: { 'x-api-key': credentials.api_key },
    });
    return { success: response.ok, message: response.ok ? 'Skyscanner connection successful' : `Status: ${response.status}` };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
