/**
 * 5ATTH | خته — Normalization Layer
 * Converts raw Amadeus / Sabre responses into a unified Offer model
 */

// ─── Amadeus ────────────────────────────────────────────────
export function normalizeAmadeusOffers(amadeusJson) {
  const data = amadeusJson?.data || [];
  return data.map((o) => {
    const price = o?.price || {};
    const total = Number(price.grandTotal || price.total || 0);
    const base = Number(price.base || 0);
    const taxes = Math.max(0, total - base);

    const slices = (o.itineraries || []).map((it, idx) => {
      const segs = (it.segments || []).map((s) => ({
        fromIata: s.departure?.iataCode,
        toIata: s.arrival?.iataCode,
        departAt: s.departure?.at,
        arriveAt: s.arrival?.at,
        marketingCarrier: s.carrierCode,
        operatingCarrier: s.operating?.carrierCode || s.carrierCode,
        flightNumber: s.number,
        cabin: firstTravelerCabin(o),
        fareClass: firstTravelerFareClass(o),
        baggage: extractBaggage(o, s.id),
      }));

      return {
        direction: idx === 0 ? "outbound" : "inbound",
        durationMinutes: isoDurationToMinutes(it.duration),
        stopsCount: Math.max(0, segs.length - 1),
        segments: segs,
      };
    });

    const routeKey = buildRouteKeyFromSlices(slices);
    const itineraryKey = fingerprintItinerary(slices);

    return {
      providerName: "amadeus",
      providerOfferId: o.id,
      productType: "flight",
      currency: price.currency || "SAR",
      totalAmount: total,
      baseAmount: base,
      taxesAmount: taxes,
      markupAmount: 0,
      refundable: o.pricingOptions?.refundableFare || false,
      routeKey,
      itineraryKey,
      slices,
      baggageSummary: buildBaggageSummary(slices),
      score: { value: 0, reasons: [] },
      raw: null,
    };
  });
}

// ─── Sabre ──────────────────────────────────────────────────
export function normalizeSabreOffers(sabreJson) {
  // Sabre Bargain Finder Max shape
  const groups = sabreJson?.groupedItineraryResponse?.itineraryGroups || [];
  const offers = [];

  for (const group of groups) {
    for (const itin of (group.itineraries || [])) {
      const pricing = itin.pricingInformation?.[0]?.fare || {};
      const totalAmount = Number(pricing.totalFare?.totalPrice || itin.airItineraryPricingInfo?.totalPrice || 0);
      const baseAmount = Number(pricing.totalFare?.baseFareAmount || itin.airItineraryPricingInfo?.basePrice || 0);
      const taxes = Math.max(0, totalAmount - baseAmount);

      const legs = itin.legs || [];
      const slices = legs.map((leg, idx) => {
        const segs = (leg.schedules || leg.segments || []).map((s) => ({
          fromIata: s.departure?.airport || s.departureAirport,
          toIata: s.arrival?.airport || s.arrivalAirport,
          departAt: s.departure?.time || s.departureDateTime,
          arriveAt: s.arrival?.time || s.arrivalDateTime,
          marketingCarrier: s.carrier?.marketing || s.marketingAirline,
          operatingCarrier: s.carrier?.operating || s.operatingAirline || s.carrier?.marketing || s.marketingAirline,
          flightNumber: String(s.carrier?.marketingFlightNumber || s.flightNumber || ""),
          cabin: s.cabinClass || "ECONOMY",
          fareClass: s.bookingClass || "",
          baggage: {},
        }));
        return {
          direction: idx === 0 ? "outbound" : "inbound",
          durationMinutes: leg.elapsedTime || 0,
          stopsCount: Math.max(0, segs.length - 1),
          segments: segs,
        };
      });

      const routeKey = buildRouteKeyFromSlices(slices);
      const itineraryKey = fingerprintItinerary(slices);

      offers.push({
        providerName: "sabre",
        providerOfferId: `sabre_${itin.id || Date.now()}_${offers.length}`,
        productType: "flight",
        currency: pricing.totalFare?.currencyCode || "SAR",
        totalAmount,
        baseAmount,
        taxesAmount: taxes,
        markupAmount: 0,
        refundable: !!itin.isRefundable,
        routeKey,
        itineraryKey,
        slices,
        baggageSummary: "",
        score: { value: 0, reasons: [] },
        raw: null,
      });
    }
  }

  // Fallback: flat array shape
  if (offers.length === 0) {
    const flat = sabreJson?.offers || sabreJson?.data || [];
    for (const o of flat) {
      const total = Number(o.totalAmount || o.price?.total || 0);
      const base = Number(o.baseAmount || o.price?.base || 0);
      const taxes = Math.max(0, total - base);

      const slices = (o.itineraries || o.legs || []).map((it, idx) => {
        const segs = (it.segments || []).map((s) => ({
          fromIata: s.from || s.departure?.iataCode || s.departureAirport,
          toIata: s.to || s.arrival?.iataCode || s.arrivalAirport,
          departAt: s.departAt || s.departureTime || s.departureDateTime,
          arriveAt: s.arriveAt || s.arrivalTime || s.arrivalDateTime,
          marketingCarrier: s.marketingCarrier || s.marketingAirline,
          operatingCarrier: s.operatingCarrier || s.operatingAirline || s.marketingCarrier || s.marketingAirline,
          flightNumber: s.flightNumber || "",
          cabin: s.cabin || "ECONOMY",
          fareClass: s.fareClass || "",
          baggage: {},
        }));
        return {
          direction: idx === 0 ? "outbound" : "inbound",
          durationMinutes: it.durationMinutes || 0,
          stopsCount: Math.max(0, segs.length - 1),
          segments: segs,
        };
      });

      const routeKey = buildRouteKeyFromSlices(slices);
      const itineraryKey = fingerprintItinerary(slices);

      offers.push({
        providerName: "sabre",
        providerOfferId: String(o.id || o.offerId || `sabre_${offers.length}`),
        productType: "flight",
        currency: o.currency || "SAR",
        totalAmount: total,
        baseAmount: base,
        taxesAmount: taxes,
        markupAmount: 0,
        refundable: !!o.refundable,
        routeKey,
        itineraryKey,
        slices,
        baggageSummary: "",
        score: { value: 0, reasons: [] },
        raw: null,
      });
    }
  }

  return offers;
}

// ─── Helpers ────────────────────────────────────────────────
function isoDurationToMinutes(iso) {
  if (!iso || typeof iso !== "string") return 0;
  const h = /(\d+)H/.exec(iso)?.[1];
  const m = /(\d+)M/.exec(iso)?.[1];
  return (h ? Number(h) * 60 : 0) + (m ? Number(m) : 0);
}

function firstTravelerCabin(amadeusOffer) {
  const tp = amadeusOffer?.travelerPricings?.[0];
  const seg = tp?.fareDetailsBySegment?.[0];
  return seg?.cabin || "ECONOMY";
}

function firstTravelerFareClass(amadeusOffer) {
  const tp = amadeusOffer?.travelerPricings?.[0];
  const seg = tp?.fareDetailsBySegment?.[0];
  return seg?.class || "";
}

function extractBaggage(amadeusOffer, segmentId) {
  const tp = amadeusOffer?.travelerPricings?.[0];
  const fareDetail = tp?.fareDetailsBySegment?.find((f) => f.segmentId === segmentId);
  const checked = fareDetail?.includedCheckedBags;
  return {
    cabinKg: 7,
    checkedKg: checked?.weight || (checked?.quantity ? checked.quantity * 23 : 0),
  };
}

function buildBaggageSummary(slices) {
  const firstSeg = slices?.[0]?.segments?.[0];
  if (!firstSeg?.baggage) return "";
  const b = firstSeg.baggage;
  const parts = [];
  if (b.cabinKg) parts.push(`Cabin ${b.cabinKg}kg`);
  if (b.checkedKg) parts.push(`Checked ${b.checkedKg}kg`);
  return parts.join(" • ");
}

export function buildRouteKeyFromSlices(slices) {
  const firstSeg = slices?.[0]?.segments?.[0];
  const lastSeg = slices?.[0]?.segments?.slice(-1)?.[0];
  const departDate = firstSeg?.departAt ? String(firstSeg.departAt).slice(0, 10) : "NA";
  return `${firstSeg?.fromIata || "NA"}-${lastSeg?.toIata || "NA"}-${departDate}`;
}

export function fingerprintItinerary(slices) {
  const parts = [];
  for (const sl of slices || []) {
    for (const s of sl.segments || []) {
      parts.push(
        `${s.fromIata}${s.toIata}${s.marketingCarrier}${s.flightNumber}${String(s.departAt).slice(0, 16)}`
      );
    }
    parts.push("|");
  }
  return parts.join("-");
}
