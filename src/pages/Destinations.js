/**
 * 5ATTH | خته – Destinations 🌍
 * الوجهات السياحية
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { getSectionContent } from 'backend/cmsService.web';

function el(id) { try { return $w(id); } catch (e) { return null; } }
function setText(id, txt) { try { var e = el(id); if (e) e.text = txt; } catch (e) {} }
function show(id) { try { var e = el(id); if (e) e.expand(); } catch (e) {} }
function hide(id) { try { var e = el(id); if (e) e.collapse(); } catch (e) {} }
function btn(id, fn) { try { var e = el(id); if (e) e.onClick(fn); } catch (e) {} }

var TENANT = 'default';

var destinations = [
  { _id: 'd1', name: '🇦🇪 دبي', country: 'uae', desc: 'مدينة المستقبل - برج خليفة، دبي مول، الأسواق التقليدية، سفاري الصحراء. وجهة مثالية للعائلات والأزواج.', bestTime: 'نوفمبر - مارس', flight: '١.٥ ساعة من الرياض', priceFrom: 'من ١,٤٩٩ ر.س' },
  { _id: 'd2', name: '🇹🇷 إسطنبول', country: 'turkey', desc: 'ملتقى الحضارات - آيا صوفيا، المسجد الأزرق، البازار الكبير، كروز البوسفور. تاريخ عريق وطبيعة ساحرة.', bestTime: 'أبريل - أكتوبر', flight: '٤ ساعات من الرياض', priceFrom: 'من ٢,٤٩٩ ر.س' },
  { _id: 'd3', name: '🇪🇬 القاهرة', country: 'egypt', desc: 'أم الدنيا - الأهرامات، المتحف المصري الكبير، خان الخليلي، نيل كروز. ثقافة وتاريخ لا ينتهي.', bestTime: 'أكتوبر - أبريل', flight: '٢.٥ ساعة من الرياض', priceFrom: 'من ١,٢٩٩ ر.س' },
  { _id: 'd4', name: '🇬🇧 لندن', country: 'uk', desc: 'عاصمة الضباب - بيغ بن، قصر باكنغهام، هايد بارك، أكسفورد ستريت. تسوق وثقافة عالمية.', bestTime: 'مايو - سبتمبر', flight: '٧ ساعات من الرياض', priceFrom: 'من ٣,٩٩٩ ر.س' },
  { _id: 'd5', name: '🇲🇾 كوالالمبور', country: 'malaysia', desc: 'جوهرة آسيا - برجا بتروناس، مرتفعات جنتنج، جزر لنكاوي. طبيعة خلابة وأسعار مناسبة.', bestTime: 'مايو - سبتمبر', flight: '٩ ساعات من الرياض', priceFrom: 'من ٢,٩٩٩ ر.س' },
  { _id: 'd6', name: '🇬🇪 تبليسي', country: 'georgia', desc: 'جوهرة القوقاز - الجبال الخضراء، الينابيع الحارة، المدينة القديمة. مغامرة بأسعار اقتصادية.', bestTime: 'يونيو - سبتمبر', flight: '٣.٥ ساعة من الرياض', priceFrom: 'من ١,٧٩٩ ر.س' },
  { _id: 'd7', name: '🇲🇻 المالديف', country: 'maldives', desc: 'جنة الأرض - فلل مائية، شعاب مرجانية، غروب لا ينسى. الوجهة المثالية لشهر العسل.', bestTime: 'نوفمبر - أبريل', flight: '٥ ساعات من الرياض', priceFrom: 'من ٥,٩٩٩ ر.س' },
  { _id: 'd8', name: '🇪🇸 برشلونة', country: 'spain', desc: 'مدينة غاودي - ساغرادا فاميليا، لا رامبلا، الشواطئ الذهبية. فن وثقافة وطعام رائع.', bestTime: 'مايو - أكتوبر', flight: '٦ ساعات من الرياض', priceFrom: 'من ٣,٤٩٩ ر.س' },
  { _id: 'd9', name: '🇧🇭 البحرين', country: 'bahrain', desc: 'لؤلؤة الخليج - باب البحرين، قلعة البحرين، شجرة الحياة. وجهة قريبة ومميزة لعطلة نهاية الأسبوع.', bestTime: 'نوفمبر - مارس', flight: '١ ساعة من الرياض', priceFrom: 'من ٦٩٩ ر.س' },
  { _id: 'd10', name: '🇴🇲 مسقط', country: 'oman', desc: 'سلطنة الجمال - جامع السلطان قابوس، وادي شاب، رمال وهيبة. طبيعة بكر ومغامرات فريدة.', bestTime: 'أكتوبر - أبريل', flight: '٢ ساعة من الرياض', priceFrom: 'من ٩٩٩ ر.س' },
];

var activeCountry = 'all';

$w.onReady(async function () {
  wixSeo.title = 'الوجهات السياحية | 5ATTH خته';
  wixSeo.description = 'اكتشف أجمل الوجهات السياحية حول العالم مع عروض حصرية من خته';

  setText('#pageTitle', '🌍 الوجهات السياحية');
  setText('#pageSubtitle', 'اكتشف أجمل الوجهات حول العالم واحجز رحلتك القادمة');

  /* ——— Region Filter ——————————————————— */
  try {
    var rFilter = el('#regionFilter');
    if (rFilter) {
      rFilter.options = [
        { label: 'جميع الوجهات', value: 'all' },
        { label: '🇸🇦 الخليج', value: 'gcc' },
        { label: '🇹🇷 تركيا', value: 'turkey' },
        { label: '🇪🇬 مصر', value: 'egypt' },
        { label: '🇬🇧 أوروبا', value: 'europe' },
        { label: '🌏 آسيا', value: 'asia' },
      ];
      rFilter.onChange(function (e) {
        activeCountry = e.target.value;
        renderDestinations(getFiltered());
      });
    }
  } catch (e) {}

  /* ——— Try CMS ——————————————————— */
  try {
    var cmsData = await getSectionContent(TENANT, 'destinations');
    if (cmsData && cmsData.length > 0) {
      // merge CMS data with fallback
    }
  } catch (e) {}

  renderDestinations(destinations);
});

function getFiltered() {
  if (activeCountry === 'all') return destinations;
  var regionMap = {
    gcc: ['uae', 'bahrain', 'oman'],
    turkey: ['turkey'],
    egypt: ['egypt'],
    europe: ['uk', 'spain'],
    asia: ['malaysia', 'maldives'],
  };
  var countries = regionMap[activeCountry] || [];
  return destinations.filter(function (d) { return countries.indexOf(d.country) !== -1; });
}

function renderDestinations(list) {
  setText('#destCount', list.length + ' وجهة');
  try {
    var rep = el('#destinationsRepeater');
    if (!rep) return;

    rep.data = list;
    rep.onItemReady(function ($i, d) {
      try { $i('#destName').text = d.name; } catch (e) {}
      try { $i('#destDesc').text = d.desc; } catch (e) {}
      try { $i('#destBestTime').text = '📅 أفضل وقت: ' + d.bestTime; } catch (e) {}
      try { $i('#destFlight').text = '✈️ ' + d.flight; } catch (e) {}
      try { $i('#destPrice').text = d.priceFrom; } catch (e) {}
      try { $i('#destPrice').style.color = '#C9A227'; } catch (e) {}
      try {
        $i('#destExploreBtn').onClick(function () {
          wixWindow.storage.local.setItem('selectedDestination', d.name);
          wixLocation.to('/flights');
        });
      } catch (e) {}
    });
  } catch (e) {}
}
