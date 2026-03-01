/**
 * 5ATTH | خته — Unified Search Adapter
 * Parallel fan-out to multiple providers → Normalize → Dedupe → Rank → Persist
 *
 * Interface:
 *   searchFlightsUnified(params, options) → { sessionId, offers[] }
 */
import { createSearchSession, saveOffers } from './persist.js';
import { normalizeAmadeusOffers, normalizeSabreOffers } from './normalize.js';
import { dedupeOffers } from './dedupe.js';
import { rankOffers } from './rank.js';

import { searchFlightsRaw as searchFlightsAmadeus } from '../providers/amadeus.adapter.js';
import { searchFlightsRaw as searchFlightsSabre } from '../providers/sabre.adapter.js';

/**
 * params: { origin, destination, departDate, returnDate?, adults, cabin, currency }
 * options: { environment, maxOffersPerProvider, providerTimeoutMs, strategy }
 */
export async function searchFlightsUnified(params, options = {}) {
  const env = options.environment || "production";
  const timeoutMs = options.providerTimeoutMs || 12000;
  const strategy = options.strategy || "multi";

  // 1) Create Search Session in DB
  const sessionId = await createSearchSession({
    productType: "flight",
    params,
    providerStrategy: strategy,
  });

  // 2) Run providers in parallel with timeout
  const tasks = [
    withTimeout(
      searchFlightsAmadeus(params, { env }),
      timeoutMs,
      "amadeus"
    ),
    withTimeout(
      searchFlightsSabre(params, { env }),
      timeoutMs,
      "sabre"
    ),
  ];

  const results = await Promise.allSettled(tasks);

  const amadeusRaw = getFulfilled(results, 0, "amadeus");
  const sabreRaw = getFulfilled(results, 1, "sabre");

  // 3) Normalize each provider's raw response to unified Offer model
  const normalized = [
    ...(amadeusRaw ? normalizeAmadeusOffers(amadeusRaw) : []),
    ...(sabreRaw ? normalizeSabreOffers(sabreRaw) : []),
  ];

  // 4) Deduplicate cross-provider (prefer cheaper same-itinerary)
  const deduped = dedupeOffers(normalized);

  // 5) Rank & score (price 55% + duration 30% + stops 15% + GCC bonus)
  const ranked = rankOffers(deduped, params);

  // 6) Persist offers linked to the session
  await saveOffers(sessionId, ranked);

  // 7) Return to frontend
  return {
    sessionId,
    totalResults: ranked.length,
    providers: {
      amadeus: amadeusRaw ? "ok" : "failed",
      sabre: sabreRaw ? "ok" : "failed",
    },
    offers: ranked,
  };
}

// ─── Timeout wrapper ─────────────────────────────────────────
function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`Timeout: ${label} exceeded ${ms}ms`)),
      ms
    );
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

function getFulfilled(results, index, providerName) {
  const r = results[index];
  if (r.status === "fulfilled") return r.value;
  console.warn(`Provider ${providerName} did not return results: ${r.reason?.message || r.reason}`);
  return null;
}
