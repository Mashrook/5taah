/**
 * 5ATTH | خته — Blog Article Dynamic Page (/blog/{slug})
 * Uses dynamic dataset bound to Articles collection
 */
import wixSeo from 'wix-seo';
import wixLocation from 'wix-location';
import wixData from 'wix-data';
import { getArticleBySlug } from 'backend/cmsService.web';

const TENANT_ID = 'default';

$w.onReady(async function () {
  const slug = wixLocation.path[1]; // /blog/{slug}

  if (!slug) {
    wixLocation.to('/blog');
    return;
  }

  if ($w('#articleLoading')) $w('#articleLoading').expand();

  try {
    const article = await getArticleBySlug(TENANT_ID, slug);

    if (!article) {
      if ($w('#articleNotFound')) $w('#articleNotFound').expand();
      if ($w('#articleLoading')) $w('#articleLoading').collapse();
      return;
    }

    // SEO
    wixSeo.title = article.seoTitle || article.title || 'مقال | 5ATTH';
    if (article.seoDescription) {
      wixSeo.metaTags = [{ name: 'description', content: article.seoDescription }];
    }

    // Title
    if ($w('#articleTitle')) {
      $w('#articleTitle').text = article.title;
      try { $w('#articleTitle').style.color = '#F5F5F7'; } catch (e) {}
    }

    // Date
    if ($w('#articleDate')) {
      const date = article.publishedAt ? new Date(article.publishedAt) : new Date(article._createdDate);
      $w('#articleDate').text = date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    // Tags
    if ($w('#articleTags')) {
      $w('#articleTags').text = article.tags || '';
      try { $w('#articleTags').style.color = '#C9A227'; } catch (e) {}
    }

    // Season badge
    if ($w('#articleSeason') && article.seasonKey) {
      const seasonLabels = { ramadan: 'رمضان', hajj: 'الحج', summer: 'الصيف', winter: 'الشتاء' };
      $w('#articleSeason').text = seasonLabels[article.seasonKey] || article.seasonKey;
      $w('#articleSeason').expand();
    }

    // Content (rich text)
    if ($w('#articleContent')) {
      $w('#articleContent').html = article.content || article.bodyHtml || '';
    }

    // Share buttons
    const pageUrl = wixLocation.url;
    if ($w('#shareWhatsApp')) {
      $w('#shareWhatsApp').onClick(() => {
        import('wix-window').then(wixWindow => {
          wixWindow.openUrl(`https://wa.me/?text=${encodeURIComponent(article.title + ' ' + pageUrl)}`);
        });
      });
    }
    if ($w('#shareTwitter')) {
      $w('#shareTwitter').onClick(() => {
        import('wix-window').then(wixWindow => {
          wixWindow.openUrl(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(pageUrl)}`);
        });
      });
    }

    // ─── Related Articles ────────────────────────────────
    try {
      const related = await wixData.query('Articles')
        .ne('slug', slug)
        .eq('seasonKey', article.seasonKey || '')
        .limit(3)
        .descending('publishedAt')
        .find();

      if ($w('#relatedRepeater') && related.items.length) {
        $w('#relatedRepeater').data = related.items.map((a, i) => ({ _id: String(i), ...a }));
        $w('#relatedRepeater').onItemReady(($item, data) => {
          if ($item('#relatedTitle')) $item('#relatedTitle').text = data.title || '';
          if ($item('#relatedDate')) {
            $item('#relatedDate').text = new Date(data.publishedAt || data._createdDate).toLocaleDateString('ar-SA');
          }
          if ($item('#relatedLink')) {
            $item('#relatedLink').onClick(() => wixLocation.to(`/blog/${data.slug}`));
          }
        });
      }
    } catch (e) {
      console.log('Related articles error:', e);
    }

  } catch (e) {
    if ($w('#articleError')) {
      $w('#articleError').text = `خطأ: ${e.message}`;
      $w('#articleError').expand();
    }
  }

  if ($w('#articleLoading')) $w('#articleLoading').collapse();
});
