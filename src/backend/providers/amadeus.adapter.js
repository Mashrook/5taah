/**
 * 5ATTH | خته — Amadeus Provider Adapter
 * GDS Provider for Flights, Hotels, Activities
 */
import { fetch } from 'wix-fetch';
import { getProviderConfig, getProviderCredentials } from './providerBase';

let tokenCache = {};

async function getAccessToken(endpoint, credentials) {
  const cacheKey = `${endpoint.providerName}_${endpoint.environment}`;
  if (tokenCache[cacheKey] && tokenCache[cacheKey].expiresAt > Date.now()) {
    return tokenCache[cacheKey].token;
  }

  const tokenUrl = `${endpoint.baseUrl}/v1/security/oauth2/token`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${credentials.client_id}&client_secret=${credentials.client_secret}`,
  });

  if (!response.ok) {
    throw new Error(`Amadeus auth failed: ${response.status}`);
  }

  const data = await response.json();
  tokenCache[cacheKey] = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

async function amadeusRequest(endpoint, credentials, method, path, body = null) {
  const token = await getAccessToken(endpoint, credentials);
  const url = `${endpoint.baseUrl}${path}`;

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Amadeus API error ${response.status}: ${errText}`);
  }
  return response.json();
}

// ─── Normalize to unified offer format ─────────────────────
function normalizeFlightOffer(raw) {
  return {
    providerName: 'amadeus',
    providerOfferId: raw.id,
    productType: 'flight',
    totalAmount: parseFloat(raw.price?.grandTotal || 0),
    currency: raw.price?.currency || 'SAR',
    baseAmount: parseFloat(raw.price?.base || 0),
    taxesAmount: parseFloat(raw.price?.grandTotal || 0) - parseFloat(raw.price?.base || 0),
    markupAmount: 0,
    refundable: raw.pricingOptions?.refundableFare || false,
    baggageSummaryJson: JSON.stringify(
      raw.travelerPricings?.[0]?.fareDetailsBySegment?.map(s => ({
        segment: s.segmentId,
        includedBags: s.includedCheckedBags?.weight
          ? `${s.includedCheckedBags.weight}${s.includedCheckedBags.weightUnit}`
          : `${s.includedCheckedBags?.quantity || 0} bags`,
      })) || []
    ),
    scoreJson: JSON.stringify({
      numberOfBookableSeats: raw.numberOfBookableSeats,
      lastTicketingDate: raw.lastTicketingDate,
    }),
    deepLinkUrl: '',
    itineraries: (raw.itineraries || []).map((itin, idx) => ({
      direction: idx === 0 ? 'outbound' : 'inbound',
      durationMinutes: parseDuration(itin.duration),
      stopsCount: (itin.segments?.length || 1) - 1,
      segments: (itin.segments || []).map(seg => ({
        fromIata: seg.departure?.iataCode,
        toIata: seg.arrival?.iataCode,
        departAt: seg.departure?.at,
        arriveAt: seg.arrival?.at,
        marketingCarrier: seg.carrierCode,
        operatingCarrier: seg.operating?.carrierCode || seg.carrierCode,
        flightNumber: `${seg.carrierCode}${seg.number}`,
        cabin: raw.travelerPricings?.[0]?.fareDetailsBySegment?.find(f => f.segmentId === seg.id)?.cabin || '',
        fareClass: raw.travelerPricings?.[0]?.fareDetailsBySegment?.find(f => f.segmentId === seg.id)?.class || '',
        baggageJson: '{}',
      })),
    })),
  };
}

function normalizeHotelOffer(raw, hotelInfo) {
  return {
    providerName: 'amadeus',
    providerOfferId: raw.id,
    productType: 'hotel',
    totalAmount: parseFloat(raw.price?.total || 0),
    currency: raw.price?.currency || 'SAR',
    baseAmount: parseFloat(raw.price?.base || 0),
    taxesAmount: parseFloat(raw.price?.total || 0) - parseFloat(raw.price?.base || 0),
    markupAmount: 0,
    refundable: raw.policies?.cancellation?.type !== 'NON_REFUNDABLE',
    baggageSummaryJson: '[]',
    scoreJson: JSON.stringify({ rating: hotelInfo?.rating }),
    deepLinkUrl: '',
    hotelData: {
      providerHotelId: hotelInfo?.hotelId || '',
      roomJson: JSON.stringify(raw.room || {}),
      boardType: raw.boardType || '',
      cancellationPolicyJson: JSON.stringify(raw.policies?.cancellation || {}),
    },
  };
}

function parseDuration(isoDuration) {
  if (!isoDuration) return 0;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return (parseInt(match[1] || 0) * 60) + parseInt(match[2] || 0);
}

// ─── Public Interface ──────────────────────────────────────
export async function searchFlights(endpoint, credentials, params) {
  const { origin, destination, departDate, returnDate, adults, cabin, currency } = params;

  const searchBody = {
    currencyCode: currency || 'SAR',
    originDestinations: [
      {
        id: '1',
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDateTimeRange: { date: departDate },
      },
    ],
    travelers: Array.from({ length: adults || 1 }, (_, i) => ({
      id: String(i + 1),
      travelerType: 'ADULT',
    })),
    sources: ['GDS'],
    searchCriteria: {
      maxFlightOffers: 50,
      flightFilters: {
        cabinRestrictions: cabin ? [{
          cabin: cabin.toUpperCase(),
          coverage: 'MOST_SEGMENTS',
          originDestinationIds: ['1'],
        }] : undefined,
      },
    },
  };

  if (returnDate) {
    searchBody.originDestinations.push({
      id: '2',
      originLocationCode: destination,
      destinationLocationCode: origin,
      departureDateTimeRange: { date: returnDate },
    });
  }

  const data = await amadeusRequest(endpoint, credentials, 'POST', '/v2/shopping/flight-offers', searchBody);
  return (data.data || []).map(normalizeFlightOffer);
}

export async function priceOffer(endpoint, credentials, offerId, rawOffer) {
  const data = await amadeusRequest(endpoint, credentials, 'POST', '/v1/shopping/flight-offers/pricing', {
    data: { type: 'flight-offers-pricing', flightOffers: [rawOffer] },
  });
  if (data.data?.flightOffers?.[0]) {
    return normalizeFlightOffer(data.data.flightOffers[0]);
  }
  return null;
}

export async function createBooking(endpoint, credentials, offer, travelers, contact) {
  const body = {
    data: {
      type: 'flight-order',
      flightOffers: [offer],
      travelers: travelers.map((t, i) => ({
        id: String(i + 1),
        dateOfBirth: t.dateOfBirth,
        name: { firstName: t.firstName, lastName: t.lastName },
        gender: t.gender,
        contact: {
          emailAddress: contact.email,
          phones: [{ number: contact.phone, countryCallingCode: contact.countryCode || '966' }],
        },
        documents: t.passport ? [{
          documentType: 'PASSPORT',
          number: t.passport.number,
          expiryDate: t.passport.expiryDate,
          issuanceCountry: t.passport.issuanceCountry,
          nationality: t.passport.nationality,
          holder: true,
        }] : undefined,
      })),
    },
  };

  const data = await amadeusRequest(endpoint, credentials, 'POST', '/v1/booking/flight-orders', body);
  return {
    providerOrderId: data.data?.id,
    pnr: data.data?.associatedRecords?.[0]?.reference,
    status: 'confirmed',
  };
}

export async function searchHotels(endpoint, credentials, params) {
  const { cityCode, checkInDate, checkOutDate, adults, currency } = params;

  // Step 1: Search hotels by city
  const hotelsData = await amadeusRequest(endpoint, credentials, 'GET',
    `/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&radius=50&radiusUnit=KM&hotelSource=ALL`
  );

  const hotelIds = (hotelsData.data || []).slice(0, 20).map(h => h.hotelId);
  if (!hotelIds.length) return [];

  // Step 2: Get offers
  const offersData = await amadeusRequest(endpoint, credentials, 'GET',
    `/v3/shopping/hotel-offers?hotelIds=${hotelIds.join(',')}&adults=${adults || 1}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&currency=${currency || 'SAR'}`
  );

  const results = [];
  for (const hotel of (offersData.data || [])) {
    for (const offer of (hotel.offers || [])) {
      results.push(normalizeHotelOffer(offer, hotel.hotel));
    }
  }
  return results;
}

export async function searchActivities(endpoint, credentials, params) {
  const { latitude, longitude, radius } = params;
  const data = await amadeusRequest(endpoint, credentials, 'GET',
    `/v1/shopping/activities?latitude=${latitude}&longitude=${longitude}&radius=${radius || 20}`
  );

  return (data.data || []).map(activity => ({
    providerName: 'amadeus',
    providerOfferId: activity.id,
    productType: 'tour',
    totalAmount: parseFloat(activity.price?.amount || 0),
    currency: activity.price?.currencyCode || 'SAR',
    baseAmount: parseFloat(activity.price?.amount || 0),
    taxesAmount: 0,
    markupAmount: 0,
    refundable: true,
    baggageSummaryJson: '[]',
    scoreJson: JSON.stringify({ rating: activity.rating, reviewCount: activity.reviews?.totalReviews }),
    deepLinkUrl: activity.bookingLink || '',
    tourData: {
      activityJson: JSON.stringify({
        name: activity.name,
        description: activity.shortDescription,
        pictures: activity.pictures,
      }),
      meetingPoint: activity.geoCode ? `${activity.geoCode.latitude},${activity.geoCode.longitude}` : '',
      duration: activity.duration || '',
      inclusionsJson: '[]',
    },
  }));
}

export async function cancelBooking(endpoint, credentials, providerOrderId) {
  await amadeusRequest(endpoint, credentials, 'DELETE', `/v1/booking/flight-orders/${providerOrderId}`);
  return { status: 'cancelled' };
}

export async function testConnection(endpoint, credentials) {
  try {
    await getAccessToken(endpoint, credentials);
    return { success: true, message: 'Amadeus connection successful' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
