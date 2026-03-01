/**
 * 5ATTH | خته — Ranking Engine
 * Scores offers: 55% price + 30% duration + 15% stops + GCC bonus
 * Returns sorted array (best first)
 */

export function rankOffers(offers, params) {
  if (!offers.length) return [];

  // Pre-compute ranges
  const totals = offers.map((o) => o.totalAmount).filter(Number.isFinite);
  const minP = Math.min(...totals);
  const maxP = Math.max(...totals);

  const durations = offers.map(totalDuration).filter(Number.isFinite);
  const minD = Math.min(...durations);
  const maxD = Math.max(...durations);

  const scored = offers.map((o) => {
    const duration = totalDuration(o);
    const stops = totalStops(o);

    const priceScore = normalize01(invertRange(o.totalAmount, minP, maxP));
    const durationScore = normalize01(invertRange(duration, minD, maxD));
    const stopsScore = stops === 0 ? 1 : stops === 1 ? 0.7 : 0.4;

    // GCC heuristics: non-stop bonus + prime-time departure bonus
    const gccScore = (stops === 0 ? 0.15 : 0) + (isPrimeTime(o, params) ? 0.05 : 0);

    const value =
      0.55 * priceScore + 0.30 * durationScore + 0.15 * stopsScore + gccScore;

    const reasons = [];
    if (stops === 0) reasons.push("Non-stop");
    if (o.totalAmount === minP) reasons.push("Best price");
    if (duration === minD) reasons.push("Fast");
    if (o.refundable) reasons.push("Refundable");

    return {
      ...o,
      score: { value: round(value), reasons },
    };
  });

  return scored.sort((a, b) => b.score.value - a.score.value);
}

// ─── Helpers ────────────────────────────────────────────────
function totalDuration(o) {
  return (o.slices || []).reduce(
    (acc, sl) => acc + (sl.durationMinutes || 0),
    0
  );
}

function totalStops(o) {
  return (o.slices || []).reduce(
    (acc, sl) => acc + (sl.stopsCount || 0),
    0
  );
}

function invertRange(x, min, max) {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    max === min
  )
    return 1;
  return (max - x) / (max - min);
}

function normalize01(v) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function isPrimeTime(o, params) {
  // GCC-friendly departure window: 06:00-10:00 or 17:00-22:00 local
  const firstDepart = o.slices?.[0]?.segments?.[0]?.departAt;
  if (!firstDepart) return false;
  const hour = new Date(firstDepart).getHours();
  return (hour >= 6 && hour <= 10) || (hour >= 17 && hour <= 22);
}

function round(v) {
  return Math.round(v * 1000) / 1000;
}
