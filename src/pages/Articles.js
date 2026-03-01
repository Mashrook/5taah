/**
 * 5ATTH | خته – Articles & News 
 * المقالات والأخبار
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { getArticles } from 'backend/cmsService.web';

function el(id) { try { return $w(id); } catch (e) { return null; } }
function setText(id, txt) { try { var e = el(id); if (e) e.text = txt; } catch (e) {} }
function show(id) { try { var e = el(id); if (e) e.expand(); } catch (e) {} }
function hide(id) { try { var e = el(id); if (e) e.collapse(); } catch (e) {} }
function btn(id, fn) { try { var e = el(id); if (e) e.onClick(fn); } catch (e) {} }

var TENANT = 'default';

var fallbackArticles = [
 { _id: 'a1', title: 'أفضل ١٠ وجهات سفر للسعوديين في ٢٠٢٥', category: 'destinations', date: '٢٠٢٥/٠١/١٥', excerpt: 'دليلك الشامل لاختيار وجهتك القادمة. من شواطئ المالديف إلى جبال جورجيا، اكتشف أفضل الوجهات المناسبة لميزانيتك.', readTime: '٥ دقائق', author: 'فريق خته'},
 { _id: 'a2', title: 'نصائح ذهبية لحجز أرخص تذاكر الطيران', category: 'tips', date: '٢٠٢٥/٠١/١٠', excerpt: 'تعلم أسرار الحصول على أفضل أسعار الطيران. مواعيد الحجز المثالية وشركات الطيران الاقتصادية من السعودية.', readTime: '٤ دقائق', author: 'فريق خته'},
 { _id: 'a3', title: 'دليل اختيار الفندق المثالي لرحلتك', category: 'hotels', date: '٢٠٢٥/٠١/٠٥', excerpt: 'كيف تختار الفندق المناسب؟ نصائح حول الموقع والخدمات والسعر. قارن بين الفنادق بذكاء واحجز بثقة.', readTime: '٦ دقائق', author: 'فريق خته'},
 { _id: 'a4', title: 'دليل العمرة الشامل - كل ما تحتاج معرفته', category: 'hajj', date: '٢٠٢٤/١٢/٢٨', excerpt: 'من التحضير للسفر إلى أداء المناسك. دليل متكامل للعمرة يشمل الفنادق والمواصلات والنصائح المهمة.', readTime: '٨ دقائق', author: 'فريق خته'},
 { _id: 'a5', title: 'الدراسة في بريطانيا - تجربتي الشخصية', category: 'study', date: '٢٠٢٤/١٢/٢٠', excerpt: 'قصة طالب سعودي في لندن. من التقديم على الجامعة إلى الحصول على القبول والسكن والحياة اليومية.', readTime: '٧ دقائق', author: 'أحمد المطيري'},
 { _id: 'a6', title: 'تأجير السيارات في أوروبا - دليل المبتدئين', category: 'tips', date: '٢٠٢٤/١٢/١٥', excerpt: 'كل ما تحتاج معرفته عن تأجير سيارة في أوروبا. الرخصة الدولية، التأمين، قواعد المرور، والنصائح المهمة.', readTime: '٦ دقائق', author: 'فريق خته'},
 { _id: 'a7', title: 'أفضل الشواطئ في الخليج العربي', category: 'destinations', date: '٢٠٢٤/١٢/١٠', excerpt: 'من شواطئ دبي إلى جزر البحرين وسواحل عمان. دليلك لأجمل الشواطئ القريبة مع نصائح للعائلات.', readTime: '٥ دقائق', author: 'فريق خته'},
 { _id: 'a8', title: 'حقيبة السفر المثالية - ماذا تحزم؟', category: 'tips', date: '٢٠٢٤/١٢/٠٥', excerpt: 'قائمة شاملة لتحضير حقيبة السفر. نصائح للتعبئة الذكية وأساسيات لا يجب نسيانها في كل رحلة.', readTime: '٤ دقائق', author: 'فريق خته'},
];

var activeCategory = 'all';

$w.onReady(async function () {
 wixSeo.title = 'مقالات السفر | 5ATTH خته';
 wixSeo.description = 'مقالات ونصائح سفر: أفضل الوجهات، نصائح الحجز، أدلة السياحة، وتجارب مسافرين';

 setText('#pageTitle', 'مقالات ونصائح');
 setText('#pageSubtitle', 'أحدث المقالات والنصائح لتجعل رحلتك أفضل');

 /* ——— Category Filter ——————————————————— */
 try {
 var catFilter = el('#articleCategoryFilter');
 if (catFilter) {
 catFilter.options = [
 { label: 'جميع المقالات', value: 'all'},
 { label: 'وجهات', value: 'destinations'},
 { label: 'نصائح', value: 'tips'},
 { label: 'فنادق', value: 'hotels'},
 { label: 'حج وعمرة', value: 'hajj'},
 { label: 'دراسة', value: 'study'},
 ];
 catFilter.onChange(function (e) {
 activeCategory = e.target.value;
 renderArticles(getFiltered());
 });
 }
 } catch (e) {}

 /* ——— Search Articles ——————————————————— */
 btn('#searchArticlesBtn', function () {
 var q = ((el('#articleSearchInput') || {}).value || '').trim().toLowerCase();
 if (!q) { renderArticles(fallbackArticles); return; }
 var filtered = fallbackArticles.filter(function (a) {
 return a.title.toLowerCase().indexOf(q) !== -1 || a.excerpt.toLowerCase().indexOf(q) !== -1;
 });
 renderArticles(filtered);
 });

 /* ——— Load from CMS or fallback ——————————————————— */
 try {
 var cmsArticles = await getArticles(TENANT);
 if (cmsArticles && cmsArticles.length > 0) {
 fallbackArticles = cmsArticles.map(function (a) {
 return {
 _id: a._id,
 title: a.title || '',
 category: a.category || 'tips',
 date: a.publishDate || '',
 excerpt: a.excerpt || a.subtitle || '',
 readTime: a.readTime || '٥ دقائق',
 author: a.author || 'فريق خته',
 slug: a.slug || '',
 };
 });
 }
 } catch (e) {}

 renderArticles(getFiltered());
});

function getFiltered() {
 if (activeCategory === 'all') return fallbackArticles;
 return fallbackArticles.filter(function (a) { return a.category === activeCategory; });
}

function renderArticles(articles) {
 setText('#articlesCount', articles.length + 'مقال');
 try {
 var rep = el('#articlesRepeater');
 if (!rep) return;

 rep.data = articles;
 rep.onItemReady(function ($i, d) {
 try { $i('#articleTitle').text = d.title; } catch (e) {}
 try { $i('#articleExcerpt').text = d.excerpt; } catch (e) {}
 try { $i('#articleDate').text = d.date; } catch (e) {}
 try { $i('#articleReadTime').text = d.readTime; } catch (e) {}
 try { $i('#articleAuthor').text = d.author; } catch (e) {}
 try {
 $i('#articleReadBtn').onClick(function () {
 if (d.slug) {
 wixLocation.to('/articles/'+ d.slug);
 }
 });
 } catch (e) {}
 });
 } catch (e) {}
}
