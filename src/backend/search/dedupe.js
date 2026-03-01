/**
 * 5ATTH | خته — Deduplication Layer
 * Removes duplicate offers across providers using itineraryKey fingerprint
 * Prefers cheaper total; on tie prefers amadeus (primary GDS)
 */

export function dedupeOffers(offers) {
  const map = new Map();

  for (const o of offers) {
    const key = o.itineraryKey || `${o.providerName}:${o.providerOfferId}`;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, o);
      continue;
    }

    // Choose lower total
    if (o.totalAmount < existing.totalAmount) {
      map.set(key, o);
    } else if (o.totalAmount === existing.totalAmount && o.providerName === "amadeus") {
      // On tie prefer Amadeus (primary GDS)
      map.set(key, o);
    }
  }

  return Array.from(map.values());
}
