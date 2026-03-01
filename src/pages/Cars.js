/**
 * 5ATTH | خته – Cars Rental Search 
 * محرك بحث تأجير السيارات
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { searchActivities } from 'backend/searchService.web';

function el(id) { try { return $w(id); } catch (e) { return null; } }
function setText(id, txt) { try { var e = el(id); if (e) e.text = txt; } catch (e) {} }
function setLabel(id, txt) { try { var e = el(id); if (e) e.label = txt; } catch (e) {} }
function show(id) { try { var e = el(id); if (e) e.expand(); } catch (e) {} }
function hide(id) { try { var e = el(id); if (e) e.collapse(); } catch (e) {} }
function btn(id, fn) { try { var e = el(id); if (e) e.onClick(fn); } catch (e) {} }

var TENANT = 'default';

$w.onReady(async function () {

  /* Safe storage helper */
  var _storage = null;
  try { _storage = wixWindow.storage.local; } catch(e) {}
  function safeGet(key, fallback) { try { return _storage ? (_storage.getItem(key) || fallback) : fallback; } catch(e) { return fallback; } }
  function safeSet(key, val) { try { if (_storage) _storage.setItem(key, val); } catch(e) {} }
  function safeRemove(key) { try { if (_storage) _storage.removeItem(key); } catch(e) {} }

 wixSeo.title = 'تأجير سيارات | 5ATTH خته';
 wixSeo.description = 'استأجر سيارتك بأفضل الأسعار في السعودية والخليج والعالم';

 setText('#pageTitle', 'تأجير السيارات');
 setText('#pageSubtitle', 'استأجر سيارتك من أفضل شركات التأجير بأسعار تنافسية');
 setText('#pickupLabel', 'مدينة الاستلام');
 setText('#pickupDateLabel', 'تاريخ الاستلام');
 setText('#returnDateLabel', 'تاريخ الإرجاع');
 setText('#driverAgeLabel', 'عمر السائق');
 setLabel('#searchCarsBtn', 'بحث عن سيارات');

 var currency = safeGet('selectedCurrency', 'SAR');

 /* ——— Pre-fill from storage ——————————————————— */
 var stored = safeGet('searchParams', null);
 if (stored) {
 try {
 var p = JSON.parse(stored);
 try { el('#pickupCity').value = p.cityCode || ''; } catch (e) {}
 try { el('#pickupDate').value = p.startDate || ''; } catch (e) {}
 try { el('#returnDate').value = p.endDate || ''; } catch (e) {}
 safeRemove('searchParams');
 await doSearch(p);
 } catch (e) {}
 }

 /* ——— Search ——————————————————— */
 btn('#searchCarsBtn', async function () {
 var p = {
 cityCode: (el('#pickupCity') || {}).value || '',
 startDate: (el('#pickupDate') || {}).value || '',
 endDate: (el('#returnDate') || {}).value || '',
 currency: currency,
 activityType: 'car_rental',
 };
 if (!p.cityCode || !p.startDate) {
 setText('#searchError', 'يرجى تعبئة المدينة وتاريخ الاستلام');
 return;
 }
 await doSearch(p);
 });

 /* ——— Sort ——————————————————— */
 try {
 var sort = el('#carSort');
 if (sort) {
 sort.options = [
 { label: 'الأقل سعراً', value: 'price_asc'},
 { label: 'الأعلى سعراً', value: 'price_desc'},
 { label: 'الأفضل تقييماً', value: 'rating'},
 ];
 sort.onChange(function () { sortCars(sort.value); });
 }
 } catch (e) {}

 /* ——— Car Types ——————————————————— */
 var types = [
 { _id: 't1', name: 'اقتصادية', icon: '', desc: 'سيارات صغيرة موفرة للوقود', price: 'من ٩٩ ر.س/يوم'},
 { _id: 't2', name: 'عائلية', icon: '', desc: 'سيارات واسعة للعائلات', price: 'من ١٤٩ ر.س/يوم'},
 { _id: 't3', name: 'فاخرة', icon: '', desc: 'سيارات فاخرة وسبورت', price: 'من ٤٩٩ ر.س/يوم'},
 { _id: 't4', name: 'دفع رباعي', icon: '', desc: 'سيارات SUV للطرق الوعرة', price: 'من ١٩٩ ر.س/يوم'},
 { _id: 't5', name: 'حافلة صغيرة', icon: '', desc: 'لمجموعات ٧-١٥ شخص', price: 'من ٢٩٩ ر.س/يوم'},
 ];
 try {
 var rep = el('#carTypesRepeater');
 if (rep) {
 rep.data = types;
 rep.onItemReady(function ($i, d) {
 try { $i('#typeName').text = d.name; } catch (e) {}
 try { $i('#typeDesc').text = d.desc; } catch (e) {}
 try { $i('#typePrice').text = d.price; } catch (e) {}
 try { $i('#typePrice').style.color = '#C9A227'; } catch (e) {}
 });
 }
 } catch (e) {}

 /* ——— Popular Cities ——————————————————— */
 var cities = [
 { _id: 'pc1', name: 'الرياض', code: 'RUH'},
 { _id: 'pc2', name: 'جدة', code: 'JED'},
 { _id: 'pc3', name: 'الدمام', code: 'DMM'},
 { _id: 'pc4', name: 'دبي', code: 'DXB'},
 { _id: 'pc5', name: 'الكويت', code: 'KWI'},
 ];
 try {
 var pRep = el('#popularPickupRepeater');
 if (pRep) {
 pRep.data = cities;
 pRep.onItemReady(function ($i, d) {
 try { $i('#pickupCityName').text = d.name; } catch (e) {}
 try {
 $i('#pickupCityCard').onClick(function () {
 try { el('#pickupCity').value = d.code; } catch (e) {}
 });
 } catch (e) {}
 });
 }
 } catch (e) {}
});

var currentOffers = [];

async function doSearch(params) {
 show('#loadingSection');
 hide('#resultsSection');
 setText('#searchError', '');

 try {
 var result = await searchActivities(TENANT, params);
 currentOffers = result.offers || [];
 setText('#resultsCount', currentOffers.length + 'سيارة متاحة');
 renderCars(currentOffers);
 } catch (e) {
 setText('#searchError', 'حدث خطأ في البحث. جاري المحاولة مرة أخرى...');
 }

 hide('#loadingSection');
 show('#resultsSection');
}

function renderCars(offers) {
 try {
 var rep = el('#carsRepeater');
 if (!rep) return;

 rep.data = offers.map(function (o) {
 var name = o.activityName || 'سيارة';
 return {
 _id: o.providerOfferId || String(Math.random()),
 name: name,
 type: o.activityType || 'car_rental',
 price: o.totalAmount + ' ' + o.currency,
 pricePerDay: Math.round(o.totalAmount / Math.max(1, o.durationDays || 1)) + ' ' + o.currency + '/يوم',
 features: o.features || '',
 totalAmount: o.totalAmount,
 };
 });

 rep.onItemReady(function ($i, d) {
 try { $i('#carName').text = d.name; } catch (e) {}
 try { $i('#carType').text = d.type; } catch (e) {}
 try { $i('#carPrice').text = d.price; } catch (e) {}
 try { $i('#carPricePerDay').text = d.pricePerDay; } catch (e) {}
 try { $i('#carFeatures').text = d.features; } catch (e) {}
 try { $i('#carPrice').style.color = '#C9A227'; } catch (e) {}
 try {
 $i('#carBookBtn').onClick(function () {
 var offer = currentOffers.find(function (x) { return x.providerOfferId === d._id; });
 safeSet('selectedOffer', JSON.stringify(offer));
 wixLocation.to('/checkout');
 });
 } catch (e) {}
 });
 } catch (e) {}
}

function sortCars(type) {
 var sorted = currentOffers.slice();
 if (type === 'price_asc') sorted.sort(function (a, b) { return a.totalAmount - b.totalAmount; });
 else if (type === 'price_desc') sorted.sort(function (a, b) { return b.totalAmount - a.totalAmount; });
 renderCars(sorted);
}
