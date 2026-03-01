/**
 * 5ATTH | خته – Hotels Search Engine 🏨
 * محرك بحث الفنادق
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { searchHotels } from 'backend/searchService.web';

function el(id) { try { return $w(id); } catch (e) { return null; } }
function setText(id, txt) { try { var e = el(id); if (e) e.text = txt; } catch (e) {} }
function setLabel(id, txt) { try { var e = el(id); if (e) e.label = txt; } catch (e) {} }
function show(id) { try { var e = el(id); if (e) e.expand(); } catch (e) {} }
function hide(id) { try { var e = el(id); if (e) e.collapse(); } catch (e) {} }
function btn(id, fn) { try { var e = el(id); if (e) e.onClick(fn); } catch (e) {} }

var TENANT = 'default';
var currentOffers = [];

$w.onReady(async function () {
  wixSeo.title = 'حجز فنادق | 5ATTH خته';
  wixSeo.description = 'ابحث واحجز أفضل الفنادق بأسعار تنافسية في جميع أنحاء العالم';

  setText('#pageTitle', '🏨 حجز الفنادق');
  setText('#pageSubtitle', 'ابحث وقارن بين آلاف الفنادق حول العالم بأفضل الأسعار');
  setText('#cityLabel', 'المدينة');
  setText('#checkInLabel', 'تاريخ الوصول');
  setText('#checkOutLabel', 'تاريخ المغادرة');
  setText('#guestsLabel', 'عدد الضيوف');
  setLabel('#searchHotelsBtn', '🔍 بحث عن فنادق');

  var currency = wixWindow.storage.local.getItem('selectedCurrency') || 'SAR';

  /* ——— Pre-fill ——————————————————— */
  var stored = wixWindow.storage.local.getItem('searchParams');
  if (stored) {
    try {
      var p = JSON.parse(stored);
      try { el('#hotelCity').value = p.cityCode || ''; } catch (e) {}
      try { el('#hotelCheckIn').value = p.checkInDate || ''; } catch (e) {}
      try { el('#hotelCheckOut').value = p.checkOutDate || ''; } catch (e) {}
      try { el('#hotelGuests').value = String(p.adults || 2); } catch (e) {}
      wixWindow.storage.local.removeItem('searchParams');
      await doSearch(p);
    } catch (e) {}
  }

  /* ——— Search Button ——————————————————— */
  btn('#searchHotelsBtn', async function () {
    var p = {
      cityCode: (el('#hotelCity') || {}).value || '',
      checkInDate: (el('#hotelCheckIn') || {}).value || '',
      checkOutDate: (el('#hotelCheckOut') || {}).value || '',
      adults: parseInt((el('#hotelGuests') || {}).value) || 2,
      currency: currency,
    };
    if (!p.cityCode || !p.checkInDate) {
      setText('#searchError', 'يرجى تعبئة المدينة وتاريخ الوصول');
      return;
    }
    await doSearch(p);
  });

  /* ——— Sort ——————————————————— */
  try {
    var sort = el('#hotelSort');
    if (sort) {
      sort.options = [
        { label: 'الأقل سعراً', value: 'price_asc' },
        { label: 'الأعلى سعراً', value: 'price_desc' },
        { label: 'الأعلى تقييماً', value: 'rating' },
      ];
      sort.onChange(function (e) { sortHotels(e.target.value); });
    }
  } catch (e) {}

  /* ——— Popular Cities ——————————————————— */
  var cities = [
    { _id: 'c1', name: '🇦🇪 دبي', code: 'DXB', price: 'من ٤٩٩ ر.س/ليلة' },
    { _id: 'c2', name: '🇸🇦 مكة المكرمة', code: 'MKX', price: 'من ٣٩٩ ر.س/ليلة' },
    { _id: 'c3', name: '🇸🇦 المدينة المنورة', code: 'MED', price: 'من ٢٩٩ ر.س/ليلة' },
    { _id: 'c4', name: '🇹🇷 إسطنبول', code: 'IST', price: 'من ١٩٩ ر.س/ليلة' },
    { _id: 'c5', name: '🇪🇬 القاهرة', code: 'CAI', price: 'من ١٤٩ ر.س/ليلة' },
    { _id: 'c6', name: '🇬🇧 لندن', code: 'LON', price: 'من ٨٩٩ ر.س/ليلة' },
  ];
  try {
    var rep = el('#popularCitiesRepeater');
    if (rep) {
      rep.data = cities;
      rep.onItemReady(function ($i, d) {
        try { $i('#cityName').text = d.name; } catch (e) {}
        try { $i('#cityPrice').text = d.price; } catch (e) {}
        try { $i('#cityPrice').style.color = '#C9A227'; } catch (e) {}
        try {
          $i('#cityCard').onClick(function () {
            try { el('#hotelCity').value = d.code; } catch (e) {}
          });
        } catch (e) {}
      });
    }
  } catch (e) {}
});

async function doSearch(params) {
  show('#loadingSection');
  hide('#resultsSection');
  setText('#searchError', '');

  try {
    var result = await searchHotels(TENANT, params);
    currentOffers = result.offers || [];
    setText('#resultsCount', currentOffers.length + ' فندق متاح');
    renderHotels(currentOffers);
  } catch (e) {
    setText('#searchError', 'حدث خطأ في البحث');
  }

  hide('#loadingSection');
  show('#resultsSection');
}

function renderHotels(offers) {
  try {
    var rep = el('#hotelsRepeater');
    if (!rep) return;

    rep.data = offers.map(function (o) {
      var hotel = o.hotelData || {};
      var room = {};
      try { room = JSON.parse(hotel.roomJson || '{}'); } catch (e) {}
      return {
        _id: o.providerOfferId || String(Math.random()),
        name: room.description || 'فندق',
        boardType: hotel.boardType || '',
        stars: '⭐'.repeat(Math.min(parseInt(hotel.stars) || 3, 5)),
        price: o.totalAmount + ' ' + o.currency,
        priceNote: '/ليلة',
        refundable: o.refundable ? '✅ إلغاء مجاني' : '❌ غير قابل للإلغاء',
        totalAmount: o.totalAmount,
      };
    });

    rep.onItemReady(function ($i, d) {
      try { $i('#hotelName').text = d.name; } catch (e) {}
      try { $i('#hotelStars').text = d.stars; } catch (e) {}
      try { $i('#hotelBoard').text = d.boardType; } catch (e) {}
      try { $i('#hotelPrice').text = d.price; } catch (e) {}
      try { $i('#hotelPriceNote').text = d.priceNote; } catch (e) {}
      try { $i('#hotelRefund').text = d.refundable; } catch (e) {}
      try { $i('#hotelPrice').style.color = '#C9A227'; } catch (e) {}
      try {
        $i('#hotelBookBtn').onClick(function () {
          var offer = currentOffers.find(function (x) { return x.providerOfferId === d._id; });
          wixWindow.storage.local.setItem('selectedOffer', JSON.stringify(offer));
          wixLocation.to('/checkout');
        });
      } catch (e) {}
    });
  } catch (e) {}
}

function sortHotels(type) {
  var sorted = currentOffers.slice();
  if (type === 'price_asc') sorted.sort(function (a, b) { return a.totalAmount - b.totalAmount; });
  else if (type === 'price_desc') sorted.sort(function (a, b) { return b.totalAmount - a.totalAmount; });
  else if (type === 'rating') sorted.sort(function (a, b) {
    var rA = 0, rB = 0;
    try { rA = JSON.parse(a.scoreJson || '{}').rating || 0; } catch (e) {}
    try { rB = JSON.parse(b.scoreJson || '{}').rating || 0; } catch (e) {}
    return rB - rA;
  });
  renderHotels(sorted);
}
