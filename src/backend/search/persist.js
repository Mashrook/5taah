/**
 * 5ATTH | خته — Persist Layer
 * Saves SearchSessions + Offers to Wix Data collections
 */
import wixData from 'wix-data';

/**
 * Create a new SearchSession with 10-minute expiry
 */
export async function createSearchSession({ productType, params, providerStrategy }) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

  const rec = await wixData.insert("SearchSessions", {
    productType,
    paramsJson: JSON.stringify(params),
    providerStrategy: providerStrategy || "multi",
    createdAt: now,
    expiresAt,
  });

  return rec._id;
}

/**
 * Bulk-save normalized+ranked offers linked to a search session
 */
export async function saveOffers(searchSessionId, offers) {
  const items = offers.map((o) => ({
    searchSessionId,
    providerName: o.providerName,
    providerOfferId: o.providerOfferId,
    productType: o.productType,
    totalAmount: o.totalAmount,
    currency: o.currency,
    baseAmount: o.baseAmount,
    taxesAmount: o.taxesAmount,
    markupAmount: o.markupAmount || 0,
    refundable: o.refundable || false,
    baggageSummaryJson: JSON.stringify({
      text: o.baggageSummary || "",
      slices: (o.slices || []).map((sl) =>
        (sl.segments || []).map((s) => s.baggage || {})
      ),
    }),
    deepLinkUrl: o.deepLinkUrl || "",
    createdAt: new Date(),
  }));

  // Sequential insert (Wix Data doesn't have native bulkInsert on all plans)
  const insertedIds = [];
  for (const it of items) {
    try {
      const rec = await wixData.insert("Offers", it);
      insertedIds.push(rec._id);
    } catch (e) {
      console.error(`Failed to save offer ${it.providerOfferId}: ${e.message}`);
    }
  }

  return insertedIds;
}

/**
 * Load offers for a given search session (for re-display / pagination)
 */
export async function loadOffers(searchSessionId, { limit = 50, skip = 0 } = {}) {
  const results = await wixData
    .query("Offers")
    .eq("searchSessionId", searchSessionId)
    .descending("totalAmount")
    .skip(skip)
    .limit(limit)
    .find();

  return results.items;
}

/**
 * Check if a search session is still valid (not expired)
 */
export async function isSessionValid(searchSessionId) {
  const rec = await wixData.get("SearchSessions", searchSessionId);
  if (!rec) return false;
  return new Date(rec.expiresAt) > new Date();
}
