/**
 * 5ATTH | خته – Offers & Deals 🏷️
 * العروض والصفقات
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { getCuratedOffers } from 'backend/cmsService.web';

function el(id) { try { return $w(id); } catch (e) { return null; } }
function setText(id, txt) { try { var e = el(id); if (e) e.text = txt; } catch (e) {} }
function show(id) { try { var e = el(id); if (e) e.expand(); } catch (e) {} }
function hide(id) { try { var e = el(id); if (e) e.collapse(); } catch (e) {} }
function btn(id, fn) { try { var e = el(id); if (e) e.onClick(fn); } catch (e) {} }

var TENANT = 'default';

var fallbackOffers = [
  { _id: 'o1', title: '✈️ عرض دبي الشامل', desc: 'طيران + فندق ٤ نجوم + جولة سياحية - ٣ ليالي', price: '٢,٤٩٩ ر.س', oldPrice: '٣,٢٠٠ ر.س', segment: 'luxury', badge: 'خصم ٢٢٪', expires: 'ينتهي خلال ٥ أيام' },
  { _id: 'o2', title: '🏨 فنادق مكة - رمضان', desc: 'فندق ٥ نجوم قريب من الحرم مع إفطار يومي', price: '٣,٩٩٩ ر.س', oldPrice: '٥,٥٠٠ ر.س', segment: 'hajj', badge: 'خصم ٢٧٪', expires: 'عرض محدود' },
  { _id: 'o3', title: '👨‍👩‍👧‍👦 باقة عائلية إسطنبول', desc: 'طيران + فندق عائلي + جولات يومية - ٥ ليالي', price: '٤,٩٩٩ ر.س', oldPrice: '٦,٨٠٠ ر.س', segment: 'family', badge: 'الأكثر حجزاً', expires: 'حتى نهاية الشهر' },
  { _id: 'o4', title: '🏔️ مغامرة جورجيا', desc: 'طيران + فندق + رحلات جبلية وتجارب محلية - ٤ ليالي', price: '٣,٢٩٩ ر.س', oldPrice: '٤,٢٠٠ ر.س', segment: 'adventure', badge: 'جديد', expires: 'متوفر حتى الصيف' },
  { _id: 'o5', title: '🏖️ منتجع المالديف', desc: 'إقامة فاخرة في فيلا مائية مع جميع الوجبات - ٤ ليالي', price: '٨,٩٩٩ ر.س', oldPrice: '١٢,٠٠٠ ر.س', segment: 'luxury', badge: 'خصم ٢٥٪', expires: 'الأماكن محدودة' },
  { _id: 'o6', title: '📚 عمرة + سياحة المدينة', desc: 'عمرة كاملة مع زيارة المعالم التاريخية في المدينة', price: '٢,٧٩٩ ر.س', oldPrice: '٣,٥٠٠ ر.س', segment: 'hajj', badge: 'مميز', expires: 'متاح طوال العام' },
  { _id: 'o7', title: '🚗 جولة الساحل الغربي', desc: 'سيارة + فنادق على طول ساحل البحر الأحمر - ٧ أيام', price: '٥,٤٩٩ ر.س', oldPrice: '٧,٠٠٠ ر.س', segment: 'adventure', badge: 'حصري', expires: 'عرض صيفي' },
  { _id: 'o8', title: '👨‍👩‍👧 عرض كوالالمبور العائلي', desc: 'طيران + فندق + مدن ترفيهية + تسوق - ٦ ليالي', price: '٣,٧٩٩ ر.س', oldPrice: '٤,٩٠٠ ر.س', segment: 'family', badge: 'خصم ٢٣٪', expires: 'للعطلة المدرسية' },
];

var activeFilter = 'all';

$w.onReady(async function () {
  wixSeo.title = 'عروض السفر | 5ATTH خته';
  wixSeo.description = 'أفضل عروض وصفقات السفر من السعودية - طيران وفنادق وباقات سياحية بأسعار حصرية';

  setText('#pageTitle', '🏷️ عروض السفر');
  setText('#pageSubtitle', 'اكتشف أفضل العروض والصفقات الحصرية من خته');

  /* ——— Segment Filter ——————————————————— */
  try {
    var filterDrop = el('#segmentFilter');
    if (filterDrop) {
      filterDrop.options = [
        { label: 'جميع العروض', value: 'all' },
        { label: '💎 فخامة', value: 'luxury' },
        { label: '👨‍👩‍👧‍👦 عائلي', value: 'family' },
        { label: '🏔️ مغامرات', value: 'adventure' },
        { label: '🕌 حج وعمرة', value: 'hajj' },
      ];
      filterDrop.onChange(function (e) {
        activeFilter = e.target.value;
        renderOffers(getFiltered());
      });
    }
  } catch (e) {}

  /* ——— Load from CMS or fallback ——————————————————— */
  var offers = fallbackOffers;
  try {
    var result = await getCuratedOffers(TENANT);
    if (result && result.length > 0) {
      offers = result.map(function (o) {
        return {
          _id: o._id,
          title: o.title || '',
          desc: o.description || o.subtitle || '',
          price: o.price || '',
          oldPrice: o.originalPrice || '',
          segment: o.segmentKey || 'all',
          badge: o.badge || '',
          expires: o.expiresText || '',
        };
      });
    }
  } catch (e) {}

  fallbackOffers = offers;
  renderOffers(getFiltered());
});

function getFiltered() {
  if (activeFilter === 'all') return fallbackOffers;
  return fallbackOffers.filter(function (o) { return o.segment === activeFilter; });
}

function renderOffers(offers) {
  setText('#offersCount', offers.length + ' عرض متاح');
  try {
    var rep = el('#offersRepeater');
    if (!rep) return;

    rep.data = offers;
    rep.onItemReady(function ($i, d) {
      try { $i('#offerTitle').text = d.title; } catch (e) {}
      try { $i('#offerDesc').text = d.desc; } catch (e) {}
      try { $i('#offerPrice').text = d.price; } catch (e) {}
      try { $i('#offerPrice').style.color = '#C9A227'; } catch (e) {}
      try { $i('#offerOldPrice').text = d.oldPrice; } catch (e) {}
      try { $i('#offerBadge').text = d.badge; } catch (e) {}
      try { $i('#offerExpires').text = d.expires; } catch (e) {}
      try {
        $i('#offerDetailsBtn').onClick(function () {
          wixWindow.storage.local.setItem('selectedOfferId', d._id);
          wixLocation.to('/checkout');
        });
      } catch (e) {}
    });
  } catch (e) {}
}
