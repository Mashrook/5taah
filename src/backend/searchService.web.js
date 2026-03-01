/**
 * 5ATTH | خته — Search Service (Backend / Web Module)
 * Unified multi-provider search with fallback
 */
import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { searchWithFallback, getProviderCredentials } from './providers/providerBase';
import * as amadeus from './providers/amadeus.adapter';
import * as sabre from './providers/sabre.adapter';
import * as travelport from './providers/travelport.adapter';
import * as skyscanner from './providers/skyscanner.adapter';
import * as skiplagged from './providers/skiplagged.adapter';
import * as swoodoo from './providers/swoodoo.adapter';

const adapters = {
  amadeus,
  sabre,
  travelport,
  skyscanner,
  skiplagged,
  swoodoo,
};

// ─── Create Search Session ──────────────────────────────────
async function createSearchSession(tenantId, userId, productType, params, strategy) {
  const session = await wixData.insert('search_sessions', {
    tenantId,
    userId: userId || null,
    productType,
    paramsJson: JSON.stringify(params),
    providerStrategy: strategy,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
  });
  return session._id;
}

// ─── Store Offers ──────────────────────────────────────────
async function storeOffers(sessionId, tenantId, providerName, offers) {
  const items = offers.map(offer => ({
    searchSessionId: sessionId,
    tenantId,
    providerName: offer.providerName || providerName,
    providerOfferId: offer.providerOfferId,
    productType: offer.productType,
    totalAmount: offer.totalAmount,
    currency: offer.currency,
    baseAmount: offer.baseAmount,
    taxesAmount: offer.taxesAmount,
    markupAmount: offer.markupAmount,
    refundable: offer.refundable,
    baggageSummaryJson: offer.baggageSummaryJson,
    scoreJson: offer.scoreJson,
    deepLinkUrl: offer.deepLinkUrl,
    createdAt: new Date(),
  }));

  const inserted = [];
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const originalOffer = offers[idx];
    const result = await wixData.insert('offers', item);
    inserted.push(result);

    // Store itineraries
    if (originalOffer.itineraries) {
      for (const itin of originalOffer.itineraries) {
        const itinRecord = await wixData.insert('itineraries', {
          offerId: result._id,
          direction: itin.direction,
          durationMinutes: itin.durationMinutes,
          stopsCount: itin.stopsCount,
        });

        if (itin.segments) {
          for (const seg of itin.segments) {
            await wixData.insert('segments', {
              itineraryId: itinRecord._id,
              ...seg,
            });
          }
        }
      }
    }

    // Store hotel data
    if (originalOffer.hotelData) {
      await wixData.insert('hotels_offers', {
        offerId: result._id,
        ...originalOffer.hotelData,
      });
    }

    // Store tour data
    if (originalOffer.tourData) {
      await wixData.insert('tours_offers', {
        offerId: result._id,
        ...originalOffer.tourData,
      });
    }
  }

  return inserted;
}

// ─── Apply Markup ──────────────────────────────────────────
async function applyMarkup(tenantId, offer) {
  const rules = await wixData.query('markup_rules')
    .eq('tenantId', tenantId)
    .eq('enabled', true)
    .ascending('priority')
    .find();

  let markupAmount = 0;
  for (const rule of rules.items) {
    const scope = JSON.parse(rule.scopeJson || '{}');
    if (scope.productType && scope.productType !== offer.productType) continue;
    if (scope.providerName && scope.providerName !== offer.providerName) continue;

    if (rule.ruleType === 'percentage') {
      markupAmount += offer.baseAmount * (rule.value / 100);
    } else if (rule.ruleType === 'fixed') {
      markupAmount += rule.value;
    }
  }

  offer.markupAmount = Math.round(markupAmount * 100) / 100;
  offer.totalAmount = offer.baseAmount + offer.taxesAmount + offer.markupAmount;
  return offer;
}

// ─── Public API ────────────────────────────────────────────

export const searchFlights = webMethod(
  Permissions.Anyone,
  async (tenantId, params) => {
    const strategy = params.strategy || 'gds_first';
    const sessionId = await createSearchSession(tenantId, params.userId, 'flight', params, strategy);

    const result = await searchWithFallback(tenantId, 'flights', strategy, async (endpoint, credentials) => {
      const adapter = adapters[endpoint.providerName];
      if (!adapter?.searchFlights) return [];
      return adapter.searchFlights(endpoint, credentials, params);
    });

    if (result.results.length > 0) {
      const markedUp = await Promise.all(result.results.map(o => applyMarkup(tenantId, o)));
      await storeOffers(sessionId, tenantId, result.provider, markedUp);
      return {
        sessionId,
        provider: result.provider,
        offers: markedUp.sort((a, b) => a.totalAmount - b.totalAmount),
        count: markedUp.length,
      };
    }

    return { sessionId, provider: null, offers: [], count: 0 };
  }
);

export const searchHotels = webMethod(
  Permissions.Anyone,
  async (tenantId, params) => {
    const strategy = params.strategy || 'gds_first';
    const sessionId = await createSearchSession(tenantId, params.userId, 'hotel', params, strategy);

    const result = await searchWithFallback(tenantId, 'hotels', strategy, async (endpoint, credentials) => {
      const adapter = adapters[endpoint.providerName];
      if (!adapter?.searchHotels) return [];
      return adapter.searchHotels(endpoint, credentials, params);
    });

    if (result.results.length > 0) {
      const markedUp = await Promise.all(result.results.map(o => applyMarkup(tenantId, o)));
      await storeOffers(sessionId, tenantId, result.provider, markedUp);
      return { sessionId, provider: result.provider, offers: markedUp, count: markedUp.length };
    }

    return { sessionId, provider: null, offers: [], count: 0 };
  }
);

export const searchActivities = webMethod(
  Permissions.Anyone,
  async (tenantId, params) => {
    const strategy = params.strategy || 'gds_first';
    const sessionId = await createSearchSession(tenantId, params.userId, 'tour', params, strategy);

    const result = await searchWithFallback(tenantId, 'tours', strategy, async (endpoint, credentials) => {
      const adapter = adapters[endpoint.providerName];
      if (!adapter?.searchActivities) return [];
      return adapter.searchActivities(endpoint, credentials, params);
    });

    if (result.results.length > 0) {
      const markedUp = await Promise.all(result.results.map(o => applyMarkup(tenantId, o)));
      await storeOffers(sessionId, tenantId, result.provider, markedUp);
      return { sessionId, provider: result.provider, offers: markedUp, count: markedUp.length };
    }

    return { sessionId, provider: null, offers: [], count: 0 };
  }
);

export const getOfferDetails = webMethod(
  Permissions.Anyone,
  async (offerId) => {
    const offer = await wixData.get('offers', offerId);
    if (!offer) throw new Error('Offer not found');

    // Include itineraries
    const itineraries = await wixData.query('itineraries')
      .eq('offerId', offerId)
      .find();

    for (const itin of itineraries.items) {
      const segments = await wixData.query('segments')
        .eq('itineraryId', itin._id)
        .find();
      itin.segments = segments.items;
    }

    offer.itineraries = itineraries.items;

    // Include hotel data if present
    if (offer.productType === 'hotel') {
      const hotelData = await wixData.query('hotels_offers')
        .eq('offerId', offerId)
        .find();
      offer.hotelData = hotelData.items[0] || null;
    }

    // Include tour data if present
    if (offer.productType === 'tour') {
      const tourData = await wixData.query('tours_offers')
        .eq('offerId', offerId)
        .find();
      offer.tourData = tourData.items[0] || null;
    }

    return offer;
  }
);
