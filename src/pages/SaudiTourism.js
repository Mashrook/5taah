/**
 * 5ATTH | خته – Saudi Tourism 🇸🇦
 * السياحة السعودية
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { getSectionContent, getCuratedOffers } from 'backend/cmsService.web';

function el(id) { try { return $w(id); } catch (e) { return null; } }
function setText(id, txt) { try { var e = el(id); if (e) e.text = txt; } catch (e) {} }
function show(id) { try { var e = el(id); if (e) e.expand(); } catch (e) {} }
function hide(id) { try { var e = el(id); if (e) e.collapse(); } catch (e) {} }
function btn(id, fn) { try { var e = el(id); if (e) e.onClick(fn); } catch (e) {} }

var TENANT = 'default';

var highlights = [
  {
    _id: 'h1', name: '🏛️ العلا', region: 'المدينة المنورة',
    desc: 'مدينة الحضارات القديمة - مدائن صالح المدرجة في قائمة اليونسكو، جبل الفيل، البلدة القديمة. تجربة تاريخية فريدة بين الجبال المنحوتة.',
    activities: ['جولات أثرية مع مرشدين', 'رحلات بالمنطاد', 'مهرجان شتاء طنطورة', 'تسلق جبال', 'تخييم صحراوي'],
    priceFrom: 'من ٨٩٩ ر.س'
  },
  {
    _id: 'h2', name: '🌊 نيوم', region: 'تبوك',
    desc: 'مدينة المستقبل على ساحل البحر الأحمر. مشروع ذا لاين وتروجينا للتزلج. رؤية المملكة ٢٠٣٠ تتحقق أمام عينيك.',
    activities: ['غوص في البحر الأحمر', 'جولات مستقبلية', 'شواطئ بكر', 'جبال وأودية'],
    priceFrom: 'قريباً'
  },
  {
    _id: 'h3', name: '🏰 الدرعية', region: 'الرياض',
    desc: 'مهد الدولة السعودية الأولى - حي الطريف التاريخي (يونسكو)، البجيري، مطاعم ومقاهي فاخرة وفعاليات على مدار العام.',
    activities: ['جولة حي الطريف', 'متاحف تفاعلية', 'مطاعم فاخرة', 'فعاليات موسمية', 'تسوق حرف يدوية'],
    priceFrom: 'من ١٤٩ ر.س'
  },
  {
    _id: 'h4', name: '🕌 جدة التاريخية', region: 'جدة',
    desc: 'البلد القديمة - بوابة الحرمين الشريفين. أزقة عتيقة، منازل حجازية تقليدية، أسواق شعبية عريقة وكورنيش بحري خلاب.',
    activities: ['جولة البلد القديمة', 'كورنيش جدة', 'نافورة الملك فهد', 'أسواق تقليدية', 'مأكولات حجازية'],
    priceFrom: 'من ٩٩ ر.س'
  },
  {
    _id: 'h5', name: '🏙️ الرياض', region: 'الرياض',
    desc: 'العاصمة النابضة - بوليفارد سيتي، موسم الرياض، حي الملك عبدالله المالي. مدينة حديثة بتراث عريق وترفيه عالمي.',
    activities: ['موسم الرياض', 'بوليفارد سيتي', 'وادي نمار', 'حافة العالم', 'الدرعية'],
    priceFrom: 'من ١٩٩ ر.س'
  },
  {
    _id: 'h6', name: '🌿 عسير', region: 'عسير / أبها',
    desc: 'جنة الجنوب - جبال السودة الخضراء، قرية رجال ألمع التراثية، حديقة عسير الوطنية. طبيعة خلابة وأجواء معتدلة.',
    activities: ['تلفريك السودة', 'قرية رجال ألمع', 'حديقة عسير الوطنية', 'سوق الثلاثاء', 'شلالات تنومة'],
    priceFrom: 'من ٤٩٩ ر.س'
  },
  {
    _id: 'h7', name: '🏊 ينبع', region: 'المدينة المنورة',
    desc: 'لؤلؤة البحر الأحمر - شواطئ بيضاء، شعاب مرجانية، جزر استوائية. وجهة مثالية لعشاق البحر والغوص.',
    activities: ['غوص وسنوركل', 'رحلات بحرية', 'شواطئ خاصة', 'رياضات مائية'],
    priceFrom: 'من ٣٤٩ ر.س'
  },
  {
    _id: 'h8', name: '🏜️ حائل', region: 'حائل',
    desc: 'مدينة الجبال والتاريخ - قلعة عارف، جبل أجا، نقوش صخرية. رحلة عبر الزمن في قلب الجزيرة العربية.',
    activities: ['قلعة عارف', 'جبال أجا وسلمى', 'نقوش جبة الصخرية', 'رالي حائل', 'سوق برزان'],
    priceFrom: 'من ٢٩٩ ر.س'
  },
];

$w.onReady(async function () {
  wixSeo.title = 'السياحة السعودية | 5ATTH خته';
  wixSeo.description = 'اكتشف جمال المملكة العربية السعودية - العلا، نيوم، الدرعية، جدة التاريخية وأكثر';

  setText('#pageTitle', '🇸🇦 اكتشف السعودية');
  setText('#pageSubtitle', 'رحلة عبر أجمل معالم المملكة العربية السعودية');

  /* ——— Stats Banner ——————————————————— */
  setText('#saudiStat1', '+١٣');
  setText('#saudiStat1Label', 'منطقة سياحية');
  setText('#saudiStat2', '+٦');
  setText('#saudiStat2Label', 'مواقع يونسكو');
  setText('#saudiStat3', '+١٠٠');
  setText('#saudiStat3Label', 'تجربة سياحية');
  setText('#saudiStat4', '٣٦٥');
  setText('#saudiStat4Label', 'يوم سياحة');

  /* ——— Render Highlights ——————————————————— */
  try {
    var rep = el('#saudiHighlightsRepeater');
    if (rep) {
      rep.data = highlights;
      rep.onItemReady(function ($i, d) {
        try { $i('#highlightName').text = d.name; } catch (e) {}
        try { $i('#highlightRegion').text = '📍 ' + d.region; } catch (e) {}
        try { $i('#highlightDesc').text = d.desc; } catch (e) {}
        try { $i('#highlightPrice').text = d.priceFrom; } catch (e) {}
        try { $i('#highlightPrice').style.color = '#C9A227'; } catch (e) {}
        try {
          var actText = d.activities.map(function (a) { return '• ' + a; }).join('\n');
          $i('#highlightActivities').text = actText;
        } catch (e) {}
        try {
          $i('#highlightExploreBtn').onClick(function () {
            wixLocation.to('/tours');
          });
        } catch (e) {}
      });
    }
  } catch (e) {}

  /* ——— Saudi Offers ——————————————————— */
  var saudiOffers = [
    { _id: 'so1', title: '🏜️ باقة العلا الشاملة', desc: '٣ ليالي + جولات + طيران', price: '٢,٤٩٩ ر.س', badge: 'الأكثر حجزاً' },
    { _id: 'so2', title: '🏰 تجربة الدرعية', desc: 'يوم كامل + غداء + متاحف', price: '٢٤٩ ر.س', badge: 'جديد' },
    { _id: 'so3', title: '🌿 أسبوع في عسير', desc: '٧ ليالي + سيارة + جولات', price: '٣,٩٩٩ ر.س', badge: 'خصم ٢٥٪' },
    { _id: 'so4', title: '🏊 غوص ينبع', desc: 'يومان + معدات + مدرب', price: '٧٩٩ ر.س', badge: 'مغامرة' },
  ];

  try {
    var oRep = el('#saudiOffersRepeater');
    if (oRep) {
      oRep.data = saudiOffers;
      oRep.onItemReady(function ($i, d) {
        try { $i('#saudiOfferTitle').text = d.title; } catch (e) {}
        try { $i('#saudiOfferDesc').text = d.desc; } catch (e) {}
        try { $i('#saudiOfferPrice').text = d.price; } catch (e) {}
        try { $i('#saudiOfferPrice').style.color = '#C9A227'; } catch (e) {}
        try { $i('#saudiOfferBadge').text = d.badge; } catch (e) {}
        try {
          $i('#saudiOfferBtn').onClick(function () {
            wixLocation.to('/offers');
          });
        } catch (e) {}
      });
    }
  } catch (e) {}

  /* ——— Try CMS ——————————————————— */
  try {
    var cmsData = await getSectionContent(TENANT, 'saudi_tourism');
    if (cmsData && cmsData.length > 0) {}
  } catch (e) {}
});
