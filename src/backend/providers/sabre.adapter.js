/**
 * 5ATTH | خته — Sabre Provider Adapter
 * GDS Provider for Flights
 */
import { fetch } from 'wix-fetch';

let tokenCache = {};

async function getAccessToken(endpoint, credentials) {
  const cacheKey = `sabre_${endpoint.environment}`;
  if (tokenCache[cacheKey] && tokenCache[cacheKey].expiresAt > Date.now()) {
    return tokenCache[cacheKey].token;
  }

  const encoded = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64');
  const response = await fetch(`${endpoint.baseUrl}/v2/auth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${encoded}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) throw new Error(`Sabre auth failed: ${response.status}`);
  const data = await response.json();
  tokenCache[cacheKey] = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

async function sabreRequest(endpoint, credentials, method, path, body = null) {
  const token = await getAccessToken(endpoint, credentials);
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(`${endpoint.baseUrl}${path}`, options);
  if (!response.ok) throw new Error(`Sabre API error ${response.status}`);
  return response.json();
}

function normalizeFlightOffer(raw, index) {
  const legs = raw.legs || [];
  return {
    providerName: 'sabre',
    providerOfferId: `sabre_${index}_${Date.now()}`,
    productType: 'flight',
    totalAmount: parseFloat(raw.airItineraryPricingInfo?.totalPrice || 0),
    currency: raw.airItineraryPricingInfo?.currency || 'SAR',
    baseAmount: parseFloat(raw.airItineraryPricingInfo?.basePrice || 0),
    taxesAmount: parseFloat(raw.airItineraryPricingInfo?.taxes || 0),
    markupAmount: 0,
    refundable: raw.isRefundable || false,
    baggageSummaryJson: '[]',
    scoreJson: JSON.stringify({}),
    deepLinkUrl: '',
    itineraries: legs.map((leg, idx) => ({
      direction: idx === 0 ? 'outbound' : 'inbound',
      durationMinutes: leg.elapsedTime || 0,
      stopsCount: (leg.segments?.length || 1) - 1,
      segments: (leg.segments || []).map(seg => ({
        fromIata: seg.departureAirport,
        toIata: seg.arrivalAirport,
        departAt: seg.departureDateTime,
        arriveAt: seg.arrivalDateTime,
        marketingCarrier: seg.marketingAirline,
        operatingCarrier: seg.operatingAirline || seg.marketingAirline,
        flightNumber: `${seg.marketingAirline}${seg.flightNumber}`,
        cabin: seg.cabinClass || '',
        fareClass: seg.bookingClass || '',
        baggageJson: '{}',
      })),
    })),
  };
}

export async function searchFlights(endpoint, credentials, params) {
  const { origin, destination, departDate, returnDate, adults, cabin } = params;
  const body = {
    OTA_AirLowFareSearchRQ: {
      OriginDestinationInformation: [
        {
          DepartureDateTime: departDate,
          OriginLocation: { LocationCode: origin },
          DestinationLocation: { LocationCode: destination },
        },
      ],
      TravelerInfoSummary: {
        AirTravelerAvail: [{ PassengerTypeQuantity: [{ Code: 'ADT', Quantity: adults || 1 }] }],
      },
      TPA_Extensions: {
        IntelliSellTransaction: { RequestType: { Name: '50ITINS' } },
      },
    },
  };

  if (returnDate) {
    body.OTA_AirLowFareSearchRQ.OriginDestinationInformation.push({
      DepartureDateTime: returnDate,
      OriginLocation: { LocationCode: destination },
      DestinationLocation: { LocationCode: origin },
    });
  }

  const data = await sabreRequest(endpoint, credentials, 'POST', '/v4/offers/shop', body);
  const itineraries = data?.groupedItineraryResponse?.itineraryGroups?.[0]?.itineraries || [];
  return itineraries.map((itin, i) => normalizeFlightOffer(itin, i));
}

export async function priceOffer(endpoint, credentials, offerId, rawOffer) {
  // Sabre re-validation
  return rawOffer;
}

export async function createBooking(endpoint, credentials, offer, travelers, contact) {
  const body = {
    CreatePassengerNameRecordRQ: {
      TravelItineraryAddInfo: {
        CustomerInfo: {
          PersonName: travelers.map(t => ({
            GivenName: t.firstName,
            Surname: t.lastName,
          })),
          ContactNumbers: {
            ContactNumber: [{ Phone: contact.phone, PhoneUseType: 'H' }],
          },
          Email: [{ Address: contact.email, Type: 'TO' }],
        },
      },
    },
  };

  const data = await sabreRequest(endpoint, credentials, 'POST', '/v2.4.0/passenger/records?mode=create', body);
  return {
    providerOrderId: data?.CreatePassengerNameRecordRS?.ItineraryRef?.ID,
    pnr: data?.CreatePassengerNameRecordRS?.ItineraryRef?.ID,
    status: 'confirmed',
  };
}

export async function cancelBooking(endpoint, credentials, providerOrderId) {
  await sabreRequest(endpoint, credentials, 'POST', `/v1/trip/orders/cancelBooking`, {
    confirmationId: providerOrderId,
  });
  return { status: 'cancelled' };
}

export async function testConnection(endpoint, credentials) {
  try {
    await getAccessToken(endpoint, credentials);
    return { success: true, message: 'Sabre connection successful' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
