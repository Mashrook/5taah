/**
 * 5ATTH | خته – Tours & Experiences 
 * الجولات والتجارب السياحية
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { searchActivities } from 'backend/searchService.web';
import { getSectionContent } from 'backend/cmsService.web';

function el(id) { try { return $w(id); } catch (e) { return null; } }
function setText(id, txt) { try { var e = el(id); if (e) e.text = txt; } catch (e) {} }
function setLabel(id, txt) { try { var e = el(id); if (e) e.label = txt; } catch (e) {} }
function show(id) { try { var e = el(id); if (e) e.expand(); } catch (e) {} }
function hide(id) { try { var e = el(id); if (e) e.collapse(); } catch (e) {} }
function btn(id, fn) { try { var e = el(id); if (e) e.onClick(fn); } catch (e) {} }

var TENANT = 'default';

var tours = [
 { _id: 't1', name: 'جولة العلا التراثية', category: 'culture', duration: 'يومان', price: '١,٢٩٩ ر.س', desc: 'استكشف مدائن صالح والمواقع الأثرية مع مرشد متخصص', rating: '٤.٨ ', groupSize: '٤-١٢ شخص'},
 { _id: 't2', name: 'غوص البحر الأحمر', category: 'adventure', duration: 'يوم واحد', price: '٤٩٩ ر.س', desc: 'تجربة غوص في الشعاب المرجانية بينبع', rating: '٤.٩ ', groupSize: '٢-٦ أشخاص'},
 { _id: 't3', name: 'رحلة صحراوية بالربع الخالي', category: 'adventure', duration: '٣ أيام', price: '٢,٤٩٩ ر.س', desc: 'مغامرة في أكبر صحراء رملية بالعالم مع تخييم تحت النجوم', rating: '٤.٧ ', groupSize: '٤-٨ أشخاص'},
 { _id: 't4', name: 'جولة طعام جدة التاريخية', category: 'food', duration: '٤ ساعات', price: '١٩٩ ر.س', desc: 'تذوق أشهى الأطباق الحجازية في أزقة البلد القديمة', rating: '٤.٩ ', groupSize: '٢-١٠ أشخاص'},
 { _id: 't5', name: 'تسلق جبال الحجاز', category: 'nature', duration: 'يوم واحد', price: '٣٤٩ ر.س', desc: 'تسلق جبل اللوز والاستمتاع بإطلالات خلابة', rating: '٤.٦ ', groupSize: '٤-١٠ أشخاص'},
 { _id: 't6', name: 'تجربة سباق الفورمولا إي', category: 'sports', duration: '٣ أيام', price: '١,٨٩٩ ر.س', desc: 'احضر سباق الفورمولا إي في الدرعية مع باقة VIP', rating: '٤.٨ ', groupSize: '١-٤ أشخاص'},
 { _id: 't7', name: 'محمية الحياة الفطرية', category: 'nature', duration: 'يوم واحد', price: '٢٤٩ ر.س', desc: 'رحلة سفاري في محمية شرعان لمشاهدة الحياة البرية', rating: '٤.٥ ', groupSize: '٤-١٢ شخص'},
 { _id: 't8', name: 'جولة ثقافية الدرعية', category: 'culture', duration: 'نصف يوم', price: '١٤٩ ر.س', desc: 'اكتشف التراث السعودي في حي الطريف التاريخي', rating: '٤.٧ ', groupSize: '٢-١٥ شخص'},
];

var activeCategory = 'all';

$w.onReady(async function () {
 wixSeo.title = 'جولات وتجارب سياحية | 5ATTH خته';
 wixSeo.description = 'اكتشف أفضل الجولات والتجارب السياحية في السعودية والعالم العربي';

 setText('#pageTitle', 'جولات وتجارب');
 setText('#pageSubtitle', 'اكتشف تجارب سياحية فريدة في السعودية والعالم');

 /* ——— Category Filter ——————————————————— */
 try {
 var catFilter = el('#tourCategoryFilter');
 if (catFilter) {
 catFilter.options = [
 { label: 'الكل', value: 'all'},
 { label: 'مغامرات', value: 'adventure'},
 { label: 'ثقافة وتراث', value: 'culture'},
 { label: 'طبيعة', value: 'nature'},
 { label: 'طعام', value: 'food'},
 { label: 'رياضة', value: 'sports'},
 ];
 catFilter.onChange(function (e) {
 activeCategory = e.target.value;
 renderTours(getFiltered());
 });
 }
 } catch (e) {}

 /* ——— Search Button ——————————————————— */
 btn('#searchToursBtn', async function () {
 var q = (el('#tourSearchInput') || {}).value || '';
 if (!q) return;
 show('#loadingSection');
 try {
 var result = await searchActivities(TENANT, { query: q, activityType: 'tour', currency: 'SAR'});
 if (result.offers && result.offers.length > 0) {
 var mapped = result.offers.map(function (o) {
 return {
 _id: o.providerOfferId || String(Math.random()),
 name: o.activityName || 'جولة',
 category: 'all',
 duration: o.duration || '',
 price: o.totalAmount + ' ' + o.currency,
 desc: o.description || '',
 rating: '',
 groupSize: '',
 };
 });
 renderTours(mapped);
 }
 } catch (e) {}
 hide('#loadingSection');
 });

 /* ——— Try CMS ——————————————————— */
 try {
 var cmsData = await getSectionContent(TENANT, 'tours');
 if (cmsData && cmsData.length > 0) {
 // merge CMS data with fallback if available
 }
 } catch (e) {}

 renderTours(tours);
});

function getFiltered() {
 if (activeCategory === 'all') return tours;
 return tours.filter(function (t) { return t.category === activeCategory; });
}

function renderTours(list) {
 setText('#toursCount', list.length + 'تجربة متاحة');
 try {
 var rep = el('#toursRepeater');
 if (!rep) return;

 rep.data = list;
 rep.onItemReady(function ($i, d) {
 try { $i('#tourName').text = d.name; } catch (e) {}
 try { $i('#tourDesc').text = d.desc; } catch (e) {}
 try { $i('#tourDuration').text = d.duration; } catch (e) {}
 try { $i('#tourPrice').text = d.price; } catch (e) {}
 try { $i('#tourPrice').style.color = '#C9A227'; } catch (e) {}
 try { $i('#tourRating').text = d.rating; } catch (e) {}
 try { $i('#tourGroupSize').text = d.groupSize; } catch (e) {}
 try {
 $i('#tourBookBtn').onClick(function () {
 wixWindow.storage.local.setItem('selectedTour', JSON.stringify(d));
 wixLocation.to('/checkout');
 });
 } catch (e) {}
 });
 } catch (e) {}
}
