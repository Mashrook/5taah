import { logApiSearch } from "@/lib/apiSearchLogger";

const FUNCTION_NAME = "travelpayouts";

const defaultHeaders = {
  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
};

function buildUrl(action: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ action, ...params });
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${FUNCTION_NAME}?${qs}`;
}

async function tpFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: { ...defaultHeaders, ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "فشل طلب Travelpayouts");
  }
  return res.json();
}

// Convert direct URLs to Travelpayouts partner links
export async function createPartnerLinks(urls: string[], subId?: string): Promise<{ partnerUrl: string; url: string }[]> {
  const startedAt = performance.now();
  try {
    const data = await tpFetch(buildUrl("partner-link", {}), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls, sub_id: subId }),
    });
    const links = (data?.result?.links || []).map((l: { url: string; partner_url: string }) => ({
      url: l.url,
      partnerUrl: l.partner_url || l.url,
    }));
    await logApiSearch({
      provider: "travelpayouts",
      searchType: "partner",
      searchParams: { urlsCount: urls.length, subId: subId || null },
      resultsCount: links.length,
      responseTimeMs: performance.now() - startedAt,
    });
    return links;
  } catch (error) {
    await logApiSearch({
      provider: "travelpayouts",
      searchType: "partner",
      searchParams: { urlsCount: urls.length, subId: subId || null },
      resultsCount: 0,
      responseTimeMs: performance.now() - startedAt,
      errorMessage: error instanceof Error ? error.message : "Partner links failed",
    });
    throw error;
  }
}

// Get a flight search partner deeplink
export async function getFlightDeeplink(params: {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adults?: number;
}): Promise<string> {
  const startedAt = performance.now();
  try {
    const data = await tpFetch(
      buildUrl("flight-deeplink", {
        origin: params.origin,
        destination: params.destination,
        departDate: params.departDate,
        ...(params.returnDate ? { returnDate: params.returnDate } : {}),
        adults: String(params.adults || 1),
      }),
    );
    const link = data.partnerUrl || data.directUrl || "";
    await logApiSearch({
      provider: "travelpayouts",
      searchType: "flight",
      searchParams: params as Record<string, unknown>,
      resultsCount: link ? 1 : 0,
      responseTimeMs: performance.now() - startedAt,
    });
    return link;
  } catch (error) {
    await logApiSearch({
      provider: "travelpayouts",
      searchType: "flight",
      searchParams: params as Record<string, unknown>,
      resultsCount: 0,
      responseTimeMs: performance.now() - startedAt,
      errorMessage: error instanceof Error ? error.message : "Flight deeplink failed",
    });
    throw error;
  }
}

// Get a hotel search partner deeplink
export async function getHotelDeeplink(params: {
  city: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
}): Promise<string> {
  const startedAt = performance.now();
  try {
    const data = await tpFetch(
      buildUrl("hotel-deeplink", {
        city: params.city,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        adults: String(params.adults || 2),
      }),
    );
    const link = data.partnerUrl || data.directUrl || "";
    await logApiSearch({
      provider: "travelpayouts",
      searchType: "hotel",
      searchParams: params as Record<string, unknown>,
      resultsCount: link ? 1 : 0,
      responseTimeMs: performance.now() - startedAt,
    });
    return link;
  } catch (error) {
    await logApiSearch({
      provider: "travelpayouts",
      searchType: "hotel",
      searchParams: params as Record<string, unknown>,
      resultsCount: 0,
      responseTimeMs: performance.now() - startedAt,
      errorMessage: error instanceof Error ? error.message : "Hotel deeplink failed",
    });
    throw error;
  }
}

// Get a car rental partner deeplink
export async function getCarDeeplink(params: {
  city: string;
  pickup: string;
  dropoff?: string;
}): Promise<string> {
  const startedAt = performance.now();
  try {
    const data = await tpFetch(
      buildUrl("car-deeplink", {
        city: params.city,
        pickup: params.pickup,
        ...(params.dropoff ? { dropoff: params.dropoff } : {}),
      }),
    );
    const link = data.partnerUrl || data.directUrl || "";
    await logApiSearch({
      provider: "travelpayouts",
      searchType: "car",
      searchParams: params as Record<string, unknown>,
      resultsCount: link ? 1 : 0,
      responseTimeMs: performance.now() - startedAt,
    });
    return link;
  } catch (error) {
    await logApiSearch({
      provider: "travelpayouts",
      searchType: "car",
      searchParams: params as Record<string, unknown>,
      resultsCount: 0,
      responseTimeMs: performance.now() - startedAt,
      errorMessage: error instanceof Error ? error.message : "Car deeplink failed",
    });
    throw error;
  }
}

// Get a tour/activities partner deeplink
export async function getTourDeeplink(params: {
  city: string;
  date?: string;
}): Promise<string> {
  const startedAt = performance.now();
  try {
    const data = await tpFetch(
      buildUrl("tour-deeplink", {
        city: params.city,
        ...(params.date ? { date: params.date } : {}),
      }),
    );
    const link = data.partnerUrl || data.directUrl || "";
    await logApiSearch({
      provider: "travelpayouts",
      searchType: "tour",
      searchParams: params as Record<string, unknown>,
      resultsCount: link ? 1 : 0,
      responseTimeMs: performance.now() - startedAt,
    });
    return link;
  } catch (error) {
    await logApiSearch({
      provider: "travelpayouts",
      searchType: "tour",
      searchParams: params as Record<string, unknown>,
      resultsCount: 0,
      responseTimeMs: performance.now() - startedAt,
      errorMessage: error instanceof Error ? error.message : "Tour deeplink failed",
    });
    throw error;
  }
}
