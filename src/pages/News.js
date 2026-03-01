/**
 * 5ATTH | خته – Travel News 📢
 * أخبار السفر والسياحة
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

var fallbackNews = [
  { _id: 'n1', title: '🛫 الخطوط السعودية تطلق رحلات مباشرة جديدة', date: '٢٠٢٥/٠١/٢٠', category: 'airlines', excerpt: 'أعلنت الخطوط السعودية عن إطلاق ٥ وجهات جديدة تشمل أثينا، براغ، وساو باولو ضمن خطة التوسع لعام ٢٠٢٥.', source: 'الخطوط السعودية' },
  { _id: 'n2', title: '🏨 افتتاح فندق فاخر جديد في العلا', date: '٢٠٢٥/٠١/١٨', category: 'hotels', excerpt: 'افتتح منتجع "بانيان تري" في العلا أبوابه رسمياً بـ ٨٢ فيلا فاخرة مستوحاة من الطبيعة النبطية.', source: 'هيئة العلا' },
  { _id: 'n3', title: '✈️ طيران ناس يطلق عروض صيف ٢٠٢٥', date: '٢٠٢٥/٠١/١٥', category: 'offers', excerpt: 'طرح طيران ناس تذاكر بأسعار تبدأ من ٩٩ ر.س لوجهات داخلية و٤٩٩ ر.س لوجهات دولية ضمن حملة الصيف.', source: 'طيران ناس' },
  { _id: 'n4', title: '🌍 السعودية تتصدر وجهات السياحة العربية', date: '٢٠٢٥/٠١/١٢', category: 'tourism', excerpt: 'أظهرت إحصائيات منظمة السياحة العالمية أن المملكة استقبلت ١٠٠ مليون زائر في ٢٠٢٤ محققة أهداف رؤية ٢٠٣٠.', source: 'وزارة السياحة' },
  { _id: 'n5', title: '🛂 تحديثات جديدة على تأشيرة السياحة السعودية', date: '٢٠٢٥/٠١/١٠', category: 'visa', excerpt: 'أضافت المملكة ١٥ دولة جديدة لقائمة الدول المستفيدة من التأشيرة الإلكترونية الفورية بتكلفة ٣٠٠ ر.س.', source: 'وزارة السياحة' },
  { _id: 'n6', title: '🏗️ مشروع ذا لاين في نيوم يقترب من المرحلة الأولى', date: '٢٠٢٥/٠١/٠٨', category: 'megaprojects', excerpt: 'كشفت شركة نيوم عن اقتراب الانتهاء من المرحلة الأولى من مشروع ذا لاين مع توقعات بافتتاح جزئي في ٢٠٢٦.', source: 'نيوم' },
  { _id: 'n7', title: '💰 أسعار الطيران تنخفض ٢٠٪ مع المنافسة', date: '٢٠٢٥/٠١/٠٥', category: 'airlines', excerpt: 'أدى دخول شركات طيران جديدة للسوق السعودي إلى انخفاض ملحوظ في أسعار التذاكر بمعدل ٢٠٪ مقارنة بالعام الماضي.', source: 'الطيران المدني' },
  { _id: 'n8', title: '🎭 موسم الرياض ٢٠٢٥ يبدأ بفعاليات ضخمة', date: '٢٠٢٥/٠١/٠١', category: 'events', excerpt: 'انطلقت فعاليات موسم الرياض ٢٠٢٥ بأكثر من ١٠٠ فعالية ترفيهية وثقافية ورياضية تستمر حتى مارس المقبل.', source: 'هيئة الترفيه' },
];

$w.onReady(async function () {
  wixSeo.title = 'أخبار السفر والسياحة | 5ATTH خته';
  wixSeo.description = 'آخر أخبار السفر والسياحة - عروض الطيران، الفنادق الجديدة، تحديثات التأشيرات والمزيد';

  setText('#pageTitle', '📢 أخبار السفر');
  setText('#pageSubtitle', 'تابع آخر أخبار السفر والسياحة في السعودية والعالم');

  /* ——— Category Filter ——————————————————— */
  try {
    var catFilter = el('#newsCategoryFilter');
    if (catFilter) {
      catFilter.options = [
        { label: 'جميع الأخبار', value: 'all' },
        { label: '✈️ طيران', value: 'airlines' },
        { label: '🏨 فنادق', value: 'hotels' },
        { label: '🏷️ عروض', value: 'offers' },
        { label: '🌍 سياحة', value: 'tourism' },
        { label: '🛂 تأشيرات', value: 'visa' },
      ];
      catFilter.onChange(function (e) {
        var cat = e.target.value;
        if (cat === 'all') renderNews(fallbackNews);
        else renderNews(fallbackNews.filter(function (n) { return n.category === cat; }));
      });
    }
  } catch (e) {}

  /* ——— Try CMS ——————————————————— */
  try {
    var cmsNews = await getArticles(TENANT, { category: 'news' });
    if (cmsNews && cmsNews.length > 0) {
      fallbackNews = cmsNews.map(function (n) {
        return {
          _id: n._id,
          title: n.title || '',
          date: n.publishDate || '',
          category: n.category || 'tourism',
          excerpt: n.excerpt || '',
          source: n.source || 'خته',
          slug: n.slug || '',
        };
      });
    }
  } catch (e) {}

  renderNews(fallbackNews);

  /* ——— Breaking news ticker ——————————————————— */
  setText('#breakingNews', '🔴 عاجل: الخطوط السعودية تعلن عن وجهات جديدة لصيف ٢٠٢٥ | موسم الرياض يستقبل ١٠ ملايين زائر | عروض حصرية على رحلات دبي');
});

function renderNews(news) {
  setText('#newsCount', news.length + ' خبر');
  try {
    var rep = el('#newsRepeater');
    if (!rep) return;

    rep.data = news;
    rep.onItemReady(function ($i, d) {
      try { $i('#newsTitle').text = d.title; } catch (e) {}
      try { $i('#newsExcerpt').text = d.excerpt; } catch (e) {}
      try { $i('#newsDate').text = '📅 ' + d.date; } catch (e) {}
      try { $i('#newsSource').text = '📰 ' + d.source; } catch (e) {}
      try {
        $i('#newsReadBtn').onClick(function () {
          if (d.slug) wixLocation.to('/articles/' + d.slug);
        });
      } catch (e) {}
    });
  } catch (e) {}
}
