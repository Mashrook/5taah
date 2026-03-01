/**
 * 5ATTH | خته — Unified Search Results Page (/search)
 * Handles: flights, hotels, cars, tours
 * Query params: ?type=flights&from=RUH&to=DXB&date=2026-04-01&passengers=1&currency=SAR
 */
import wixSeo from 'wix-seo';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { fetch } from 'wix-fetch';

$w.onReady(async function () {
  wixSeo.title = 'نتائج البحث | 5ATTH خته';

  const query = wixLocation.query;
  const productType = query.type || 'flights';
  const currency = query.currency || 'SAR';

  // ─── Tab Highlight ─────────────────────────────────────
  const typeLabels = {
    flights: 'رحلات جوية',
    hotels: 'فنادق',
    cars: 'سيارات',
    tours: 'جولات',
  };

  ['flights', 'hotels', 'cars', 'tours'].forEach(t => {
    const sel = `#tab_${t}`;
    if ($w(sel)) {
      try {
        $w(sel).label = typeLabels[t];
        $w(sel).style.backgroundColor = t === productType ? '#C9A227' : '#1E1E27';
        $w(sel).style.color = t === productType ? '#0E0E12' : '#9AA0A6';
      } catch (e) {}

      $w(sel).onClick(() => {
        const newQuery = { ...query, type: t };
        const qs = Object.entries(newQuery).map(([k, v]) => `${k}=${v}`).join('&');
        wixLocation.to(`/search?${qs}`);
      });
    }
  });

  // ─── Show search summary ───────────────────────────────
  if ($w('#searchSummary')) {
    const parts = [];
    if (query.from) parts.push(query.from);
    if (query.to) parts.push(`→ ${query.to}`);
    if (query.date) parts.push(query.date);
    if (query.passengers) parts.push(`${query.passengers} مسافر`);
    $w('#searchSummary').text = parts.join(' | ') || 'بحث';
  }

  // ─── Sort & Filter State ───────────────────────────────
  let sortBy = 'price_asc';
  let filters = { maxPrice: null, stopsFilter: null, refundableOnly: false };

  if ($w('#sortDropdown')) {
    $w('#sortDropdown').onChange(() => {
      sortBy = $w('#sortDropdown').value;
      applyFiltersAndSort();
    });
  }

  if ($w('#filterRefundable')) {
    $w('#filterRefundable').onChange(() => {
      filters.refundableOnly = $w('#filterRefundable').checked;
      applyFiltersAndSort();
    });
  }

  if ($w('#filterMaxPrice')) {
    $w('#filterMaxPrice').onKeyPress((e) => {
      if (e.key === 'Enter') {
        filters.maxPrice = Number($w('#filterMaxPrice').value) || null;
        applyFiltersAndSort();
      }
    });
  }

  // ─── Perform Search ────────────────────────────────────
  let allOffers = [];

  if ($w('#searchLoading')) $w('#searchLoading').expand();
  if ($w('#searchError')) $w('#searchError').collapse();

  try {
    const params = {};
    if (productType === 'flights') {
      params.originLocationCode = query.from || '';
      params.destinationLocationCode = query.to || '';
      params.departureDate = query.date || '';
      params.returnDate = query.returnDate || '';
      params.adults = Number(query.passengers) || 1;
      params.cabinClass = query.cabin || 'ECONOMY';
    } else if (productType === 'hotels') {
      params.cityCode = query.city || query.to || '';
      params.checkInDate = query.date || '';
      params.checkOutDate = query.returnDate || '';
      params.guests = Number(query.passengers) || 1;
    } else if (productType === 'cars') {
      params.pickupCity = query.city || query.from || '';
      params.pickupDate = query.date || '';
      params.returnDate = query.returnDate || '';
    } else if (productType === 'tours') {
      params.city = query.city || query.to || '';
      params.date = query.date || '';
      params.travelers = Number(query.passengers) || 1;
    }

    const baseUrl = wixLocation.baseUrl;
    const response = await fetch(`${baseUrl}/_functions/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: 'default',
        productType,
        params,
        currency,
      }),
    });

    const data = await response.json();

    if (data.error) {
      if ($w('#searchError')) {
        $w('#searchError').text = data.error;
        $w('#searchError').expand();
      }
    } else {
      allOffers = data.offers || [];
      if ($w('#resultsCount')) $w('#resultsCount').text = `${allOffers.length} نتيجة`;
      applyFiltersAndSort();
    }
  } catch (e) {
    if ($w('#searchError')) {
      $w('#searchError').text = `خطأ في البحث: ${e.message}`;
      $w('#searchError').expand();
    }
  }

  if ($w('#searchLoading')) $w('#searchLoading').collapse();

  // ─── Filter & Sort Logic ───────────────────────────────
  function applyFiltersAndSort() {
    let filtered = [...allOffers];

    // Apply filters
    if (filters.refundableOnly) {
      filtered = filtered.filter(o => o.refundable);
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(o => o.totalAmount <= filters.maxPrice);
    }

    // Sort
    if (sortBy === 'price_asc') {
      filtered.sort((a, b) => a.totalAmount - b.totalAmount);
    } else if (sortBy === 'price_desc') {
      filtered.sort((a, b) => b.totalAmount - a.totalAmount);
    } else if (sortBy === 'duration') {
      filtered.sort((a, b) => (a.durationMinutes || 0) - (b.durationMinutes || 0));
    }

    renderResults(filtered);
  }

  // ─── Render Results ────────────────────────────────────
  function renderResults(offers) {
    if (!$w('#resultsRepeater')) return;

    if (offers.length === 0) {
      if ($w('#noResults')) $w('#noResults').expand();
      $w('#resultsRepeater').data = [];
      return;
    }
    if ($w('#noResults')) $w('#noResults').collapse();

    $w('#resultsRepeater').data = offers.map((o, i) => ({ _id: String(i), ...o }));

    $w('#resultsRepeater').onItemReady(($item, data) => {
      // Provider badge
      if ($item('#offerProvider')) $item('#offerProvider').text = data.providerName || '';

      // Route / Title
      if ($item('#offerTitle')) {
        if (productType === 'flights') {
          $item('#offerTitle').text = `${data.originIata || query.from} → ${data.destinationIata || query.to}`;
        } else if (productType === 'hotels') {
          $item('#offerTitle').text = data.hotelName || data.providerOfferId || 'فندق';
        } else {
          $item('#offerTitle').text = data.title || data.providerOfferId || 'عرض';
        }
      }

      // Price
      if ($item('#offerPrice')) {
        $item('#offerPrice').text = `${data.totalAmount} ${data.currency || currency}`;
        try { $item('#offerPrice').style.color = '#C9A227'; } catch (e) {}
      }

      // Details
      if ($item('#offerDetails')) {
        const details = [];
        if (data.durationMinutes) details.push(`${Math.floor(data.durationMinutes / 60)}س ${data.durationMinutes % 60}د`);
        if (data.stopsCount !== undefined) details.push(data.stopsCount === 0 ? 'مباشر' : `${data.stopsCount} توقف`);
        if (data.refundable) details.push('قابل للاسترداد');
        $item('#offerDetails').text = details.join(' • ');
      }

      // Deep link or booking
      if ($item('#offerActionBtn')) {
        $item('#offerActionBtn').onClick(() => {
          if (data.deepLinkUrl) {
            wixWindow.openUrl(data.deepLinkUrl, '_blank');
          } else {
            wixWindow.storage.local.setItem('selectedOffer', JSON.stringify(data));
            wixLocation.to('/checkout');
          }
        });
      }

      // View details
      if ($item('#offerDetailsBtn')) {
        $item('#offerDetailsBtn').onClick(() => {
          if (data._id) {
            wixLocation.to(`/offer/${data._id}`);
          }
        });
      }
    });
  }
});
