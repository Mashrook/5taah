/**
 * 5ATTH | خته – Home Page
 * Premium GCC Travel Platform
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

/* ===== Safe element helpers ===== */
function el(id) { try { return $w(id); } catch (e) { return null; } }
function setText(id, txt) { try { var e = el(id); if (e) e.text = txt; } catch (e) {} }
function setLabel(id, txt) { try { var e = el(id); if (e) e.label = txt; } catch (e) {} }
function show(id) { try { var e = el(id); if (e) e.expand(); } catch (e) {} }
function hide(id) { try { var e = el(id); if (e) e.collapse(); } catch (e) {} }
function btn(id, fn) { try { var e = el(id); if (e) e.onClick(fn); } catch (e) {} }
function setText2($i, id, txt) { try { $i(id).text = txt; } catch (e) {} }
function setLabel2($i, id, txt) { try { $i(id).label = txt; } catch (e) {} }

const ACCENT = '#C9A227';
const CARD = '#1E1E27';

$w.onReady(function () {
  /* ——— Hero Section ——————————————————— */
  setText('#heroTitle', 'سافر بأسلوبك مع خته ✈️');
  setText('#heroSubtitle', 'منصتك الذكية لحجز رحلات الطيران والفنادق والسيارات بأفضل الأسعار في الخليج');
  setText('#welcomeTitle', 'سافر بأسلوبك مع خته ✈️');
  setText('#welcomeDesc', 'انضم إلينا في رحلة لاكتشاف أفضل عروض السفر في منطقة الخليج، مصممة خصيصاً لتناسب ذوقك');
  setLabel('#heroBtn', 'ابدأ البحث');
  setLabel('#getStartedBtn', 'ابدأ الآن');
  btn('#heroBtn', function () { wixLocation.to('/flights'); });
  btn('#getStartedBtn', function () { wixLocation.to('/flights'); });

  /* ——— Section Headings ——————————————————— */
  setText('#sectionTitle1', '✈️ خدماتنا');
  setText('#sectionTitle2', '🔥 عروض حصرية');
  setText('#sectionTitle3', '📅 مواسم السفر');
  setText('#sectionTitle4', '🌍 وجهات مختارة');
  setText('#sectionTitle5', '📰 أحدث المقالات');

  /* ——— Services Repeater ——————————————————— */
  var services = [
    { _id: 'svc1', title: '✈️ رحلات الطيران', desc: 'بحث ومقارنة أسعار أكثر من 500 شركة طيران عالمية ومحلية', link: '/flights' },
    { _id: 'svc2', title: '🏨 حجز الفنادق', desc: 'أفضل الفنادق من نجمة واحدة إلى 5 نجوم بأسعار تنافسية', link: '/hotels' },
    { _id: 'svc3', title: '🚗 تأجير سيارات', desc: 'سيارات فاخرة واقتصادية في جميع مدن الخليج والعالم', link: '/cars' },
    { _id: 'svc4', title: '🎯 جولات سياحية', desc: 'تجارب وأنشطة سياحية مميزة مع مرشدين محترفين', link: '/tours' },
  ];
  fillRepeater('#servicesRepeater', services, function ($i, d) {
    setText2($i, '#serviceTitle', d.title);
    setText2($i, '#serviceDesc', d.desc);
    try { $i('#serviceCard').onClick(function () { wixLocation.to(d.link); }); } catch (e) {}
  });

  /* ——— Offers Repeater ——————————————————— */
  var offers = [
    { _id: 'of1', title: '🔥 عرض دبي - رحلة + فندق 5 نجوم', price: '٢,٤٩٩ ر.س', badge: 'الأكثر طلباً' },
    { _id: 'of2', title: '👨‍👩‍👧‍👦 باقة إسطنبول العائلية ٧ ليالي', price: '٣,٨٩٩ ر.س', badge: 'عائلي' },
    { _id: 'of3', title: '💰 رحلات القاهرة ذهاب وعودة', price: '٨٩٩ ر.س', badge: 'أفضل سعر' },
    { _id: 'of4', title: '🕋 فنادق مكة - موسم العمرة', price: '١,٢٩٩ ر.س', badge: 'عمرة' },
  ];
  fillRepeater('#offersRepeater', offers, function ($i, d) {
    setText2($i, '#offerTitle', d.title);
    setText2($i, '#offerPrice', d.price);
    setText2($i, '#offerBadge', d.badge);
    try { $i('#offerPrice').style.color = ACCENT; } catch (e) {}
    try { $i('#offerCard').onClick(function () { wixLocation.to('/offers'); }); } catch (e) {}
  });

  /* ——— Seasons Repeater ——————————————————— */
  var seasons = [
    { _id: 'se1', title: '🌙 رمضان', desc: 'عمرة وإقامة بأسعار مميزة' },
    { _id: 'se2', title: '🕋 الحج والعمرة', desc: 'باقات شاملة من الرياض وجدة' },
    { _id: 'se3', title: '☀️ الصيف', desc: 'وجهات صيفية بأسعار خاصة' },
    { _id: 'se4', title: '❄️ الشتاء', desc: 'رحلات شتوية دافئة ومميزة' },
  ];
  fillRepeater('#seasonsRepeater', seasons, function ($i, d) {
    setText2($i, '#seasonTitle', d.title);
    setText2($i, '#seasonDesc', d.desc);
    try { $i('#seasonCard').onClick(function () { wixLocation.to('/seasons'); }); } catch (e) {}
  });

  /* ——— Destinations Repeater ——————————————————— */
  var destinations = [
    { _id: 'ds1', title: 'دبي 🇦🇪', desc: 'مدينة الأحلام والتسوق' },
    { _id: 'ds2', title: 'إسطنبول 🇹🇷', desc: 'حيث يلتقي الشرق بالغرب' },
    { _id: 'ds3', title: 'القاهرة 🇪🇬', desc: 'أم الدنيا وحضارة الفراعنة' },
    { _id: 'ds4', title: 'لندن 🇬🇧', desc: 'عاصمة الضباب والثقافة' },
    { _id: 'ds5', title: 'كوالالمبور 🇲🇾', desc: 'جنة الطبيعة والتسوق' },
    { _id: 'ds6', title: 'العلا 🇸🇦', desc: 'سحر التاريخ السعودي' },
  ];
  fillRepeater('#destinationsRepeater', destinations, function ($i, d) {
    setText2($i, '#destTitle', d.title);
    setText2($i, '#destDesc', d.desc);
    try { $i('#destCard').onClick(function () { wixLocation.to('/destinations'); }); } catch (e) {}
  });

  /* ——— Articles Repeater ——————————————————— */
  var articles = [
    { _id: 'ar1', title: 'أفضل 10 وجهات سياحية في 2026', date: 'مارس ٢٠٢٦' },
    { _id: 'ar2', title: 'نصائح ذهبية لحجز طيران رخيص', date: 'فبراير ٢٠٢٦' },
    { _id: 'ar3', title: 'دليلك الشامل للسياحة في السعودية', date: 'يناير ٢٠٢٦' },
  ];
  fillRepeater('#articlesRepeater', articles, function ($i, d) {
    setText2($i, '#articleTitle', d.title);
    setText2($i, '#articleDate', d.date);
    try { $i('#articleCard').onClick(function () { wixLocation.to('/articles'); }); } catch (e) {}
  });

  /* ——— Search Tabs ——————————————————— */
  setupSearchTabs();
  btn('#searchBtn', handleSearch);
});

function fillRepeater(id, data, onReady) {
  try { var r = el(id); if (r) { r.data = data; r.onItemReady(onReady); } } catch (e) {}
}

function setupSearchTabs() {
  var tabs = ['#tabFlights', '#tabHotels', '#tabCars', '#tabTours'];
  var panels = ['#panelFlights', '#panelHotels', '#panelCars', '#panelTours'];
  var keys = ['flights', 'hotels', 'cars', 'tours'];
  tabs.forEach(function (tab, i) {
    btn(tab, function () {
      wixWindow.storage.local.setItem('activeSearchTab', keys[i]);
      tabs.forEach(function (t, j) {
        try { el(t).style.backgroundColor = j === i ? ACCENT : CARD; } catch (e) {}
        if (j === i) show(panels[j]); else hide(panels[j]);
      });
    });
  });
}

function handleSearch() {
  var currency = wixWindow.storage.local.getItem('selectedCurrency') || 'SAR';
  var tab = wixWindow.storage.local.getItem('activeSearchTab') || 'flights';
  if (tab === 'flights') {
    wixWindow.storage.local.setItem('searchParams', JSON.stringify({
      origin: (el('#flightFrom') || {}).value || '',
      destination: (el('#flightTo') || {}).value || '',
      departDate: (el('#flightDepart') || {}).value || '',
      returnDate: (el('#flightReturn') || {}).value || '',
      adults: parseInt((el('#flightAdults') || {}).value) || 1,
      cabin: (el('#flightCabin') || {}).value || 'ECONOMY',
      currency: currency,
    }));
    wixLocation.to('/flights');
  } else if (tab === 'hotels') {
    wixWindow.storage.local.setItem('searchParams', JSON.stringify({
      cityCode: (el('#hotelCity') || {}).value || '',
      checkInDate: (el('#hotelCheckIn') || {}).value || '',
      checkOutDate: (el('#hotelCheckOut') || {}).value || '',
      adults: parseInt((el('#hotelGuests') || {}).value) || 2,
      currency: currency,
    }));
    wixLocation.to('/hotels');
  } else if (tab === 'cars') {
    wixLocation.to('/cars');
  } else {
    wixLocation.to('/tours');
  }
}
