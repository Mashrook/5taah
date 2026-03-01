/**
 * 5ATTH | خته — المقالات (GCC Travel Blog / Guides)
 */
import wixSeo from 'wix-seo';
import wixLocation from 'wix-location';
import { getArticles, getArticleBySlug } from 'backend/cmsService.web';

const TENANT_ID = 'default';

$w.onReady(async function () {
  wixSeo.title = 'مقالات ودليل السفر | 5ATTH خته';
  wixSeo.description = 'مقالات ونصائح سفر شاملة - أفضل الوجهات، نصائح الحجز، تجارب المسافرين في الخليج والعالم';

  try {
    const articles = await getArticles(TENANT_ID);

    if ($w('#articlesRepeater') && articles.length) {
      $w('#articlesRepeater').data = articles.map(a => ({
        _id: a._id,
        title: a.title,
        slug: a.slug,
        tags: JSON.parse(a.tagsJson || '[]').join('، '),
        seasonKey: a.seasonKey,
        publishedAt: new Date(a.publishedAt).toLocaleDateString('ar-SA'),
      }));

      $w('#articlesRepeater').onItemReady(($item, itemData) => {
        $item('#articleTitle').text = itemData.title;
        if (itemData.tags) $item('#articleTags').text = itemData.tags;
        $item('#articleDate').text = itemData.publishedAt;

        // Gold accent hover
        $item('#articleCard').onMouseIn(() => {
          try { $item('#articleCard').style.borderColor = '#C9A227'; } catch (e) {}
        });
        $item('#articleCard').onMouseOut(() => {
          try { $item('#articleCard').style.borderColor = '#2A2A35'; } catch (e) {}
        });

        $item('#articleCard').onClick(() => {
          wixLocation.to(`/articles/${itemData.slug}`);
        });
      });
    }
  } catch (e) {
    console.log('Failed to load articles:', e);
  }

  // ─── Season Filter ─────────────────────────────────────
  if ($w('#articleSeasonFilter')) {
    $w('#articleSeasonFilter').options = [
      { label: 'الكل', value: '' },
      { label: 'رمضان', value: 'ramadan' },
      { label: 'الحج والعمرة', value: 'hajj' },
      { label: 'الصيف', value: 'summer' },
      { label: 'الشتاء', value: 'winter' },
    ];

    $w('#articleSeasonFilter').onChange(async (e) => {
      const seasonKey = e.target.value;
      const filtered = seasonKey
        ? await getArticles(TENANT_ID, { seasonKey })
        : await getArticles(TENANT_ID);

      if ($w('#articlesRepeater')) {
        $w('#articlesRepeater').data = filtered.map(a => ({
          _id: a._id,
          title: a.title,
          slug: a.slug,
          publishedAt: new Date(a.publishedAt).toLocaleDateString('ar-SA'),
        }));
      }
    });
  }
});
