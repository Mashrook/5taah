/**
 * 5ATTH | خته – Flights Search Engine ✈️
 * محرك بحث رحلات الطيران
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { searchFlights } from 'backend/searchService.web';

function el(id) { try { return $w(id); } catch (e) { return null; } }
function setText(id, txt) { try { var e = el(id); if (e) e.text = txt; } catch (e) {} }
function setLabel(id, txt) { try { var e = el(id); if (e) e.label = txt; } catch (e) {} }
function show(id) { try { var e = el(id); if (e) e.expand(); } catch (e) {} }
function hide(id) { try { var e = el(id); if (e) e.collapse(); } catch (e) {} }
function btn(id, fn) { try { var e = el(id); if (e) e.onClick(fn); } catch (e) {} }

var TENANT = 'default';
var currentOffers = [];

$w.onReady(async function () {
  wixSeo.title = 'حجز طيران | 5ATTH خته';
  wixSeo.description = 'ابحث واحجز أفضل رحلات الطيران بأسعار تنافسية - مقارنة بين عدة مزودين';

  /* ——— Page Title ——————————————————— */
  setText('#pageTitle', '✈️ حجز رحلات الطيران');
  setText('#pageSubtitle', 'ابحث وقارن بين مئات الرحلات من أفضل شركات الطيران');

  /* ——— Labels ——————————————————— */
  setText('#fromLabel', 'مدينة المغادرة');
  setText('#toLabel', 'مدينة الوصول');
  setText('#departLabel', 'تاريخ المغادرة');
  setText('#returnLabel', 'تاريخ العودة');
  setText('#adultsLabel', 'عدد المسافرين');
  setText('#cabinLabel', 'درجة السفر');
  setLabel('#searchFlightsBtn', '🔍 بحث عن رحلات');

  var currency = wixWindow.storage.local.getItem('selectedCurrency') || 'SAR';

  /* ——— Pre-fill from stored params ——————————————————— */
  var storedParams = wixWindow.storage.local.getItem('searchParams');
  if (storedParams) {
    try {
      var params = JSON.parse(storedParams);
      try { el('#flightFrom').value = params.origin || ''; } catch (e) {}
      try { el('#flightTo').value = params.destination || ''; } catch (e) {}
      try { el('#flightDepart').value = params.departDate || ''; } catch (e) {}
      try { el('#flightReturn').value = params.returnDate || ''; } catch (e) {}
      try { el('#flightAdults').value = String(params.adults || 1); } catch (e) {}
      try { el('#flightCabin').value = params.cabin || 'ECONOMY'; } catch (e) {}
      wixWindow.storage.local.removeItem('searchParams');
      await doSearch(params);
    } catch (e) {}
  }

  /* ——— Search Button ——————————————————— */
  btn('#searchFlightsBtn', async function () {
    var p = {
      origin: (el('#flightFrom') || {}).value || '',
      destination: (el('#flightTo') || {}).value || '',
      departDate: (el('#flightDepart') || {}).value || '',
      returnDate: (el('#flightReturn') || {}).value || '',
      adults: parseInt((el('#flightAdults') || {}).value) || 1,
      cabin: (el('#flightCabin') || {}).value || 'ECONOMY',
      currency: currency,
    };
    if (!p.origin || !p.destination || !p.departDate) {
      setText('#searchError', 'يرجى تعبئة المدينة وتاريخ المغادرة على الأقل');
      return;
    }
    await doSearch(p);
  });

  /* ——— Sort ——————————————————— */
  try {
    var sort = el('#sortOptions');
    if (sort) {
      sort.options = [
        { label: 'الأقل سعراً', value: 'price_asc' },
        { label: 'الأعلى سعراً', value: 'price_desc' },
        { label: 'أقصر مدة', value: 'duration' },
        { label: 'الأفضل قيمة', value: 'best_value' },
      ];
      sort.onChange(function (e) { sortOffers(e.target.value); });
    }
  } catch (e) {}

  /* ——— Stops Filter ——————————————————— */
  try {
    var sf = el('#stopsFilter');
    if (sf) {
      sf.options = [
        { label: 'الكل', value: 'all' },
        { label: 'مباشر فقط', value: 'direct' },
        { label: 'توقف واحد', value: '1' },
      ];
      sf.onChange(function () { filterOffers(); });
    }
  } catch (e) {}

  /* ——— Popular Routes ——————————————————— */
  var routes = [
    { _id: 'r1', from: 'الرياض', to: 'دبي', price: 'من ٣٩٩ ر.س', code_from: 'RUH', code_to: 'DXB' },
    { _id: 'r2', from: 'جدة', to: 'القاهرة', price: 'من ٥٩٩ ر.س', code_from: 'JED', code_to: 'CAI' },
    { _id: 'r3', from: 'الرياض', to: 'إسطنبول', price: 'من ٩٩٩ ر.س', code_from: 'RUH', code_to: 'IST' },
    { _id: 'r4', from: 'الدمام', to: 'البحرين', price: 'من ٢٩٩ ر.س', code_from: 'DMM', code_to: 'BAH' },
    { _id: 'r5', from: 'جدة', to: 'لندن', price: 'من ٢,٤٩٩ ر.س', code_from: 'JED', code_to: 'LHR' },
    { _id: 'r6', from: 'الرياض', to: 'كوالالمبور', price: 'من ١,٧٩٩ ر.س', code_from: 'RUH', code_to: 'KUL' },
  ];
  try {
    var rep = el('#popularRoutesRepeater');
    if (rep) {
      rep.data = routes;
      rep.onItemReady(function ($i, d) {
        try { $i('#routeFrom').text = d.from; } catch (e) {}
        try { $i('#routeTo').text = d.to; } catch (e) {}
        try { $i('#routePrice').text = d.price; } catch (e) {}
        try { $i('#routePrice').style.color = '#C9A227'; } catch (e) {}
        try {
          $i('#routeCard').onClick(function () {
            try { el('#flightFrom').value = d.code_from; } catch (e) {}
            try { el('#flightTo').value = d.code_to; } catch (e) {}
          });
        } catch (e) {}
      });
    }
  } catch (e) {}
});

/* ===== Search Logic ===== */
async function doSearch(params) {
  show('#loadingSection');
  hide('#resultsSection');
  setText('#searchError', '');

  try {
    var result = await searchFlights(TENANT, params);
    currentOffers = result.offers || [];
    setText('#resultsCount', currentOffers.length + ' رحلة متاحة');
    if (result.provider) setText('#providerBadge', result.provider);
    renderOffers(currentOffers);
  } catch (e) {
    setText('#searchError', 'حدث خطأ في البحث، يرجى المحاولة مرة أخرى');
    console.log('Flight search error:', e);
  }

  hide('#loadingSection');
  show('#resultsSection');
}

function renderOffers(offers) {
  try {
    var rep = el('#flightsRepeater');
    if (!rep) return;

    rep.data = offers.slice(0, 50).map(function (o) {
      var seg0 = (o.itineraries && o.itineraries[0] && o.itineraries[0].segments && o.itineraries[0].segments[0]) || {};
      var lastSeg = (o.itineraries && o.itineraries[0] && o.itineraries[0].segments) ? o.itineraries[0].segments[o.itineraries[0].segments.length - 1] : {};
      var itin = (o.itineraries && o.itineraries[0]) || {};
      var dur = itin.durationMinutes || 0;
      return {
        _id: o.providerOfferId || String(Math.random()),
        airline: seg0.marketingCarrier || '✈️',
        route: (seg0.fromIata || '') + ' → ' + (lastSeg.toIata || ''),
        departTime: fmtTime(seg0.departAt),
        arriveTime: fmtTime(lastSeg.arriveAt),
        duration: Math.floor(dur / 60) + 'س ' + (dur % 60) + 'د',
        stops: itin.stopsCount === 0 ? 'مباشر' : itin.stopsCount + ' توقف',
        price: o.totalAmount + ' ' + o.currency,
        refundable: o.refundable ? 'قابل للاسترداد' : 'غير قابل للاسترداد',
        totalAmount: o.totalAmount,
      };
    });

    rep.onItemReady(function ($i, d) {
      try { $i('#flightAirline').text = d.airline; } catch (e) {}
      try { $i('#flightRoute').text = d.route; } catch (e) {}
      try { $i('#flightDepartTime').text = d.departTime; } catch (e) {}
      try { $i('#flightArriveTime').text = d.arriveTime; } catch (e) {}
      try { $i('#flightDuration').text = d.duration; } catch (e) {}
      try { $i('#flightStops').text = d.stops; } catch (e) {}
      try { $i('#flightPrice').text = d.price; } catch (e) {}
      try { $i('#flightRefund').text = d.refundable; } catch (e) {}
      try { $i('#flightPrice').style.color = '#C9A227'; } catch (e) {}
      try {
        $i('#flightBookBtn').onClick(function () {
          var offer = currentOffers.find(function (x) { return x.providerOfferId === d._id; });
          wixWindow.storage.local.setItem('selectedOffer', JSON.stringify(offer));
          wixLocation.to('/checkout');
        });
      } catch (e) {}
    });
  } catch (e) {}
}

function sortOffers(type) {
  var sorted = currentOffers.slice();
  if (type === 'price_asc') sorted.sort(function (a, b) { return a.totalAmount - b.totalAmount; });
  else if (type === 'price_desc') sorted.sort(function (a, b) { return b.totalAmount - a.totalAmount; });
  else if (type === 'duration') sorted.sort(function (a, b) { return ((a.itineraries && a.itineraries[0] && a.itineraries[0].durationMinutes) || 999) - ((b.itineraries && b.itineraries[0] && b.itineraries[0].durationMinutes) || 999); });
  renderOffers(sorted);
}

function filterOffers() {
  var stops = (el('#stopsFilter') || {}).value;
  var filtered = currentOffers.slice();
  if (stops === 'direct') filtered = filtered.filter(function (o) { return o.itineraries && o.itineraries[0] && o.itineraries[0].stopsCount === 0; });
  else if (stops === '1') filtered = filtered.filter(function (o) { return o.itineraries && o.itineraries[0] && o.itineraries[0].stopsCount <= 1; });
  renderOffers(filtered);
}

function fmtTime(iso) {
  if (!iso) return '--:--';
  try { return new Date(iso).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return '--:--'; }
}
