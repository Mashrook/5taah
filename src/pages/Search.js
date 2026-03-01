/**
 * 5ATTH | خته – Unified Search 
 * صفحة البحث الموحد
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { searchFlights, searchHotels, searchActivities } from 'backend/searchService.web';
import { getCuratedOffers, getArticles } from 'backend/cmsService.web';

function el(id) { try { return $w(id); } catch (e) { return null; } }
function setText(id, txt) { try { var e = el(id); if (e) e.text = txt; } catch (e) {} }
function show(id) { try { var e = el(id); if (e) e.expand(); } catch (e) {} }
function hide(id) { try { var e = el(id); if (e) e.collapse(); } catch (e) {} }
function btn(id, fn) { try { var e = el(id); if (e) e.onClick(fn); } catch (e) {} }

var TENANT = 'default';

$w.onReady(async function () {
 wixSeo.title = 'بحث | 5ATTH خته';

 setText('#pageTitle', 'البحث');
 setText('#pageSubtitle', 'ابحث عن رحلات، فنادق، سيارات، جولات والمزيد');

 /* ——— Get query from URL ——————————————————— */
 var query = wixLocation.query;
 var searchType = query.type || 'all';
 var searchQuery = query.q || '';

 if (searchQuery) {
 try { el('#searchInput').value = searchQuery; } catch (e) {}
 }

 /* ——— Search type tabs ——————————————————— */
 try {
 var typeDrop = el('#searchTypeFilter');
 if (typeDrop) {
 typeDrop.options = [
 { label: 'بحث شامل', value: 'all'},
 { label: 'رحلات', value: 'flights'},
 { label: 'فنادق', value: 'hotels'},
 { label: 'سيارات', value: 'cars'},
 { label: 'جولات', value: 'tours'},
 { label: 'عروض', value: 'offers'},
 ];
 typeDrop.value = searchType;
 typeDrop.onChange(function (e) { searchType = e.target.value; });
 }
 } catch (e) {}

 /* ——— Search Button ——————————————————— */
 btn('#unifiedSearchBtn', async function () {
 var q = (el('#searchInput') || {}).value || '';
 if (!q) return;
 await performSearch(searchType, q);
 });

 /* ——— Auto-search if params present ——————————————————— */
 if (searchQuery) {
 await performSearch(searchType, searchQuery);
 }
});

async function performSearch(type, query) {
 show('#loadingSection');
 hide('#resultsSection');
 setText('#searchError', '');
 var allResults = [];

 try {
 if (type === 'all'|| type === 'flights') {
 try {
 var fr = await searchFlights(TENANT, { origin: query, destination: '', departureDate: '', adults: 1, currency: 'SAR'});
 if (fr.offers) {
 fr.offers.forEach(function (o) {
 allResults.push({
 _id: 'f_'+ o.providerOfferId,
 type: 'رحلة',
 title: (o.segments && o.segments[0] ? o.segments[0].origin + '→ '+ o.segments[0].destination : query),
 subtitle: o.airline || '',
 price: o.totalAmount + ' ' + o.currency,
 action: '/flights',
 });
 });
 }
 } catch (e) {}
 }

 if (type === 'all'|| type === 'hotels') {
 try {
 var hr = await searchHotels(TENANT, { cityCode: query, adults: 2, currency: 'SAR'});
 if (hr.offers) {
 hr.offers.forEach(function (o) {
 allResults.push({
 _id: 'h_'+ o.providerOfferId,
 type: 'فندق',
 title: o.hotelName || query,
 subtitle: o.boardType || '',
 price: o.totalAmount + ' ' + o.currency,
 action: '/hotels',
 });
 });
 }
 } catch (e) {}
 }

 if (type === 'all'|| type === 'cars'|| type === 'tours') {
 try {
 var ar = await searchActivities(TENANT, { query: query, currency: 'SAR'});
 if (ar.offers) {
 ar.offers.forEach(function (o) {
 var icon = o.activityType === 'car_rental'? 'سيارة': 'جولة';
 allResults.push({
 _id: 'a_'+ o.providerOfferId,
 type: icon,
 title: o.activityName || query,
 subtitle: o.description || '',
 price: o.totalAmount + ' ' + o.currency,
 action: o.activityType === 'car_rental'? '/cars': '/tours',
 });
 });
 }
 } catch (e) {}
 }

 if (type === 'all'|| type === 'offers') {
 try {
 var or = await getCuratedOffers(TENANT);
 if (or && or.length > 0) {
 or.forEach(function (o) {
 if (o.title && o.title.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
 allResults.push({
 _id: 'o_'+ o._id,
 type: 'عرض',
 title: o.title,
 subtitle: o.description || '',
 price: o.price || '',
 action: '/offers',
 });
 }
 });
 }
 } catch (e) {}
 }
 } catch (e) {
 setText('#searchError', 'حدث خطأ أثناء البحث');
 }

 hide('#loadingSection');
 show('#resultsSection');
 setText('#resultsCount', allResults.length + 'نتيجة');

 if (allResults.length === 0) {
 setText('#noResults', 'لا توجد نتائج لـ "'+ query + '". جرّب كلمات بحث مختلفة.');
 show('#noResultsSection');
 return;
 }

 hide('#noResultsSection');

 try {
 var rep = el('#searchResultsRepeater');
 if (!rep) return;

 rep.data = allResults;
 rep.onItemReady(function ($i, d) {
 try { $i('#resultType').text = d.type; } catch (e) {}
 try { $i('#resultTitle').text = d.title; } catch (e) {}
 try { $i('#resultSubtitle').text = d.subtitle; } catch (e) {}
 try { $i('#resultPrice').text = d.price; } catch (e) {}
 try { $i('#resultPrice').style.color = '#C9A227'; } catch (e) {}
 try {
 $i('#resultActionBtn').onClick(function () {
 wixLocation.to(d.action);
 });
 } catch (e) {}
 });
 } catch (e) {}
}
