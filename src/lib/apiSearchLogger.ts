import { supabase } from "@/integrations/supabase/client";

export type ApiSearchProvider = "amadeus" | "travelpayouts";
export type ApiSearchType = "flight" | "hotel" | "car" | "tour" | "transfer" | "partner";

interface ApiSearchLogInput {
  provider: ApiSearchProvider;
  searchType: ApiSearchType;
  searchParams: Record<string, unknown>;
  resultsCount: number;
  responseTimeMs: number;
  errorMessage?: string;
}

export async function logApiSearch({
  provider,
  searchType,
  searchParams,
  resultsCount,
  responseTimeMs,
  errorMessage,
}: ApiSearchLogInput): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from("api_search_logs").insert({
      provider,
      search_type: searchType,
      search_params: {
        ...searchParams,
        status: errorMessage ? "error" : "success",
        ...(errorMessage ? { error: errorMessage } : {}),
      },
      results_count: Math.max(0, Number.isFinite(resultsCount) ? resultsCount : 0),
      response_time_ms: Math.max(0, Math.round(responseTimeMs)),
      user_id: session?.user?.id || null,
    });
  } catch {
    // Do not break booking/search flow if analytics logging fails.
  }
}
