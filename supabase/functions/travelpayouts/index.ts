// Travelpayouts Partner Links Edge Function
// Creates affiliate partner links from direct travel brand URLs

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TP_API = "https://api.travelpayouts.com/links/v1/create";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("TRAVELPAYOUTS_API_TOKEN");
    const marker = Deno.env.get("TRAVELPAYOUTS_MARKER");
    const trs = Deno.env.get("TRAVELPAYOUTS_TRS");

    if (!token || !marker || !trs) {
      return new Response(
        JSON.stringify({ error: "Travelpayouts credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "partner-link") {
      // Convert URLs to partner links
      const body = await req.json();
      const urls: string[] = body.urls || [];

      if (!urls.length || urls.length > 10) {
        return new Response(
          JSON.stringify({ error: "Provide 1-10 URLs" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const links = urls.map((u: string, i: number) => ({
        url: u,
        sub_id: body.sub_id || `5taah_${i}`,
      }));

      const res = await fetch(TP_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trs: Number(trs),
          marker: Number(marker),
          shorten: true,
          links,
        }),
      });

      const data = await res.json();

      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "flight-deeplink") {
      // Build a Aviasales/WayAway deeplink for flight search
      const origin = url.searchParams.get("origin") || "";
      const destination = url.searchParams.get("destination") || "";
      const departDate = url.searchParams.get("departDate") || "";
      const returnDate = url.searchParams.get("returnDate") || "";
      const adults = url.searchParams.get("adults") || "1";

      // Aviasales search URL format
      const depart = departDate.replace(/-/g, "");
      const ret = returnDate ? returnDate.replace(/-/g, "") : "";
      const route = ret
        ? `${origin}${depart}${destination}${ret}`
        : `${origin}${depart}${destination}`;
      const directUrl = `https://www.aviasales.com/search/${route}${adults}`;

      const res = await fetch(TP_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trs: Number(trs),
          marker: Number(marker),
          shorten: true,
          links: [{ url: directUrl, sub_id: "flight_search" }],
        }),
      });

      const data = await res.json();
      const partnerUrl = data?.result?.links?.[0]?.partner_url || directUrl;

      return new Response(
        JSON.stringify({ partnerUrl, directUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "hotel-deeplink") {
      // Build a Hotellook deeplink for hotel search
      const city = url.searchParams.get("city") || "";
      const checkIn = url.searchParams.get("checkIn") || "";
      const checkOut = url.searchParams.get("checkOut") || "";
      const adults = url.searchParams.get("adults") || "2";

      const directUrl = `https://search.hotellook.com/hotels?destination=${encodeURIComponent(city)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`;

      const res = await fetch(TP_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trs: Number(trs),
          marker: Number(marker),
          shorten: true,
          links: [{ url: directUrl, sub_id: "hotel_search" }],
        }),
      });

      const data = await res.json();
      const partnerUrl = data?.result?.links?.[0]?.partner_url || directUrl;

      return new Response(
        JSON.stringify({ partnerUrl, directUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "car-deeplink") {
      // Build a car rental deeplink (e.g., Economybookings / Rentalcars)
      const city = url.searchParams.get("city") || "";
      const pickup = url.searchParams.get("pickup") || "";
      const dropoff = url.searchParams.get("dropoff") || "";

      const directUrl = `https://www.economybookings.com/en/search?place=${encodeURIComponent(city)}&pick=${pickup}&drop=${dropoff}`;

      const res = await fetch(TP_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trs: Number(trs),
          marker: Number(marker),
          shorten: true,
          links: [{ url: directUrl, sub_id: "car_search" }],
        }),
      });

      const data = await res.json();
      const partnerUrl = data?.result?.links?.[0]?.partner_url || directUrl;

      return new Response(
        JSON.stringify({ partnerUrl, directUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "tour-deeplink") {
      // Build a tours deeplink (e.g., GetYourGuide / Viator)
      const city = url.searchParams.get("city") || "";
      const date = url.searchParams.get("date") || "";

      const directUrl = `https://www.getyourguide.com/s/?q=${encodeURIComponent(city)}&date_from=${date}`;

      const res = await fetch(TP_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trs: Number(trs),
          marker: Number(marker),
          shorten: true,
          links: [{ url: directUrl, sub_id: "tour_search" }],
        }),
      });

      const data = await res.json();
      const partnerUrl = data?.result?.links?.[0]?.partner_url || directUrl;

      return new Response(
        JSON.stringify({ partnerUrl, directUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use: partner-link, flight-deeplink, hotel-deeplink, car-deeplink, tour-deeplink" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[Travelpayouts] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
