/**
 * 5ATTH | خته — Flights Search & Results Page
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { searchFlights, getOfferDetails } from 'backend/searchService.web';

const TENANT_ID = 'default';
let currentOffers = [];

$w.onReady(async function () {
  wixSeo.title = 'حجز طيران | 5ATTH خته';
  wixSeo.description = 'ابحث واحجز أفضل رحلات الطيران بأسعار تنافسية - مقارنة بين عدة مزودين';

  const currency = wixWindow.storage.local.getItem('selectedCurrency') || 'SAR';

  // ─── Pre-fill from stored params ───────────────────────
  const storedParams = wixWindow.storage.local.getItem('searchParams');
  if (storedParams) {
    try {
      const params = JSON.parse(storedParams);
      if ($w('#flightFrom')) $w('#flightFrom').value = params.origin || '';
      if ($w('#flightTo')) $w('#flightTo').value = params.destination || '';
      if ($w('#flightDepart')) $w('#flightDepart').value = params.departDate || '';
      if ($w('#flightReturn')) $w('#flightReturn').value = params.returnDate || '';
      if ($w('#flightAdults')) $w('#flightAdults').value = String(params.adults || 1);
      if ($w('#flightCabin')) $w('#flightCabin').value = params.cabin || 'ECONOMY';

      // Auto-search
      await handleFlightSearch(params);
    } catch (e) {}
    wixWindow.storage.local.removeItem('searchParams');
  }

  // ─── City Autocomplete (Debounced) ─────────────────────
  ['#flightFrom', '#flightTo'].forEach(selector => {
    if ($w(selector)) {
      let debounceTimer;
      $w(selector).onInput((e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          // IATA autocomplete would be fetched from backend
          // For now, basic input
        }, 300);
      });
    }
  });

  // ─── Search Button ────────────────────────────────────
  if ($w('#searchFlightsBtn')) {
    $w('#searchFlightsBtn').onClick(async () => {
      const params = {
        origin: $w('#flightFrom')?.value || '',
        destination: $w('#flightTo')?.value || '',
        departDate: $w('#flightDepart')?.value || '',
        returnDate: $w('#flightReturn')?.value || '',
        adults: parseInt($w('#flightAdults')?.value) || 1,
        cabin: $w('#flightCabin')?.value || 'ECONOMY',
        currency,
      };

      if (!params.origin || !params.destination || !params.departDate) {
        if ($w('#searchError')) $w('#searchError').text = 'يرجى تعبئة جميع الحقول المطلوبة';
        return;
      }

      await handleFlightSearch(params);
    });
  }

  // ─── Sort ──────────────────────────────────────────────
  if ($w('#sortOptions')) {
    $w('#sortOptions').options = [
      { label: 'الأقل سعراً', value: 'price_asc' },
      { label: 'الأعلى سعراً', value: 'price_desc' },
      { label: 'أقصر مدة', value: 'duration' },
      { label: 'الأفضل قيمة', value: 'best_value' },
    ];

    $w('#sortOptions').onChange((e) => {
      sortOffers(e.target.value);
    });
  }

  // ─── Filters ──────────────────────────────────────────
  if ($w('#stopsFilter')) {
    $w('#stopsFilter').onChange((e) => {
      filterOffers();
    });
  }
});

async function handleFlightSearch(params) {
  // Show skeleton loading
  if ($w('#loadingSection')) $w('#loadingSection').expand();
  if ($w('#resultsSection')) $w('#resultsSection').collapse();
  if ($w('#searchError')) $w('#searchError').text = '';

  try {
    const result = await searchFlights(TENANT_ID, params);
    currentOffers = result.offers;

    if ($w('#resultsCount')) {
      $w('#resultsCount').text = `${result.count} رحلة متاحة`;
    }
    if ($w('#providerBadge') && result.provider) {
      $w('#providerBadge').text = result.provider;
    }

    renderOffers(currentOffers);
  } catch (e) {
    if ($w('#searchError')) $w('#searchError').text = 'حدث خطأ في البحث، يرجى المحاولة مرة أخرى';
    console.log('Flight search error:', e);
  }

  if ($w('#loadingSection')) $w('#loadingSection').collapse();
  if ($w('#resultsSection')) $w('#resultsSection').expand();
}

function renderOffers(offers) {
  if (!$w('#flightsRepeater')) return;

  $w('#flightsRepeater').data = offers.slice(0, 50).map(o => ({
    _id: o.providerOfferId || String(Math.random()),
    airline: o.itineraries?.[0]?.segments?.[0]?.marketingCarrier || '✈️',
    route: `${o.itineraries?.[0]?.segments?.[0]?.fromIata || ''} → ${o.itineraries?.[0]?.segments?.[o.itineraries[0].segments.length - 1]?.toIata || ''}`,
    departTime: formatTime(o.itineraries?.[0]?.segments?.[0]?.departAt),
    arriveTime: formatTime(o.itineraries?.[0]?.segments?.[o.itineraries[0].segments.length - 1]?.arriveAt),
    duration: `${Math.floor((o.itineraries?.[0]?.durationMinutes || 0) / 60)}س ${(o.itineraries?.[0]?.durationMinutes || 0) % 60}د`,
    stops: o.itineraries?.[0]?.stopsCount === 0 ? 'مباشر' : `${o.itineraries[0].stopsCount} توقف`,
    price: `${o.totalAmount} ${o.currency}`,
    refundable: o.refundable ? 'قابل للاسترداد' : 'غير قابل للاسترداد',
    totalAmount: o.totalAmount,
  }));

  $w('#flightsRepeater').onItemReady(($item, itemData) => {
    $item('#flightAirline').text = itemData.airline;
    $item('#flightRoute').text = itemData.route;
    $item('#flightDepart').text = itemData.departTime;
    $item('#flightArrive').text = itemData.arriveTime;
    $item('#flightDuration').text = itemData.duration;
    $item('#flightStops').text = itemData.stops;
    $item('#flightPrice').text = itemData.price;
    $item('#flightRefund').text = itemData.refundable;

    // Gold accent
    try { $item('#flightPrice').style.color = '#C9A227'; } catch (e) {}

    // Card hover
    $item('#flightCard').onMouseIn(() => {
      try { $item('#flightCard').style.borderColor = '#C9A227'; } catch (e) {}
    });
    $item('#flightCard').onMouseOut(() => {
      try { $item('#flightCard').style.borderColor = '#2A2A35'; } catch (e) {}
    });

    // Book button
    $item('#flightBookBtn').onClick(() => {
      const offer = currentOffers.find(o => o.providerOfferId === itemData._id);
      wixWindow.storage.local.setItem('selectedOffer', JSON.stringify(offer));
      wixLocation.to('/checkout');
    });
  });
}

function sortOffers(sortType) {
  let sorted = [...currentOffers];
  switch (sortType) {
    case 'price_asc':
      sorted.sort((a, b) => a.totalAmount - b.totalAmount);
      break;
    case 'price_desc':
      sorted.sort((a, b) => b.totalAmount - a.totalAmount);
      break;
    case 'duration':
      sorted.sort((a, b) => (a.itineraries?.[0]?.durationMinutes || 999) - (b.itineraries?.[0]?.durationMinutes || 999));
      break;
    case 'best_value':
      sorted.sort((a, b) => {
        const scoreA = a.totalAmount / Math.max(1, a.itineraries?.[0]?.durationMinutes || 1);
        const scoreB = b.totalAmount / Math.max(1, b.itineraries?.[0]?.durationMinutes || 1);
        return scoreA - scoreB;
      });
      break;
  }
  renderOffers(sorted);
}

function filterOffers() {
  let filtered = [...currentOffers];
  const stops = $w('#stopsFilter')?.value;
  if (stops === 'direct') {
    filtered = filtered.filter(o => o.itineraries?.[0]?.stopsCount === 0);
  } else if (stops === '1') {
    filtered = filtered.filter(o => o.itineraries?.[0]?.stopsCount <= 1);
  }
  renderOffers(filtered);
}

function formatTime(isoString) {
  if (!isoString) return '--:--';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '--:--';
  }
}
