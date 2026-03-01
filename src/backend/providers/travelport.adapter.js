/**
 * 5ATTH | خته — Travelport Provider Adapter
 * GDS Provider for Flights
 */
import { fetch } from 'wix-fetch';

async function travelportRequest(endpoint, credentials, body) {
  const response = await fetch(`${endpoint.baseUrl}/air/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.api_key}`,
      'Content-Type': 'application/json',
      'UAPI-TargetBranch': credentials.target_branch || '',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Travelport API error ${response.status}`);
  return response.json();
}

function normalizeFlightOffer(raw, index) {
  return {
    providerName: 'travelport',
    providerOfferId: raw.TransactionId || `travelport_${index}`,
    productType: 'flight',
    totalAmount: parseFloat(raw.TotalPrice || 0),
    currency: raw.Currency || 'SAR',
    baseAmount: parseFloat(raw.BasePrice || 0),
    taxesAmount: parseFloat(raw.Taxes || 0),
    markupAmount: 0,
    refundable: raw.Refundable || false,
    baggageSummaryJson: JSON.stringify(raw.BaggageAllowance || []),
    scoreJson: '{}',
    deepLinkUrl: '',
    itineraries: (raw.AirSegments || []).map((seg, idx) => ({
      direction: idx === 0 ? 'outbound' : 'inbound',
      durationMinutes: seg.FlightTime || 0,
      stopsCount: seg.StopCount || 0,
      segments: [{
        fromIata: seg.Origin,
        toIata: seg.Destination,
        departAt: seg.DepartureTime,
        arriveAt: seg.ArrivalTime,
        marketingCarrier: seg.Carrier,
        operatingCarrier: seg.OperatingCarrier || seg.Carrier,
        flightNumber: `${seg.Carrier}${seg.FlightNumber}`,
        cabin: seg.CabinClass || '',
        fareClass: seg.BookingCode || '',
        baggageJson: '{}',
      }],
    })),
  };
}

export async function searchFlights(endpoint, credentials, params) {
  const { origin, destination, departDate, returnDate, adults, cabin } = params;
  const body = {
    SearchAirLeg: [{
      SearchOrigin: { CityOrAirport: { Code: origin } },
      SearchDestination: { CityOrAirport: { Code: destination } },
      SearchDepTime: { PreferredTime: departDate },
    }],
    SearchPassenger: Array.from({ length: adults || 1 }, () => ({ Code: 'ADT' })),
    AirSearchModifiers: {
      PreferredProviders: { Provider: [{ Code: '1G' }] },
      MaxResults: 50,
    },
  };

  if (returnDate) {
    body.SearchAirLeg.push({
      SearchOrigin: { CityOrAirport: { Code: destination } },
      SearchDestination: { CityOrAirport: { Code: origin } },
      SearchDepTime: { PreferredTime: returnDate },
    });
  }

  const data = await travelportRequest(endpoint, credentials, body);
  return (data.AirPricingSolution || []).map((sol, i) => normalizeFlightOffer(sol, i));
}

export async function priceOffer(endpoint, credentials, offerId, rawOffer) {
  return rawOffer;
}

export async function createBooking(endpoint, credentials, offer, travelers, contact) {
  const body = {
    BookingTraveler: travelers.map((t, i) => ({
      TravelerType: 'ADT',
      BookingTravelerName: { First: t.firstName, Last: t.lastName },
      PhoneNumber: { Number: contact.phone },
      Email: { EmailID: contact.email },
    })),
    AirPricingSolution: offer,
  };

  const data = await travelportRequest(endpoint, credentials, body);
  return {
    providerOrderId: data.UniversalRecordLocatorCode || '',
    pnr: data.ProviderLocatorCode || '',
    status: 'confirmed',
  };
}

export async function cancelBooking(endpoint, credentials, providerOrderId) {
  await travelportRequest(endpoint, credentials, {
    UniversalRecordLocatorCode: providerOrderId,
    Action: 'Cancel',
  });
  return { status: 'cancelled' };
}

export async function testConnection(endpoint, credentials) {
  try {
    const response = await fetch(`${endpoint.baseUrl}/system/ping`, {
      headers: { 'Authorization': `Bearer ${credentials.api_key}` },
    });
    return { success: response.ok, message: response.ok ? 'Travelport connection successful' : `Status: ${response.status}` };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
