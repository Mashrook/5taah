/**
 * 5ATTH | خته — Hotels Search & Results Page
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { searchHotels } from 'backend/searchService.web';

const TENANT_ID = 'default';
let currentOffers = [];

$w.onReady(async function () {
  wixSeo.title = 'حجز فنادق | 5ATTH خته';
  wixSeo.description = 'ابحث واحجز أفضل الفنادق بأسعار تنافسية في جميع أنحاء العالم';

  const currency = wixWindow.storage.local.getItem('selectedCurrency') || 'SAR';

  // Pre-fill from stored params
  const storedParams = wixWindow.storage.local.getItem('searchParams');
  if (storedParams) {
    try {
      const params = JSON.parse(storedParams);
      if ($w('#hotelCity')) $w('#hotelCity').value = params.cityCode || '';
      if ($w('#hotelCheckIn')) $w('#hotelCheckIn').value = params.checkInDate || '';
      if ($w('#hotelCheckOut')) $w('#hotelCheckOut').value = params.checkOutDate || '';
      if ($w('#hotelGuests')) $w('#hotelGuests').value = String(params.adults || 2);
      await handleHotelSearch(params);
    } catch (e) {}
    wixWindow.storage.local.removeItem('searchParams');
  }

  // Search
  if ($w('#searchHotelsBtn')) {
    $w('#searchHotelsBtn').onClick(async () => {
      const params = {
        cityCode: $w('#hotelCity')?.value || '',
        checkInDate: $w('#hotelCheckIn')?.value || '',
        checkOutDate: $w('#hotelCheckOut')?.value || '',
        adults: parseInt($w('#hotelGuests')?.value) || 2,
        currency,
      };
      await handleHotelSearch(params);
    });
  }

  // Sort
  if ($w('#hotelSort')) {
    $w('#hotelSort').options = [
      { label: 'الأقل سعراً', value: 'price_asc' },
      { label: 'الأعلى سعراً', value: 'price_desc' },
      { label: 'الأعلى تقييماً', value: 'rating' },
    ];
    $w('#hotelSort').onChange((e) => sortHotels(e.target.value));
  }

  // Filters
  if ($w('#starsFilter')) {
    $w('#starsFilter').onChange(() => filterHotels());
  }
  if ($w('#refundFilter')) {
    $w('#refundFilter').onChange(() => filterHotels());
  }
});

async function handleHotelSearch(params) {
  if ($w('#loadingSection')) $w('#loadingSection').expand();
  if ($w('#resultsSection')) $w('#resultsSection').collapse();

  try {
    const result = await searchHotels(TENANT_ID, params);
    currentOffers = result.offers;

    if ($w('#resultsCount')) $w('#resultsCount').text = `${result.count} فندق متاح`;
    renderHotels(currentOffers);
  } catch (e) {
    if ($w('#searchError')) $w('#searchError').text = 'حدث خطأ في البحث';
  }

  if ($w('#loadingSection')) $w('#loadingSection').collapse();
  if ($w('#resultsSection')) $w('#resultsSection').expand();
}

function renderHotels(offers) {
  if (!$w('#hotelsRepeater')) return;

  $w('#hotelsRepeater').data = offers.map(o => {
    const hotelData = o.hotelData || {};
    return {
      _id: o.providerOfferId || String(Math.random()),
      name: JSON.parse(hotelData.roomJson || '{}').description || 'فندق',
      boardType: hotelData.boardType || '',
      price: `${o.totalAmount} ${o.currency}`,
      refundable: o.refundable ? '✅ إلغاء مجاني' : '❌ غير قابل للإلغاء',
      totalAmount: o.totalAmount,
    };
  });

  $w('#hotelsRepeater').onItemReady(($item, itemData) => {
    $item('#hotelName').text = itemData.name;
    $item('#hotelBoard').text = itemData.boardType;
    $item('#hotelPrice').text = itemData.price;
    $item('#hotelRefund').text = itemData.refundable;

    try { $item('#hotelPrice').style.color = '#C9A227'; } catch (e) {}

    $item('#hotelCard').onMouseIn(() => {
      try { $item('#hotelCard').style.borderColor = '#C9A227'; } catch (e) {}
    });
    $item('#hotelCard').onMouseOut(() => {
      try { $item('#hotelCard').style.borderColor = '#2A2A35'; } catch (e) {}
    });

    $item('#hotelBookBtn').onClick(() => {
      const offer = currentOffers.find(o => o.providerOfferId === itemData._id);
      wixWindow.storage.local.setItem('selectedOffer', JSON.stringify(offer));
      wixLocation.to('/checkout');
    });
  });
}

function sortHotels(sortType) {
  let sorted = [...currentOffers];
  if (sortType === 'price_asc') sorted.sort((a, b) => a.totalAmount - b.totalAmount);
  else if (sortType === 'price_desc') sorted.sort((a, b) => b.totalAmount - a.totalAmount);
  else if (sortType === 'rating') sorted.sort((a, b) => {
    const rA = JSON.parse(a.scoreJson || '{}').rating || 0;
    const rB = JSON.parse(b.scoreJson || '{}').rating || 0;
    return rB - rA;
  });
  renderHotels(sorted);
}

function filterHotels() {
  let filtered = [...currentOffers];
  if ($w('#refundFilter')?.value === 'refundable') {
    filtered = filtered.filter(o => o.refundable);
  }
  renderHotels(filtered);
}
