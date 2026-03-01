/**
 * 5ATTH | خته – Seasons Page 
 * المواسم والمناسبات
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

var seasons = [
 {
 _id: 's1', name: 'موسم رمضان', period: 'مارس - أبريل',
 desc: 'أجواء رمضانية مميزة مع عروض حصرية على فنادق مكة والمدينة. إفطارات فاخرة وبرامج عمرة شاملة.',
 highlights: ['عمرة رمضان الشاملة', 'فنادق قريبة من الحرم', 'إفطار وسحور يومي', 'نقل من وإلى المطار'],
 offers: [
 { _id: 'rs1', title: 'عمرة رمضان - ٧ ليالي', price: '٤,٩٩٩ ر.س', badge: 'الأكثر طلباً'},
 { _id: 'rs2', title: 'فندق ٥ نجوم مكة', price: '٨٩٩ ر.س/ليلة', badge: 'خصم ٣٠٪'},
 ]
 },
 {
 _id: 's2', name: 'موسم الحج', period: 'يونيو - يوليو',
 desc: 'باقات حج متكاملة تشمل السكن والتنقل والإعاشة مع مرشدين متخصصين.',
 highlights: ['حملات حج معتمدة', 'سكن قريب من المشاعر', 'مرشدين معتمدين', 'وجبات يومية'],
 offers: [
 { _id: 'hs1', title: 'حج مميز - باقة شاملة', price: '١٢,٩٩٩ ر.س', badge: 'حجز مبكر'},
 { _id: 'hs2', title: 'حج اقتصادي', price: '٧,٩٩٩ ر.س', badge: 'محدود'},
 ]
 },
 {
 _id: 's3', name: 'موسم الصيف', period: 'يوليو - سبتمبر',
 desc: 'عروض صيفية مذهلة للعائلات والشباب. وجهات باردة ومنتجعات شاطئية بأسعار خاصة.',
 highlights: ['رحلات عائلية', 'منتجعات شاطئية', 'برامج أطفال', 'وجهات أوروبية'],
 offers: [
 { _id: 'ss1', title: 'إسطنبول العائلية - ٥ ليالي', price: '٤,٤٩٩ ر.س', badge: 'صيف ٢٠٢٥'},
 { _id: 'ss2', title: 'منتجع أنطاليا', price: '٣,٧٩٩ ر.س', badge: 'شاطئ خاص'},
 ]
 },
 {
 _id: 's4', name: 'موسم الشتاء', period: 'نوفمبر - فبراير',
 desc: 'استمتع بالدفء في وجهات استوائية أو بمغامرات الثلوج. عروض نهاية العام والأعياد.',
 highlights: ['رحلات المالديف', 'تزلج في جورجيا', 'سفاري أفريقيا', 'كروز البحر المتوسط'],
 offers: [
 { _id: 'ws1', title: 'المالديف - ٤ ليالي', price: '٧,٩٩٩ ر.س', badge: 'فاخر'},
 { _id: 'ws2', title: 'جورجيا الشتوية', price: '٢,٩٩٩ ر.س', badge: 'تزلج + جولات'},
 ]
 },
 {
 _id: 's5', name: 'موسم الرياض', period: 'أكتوبر - مارس',
 desc: 'أحداث ترفيهية عالمية في الرياض مع باقات إقامة وتذاكر فعاليات حصرية.',
 highlights: ['تذاكر فعاليات', 'فنادق قريبة', 'نقل VIP', 'تجارب حصرية'],
 offers: [
 { _id: 'rs3', title: 'باقة موسم الرياض', price: '١,٤٩٩ ر.س', badge: 'فعاليات مجانية'},
 { _id: 'rs4', title: 'إقامة + تذاكر', price: '٢,٢٩٩ ر.س', badge: 'VIP'},
 ]
 },
];

$w.onReady(async function () {
 wixSeo.title = 'المواسم والمناسبات | 5ATTH خته';
 wixSeo.description = 'اكتشف عروض المواسم والمناسبات - رمضان، الحج، الصيف، الشتاء وموسم الرياض';

 setText('#pageTitle', 'المواسم والمناسبات');
 setText('#pageSubtitle', 'عروض خاصة لكل موسم ومناسبة على مدار العام');

 /* ——— Try CMS first ——————————————————— */
 try {
 var cmsData = await getSectionContent(TENANT, 'seasons');
 if (cmsData && cmsData.length > 0) {
 // If CMS has data, merge it
 }
 } catch (e) {}

 /* ——— Render Seasons ——————————————————— */
 try {
 var rep = el('#seasonsRepeater');
 if (rep) {
 rep.data = seasons;
 rep.onItemReady(function ($i, d) {
 try { $i('#seasonName').text = d.name; } catch (e) {}
 try { $i('#seasonPeriod').text = d.period; } catch (e) {}
 try { $i('#seasonDesc').text = d.desc; } catch (e) {}
 try { $i('#seasonName').style.color = '#C9A227'; } catch (e) {}
 try {
 $i('#seasonDetailsBtn').onClick(function () {
 renderSeasonDetail(d);
 });
 } catch (e) {}
 });
 }
 } catch (e) {}

 /* ——— Show first season detail by default ——————————————————— */
 renderSeasonDetail(seasons[0]);
});

function renderSeasonDetail(season) {
 setText('#detailTitle', season.name);
 setText('#detailDesc', season.desc);
 setText('#detailPeriod', season.period);

 /* Highlights */
 try {
 var hlText = season.highlights.map(function (h) { return '- ' + h; }).join('\n');
 setText('#detailHighlights', hlText);
 } catch (e) {}

 /* Season Offers */
 try {
 var rep = el('#seasonOffersRepeater');
 if (rep) {
 rep.data = season.offers;
 rep.onItemReady(function ($i, d) {
 try { $i('#seasonOfferTitle').text = d.title; } catch (e) {}
 try { $i('#seasonOfferPrice').text = d.price; } catch (e) {}
 try { $i('#seasonOfferPrice').style.color = '#C9A227'; } catch (e) {}
 try { $i('#seasonOfferBadge').text = d.badge; } catch (e) {}
 try {
 $i('#seasonOfferBtn').onClick(function () {
 wixLocation.to('/offers');
 });
 } catch (e) {}
 });
 }
 } catch (e) {}
}
