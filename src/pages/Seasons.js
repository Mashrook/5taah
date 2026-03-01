/**
 * 5ATTH | خته — مواسم (Seasons Page)
 * Ramadan, Hajj/Umrah, Summer, Winter
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { getSectionContent, getCuratedOffers } from 'backend/cmsService.web';

const TENANT_ID = 'default';

$w.onReady(async function () {
  wixSeo.title = 'مواسم السفر | 5ATTH خته';
  wixSeo.description = 'استكشف عروض المواسم - رمضان، الحج والعمرة، الصيف، الشتاء. عروض حصرية لكل موسم';

  const seasons = [
    { key: 'ramadan', title: 'رمضان', icon: '🌙', color: '#C9A227' },
    { key: 'hajj', title: 'الحج والعمرة', icon: '🕋', color: '#00C853' },
    { key: 'summer', title: 'الصيف', icon: '☀️', color: '#FFB300' },
    { key: 'winter', title: 'الشتاء', icon: '❄️', color: '#00B0FF' },
  ];

  // ─── Season Cards ──────────────────────────────────────
  if ($w('#seasonsRepeater')) {
    $w('#seasonsRepeater').data = seasons.map(s => ({ _id: s.key, ...s }));

    $w('#seasonsRepeater').onItemReady(($item, itemData) => {
      $item('#seasonTitle').text = `${itemData.icon} ${itemData.title}`;
      try { $item('#seasonCard').style.backgroundColor = '#1E1E27'; } catch (e) {}

      $item('#seasonCard').onMouseIn(() => {
        try { $item('#seasonCard').style.borderColor = itemData.color; } catch (e) {}
      });
      $item('#seasonCard').onMouseOut(() => {
        try { $item('#seasonCard').style.borderColor = '#2A2A35'; } catch (e) {}
      });

      $item('#seasonCard').onClick(() => {
        wixWindow.storage.local.setItem('selectedSeason', itemData.key);
        loadSeasonOffers(itemData.key);
      });
    });
  }

  // Load default season content
  await loadSeasonOffers('ramadan');
});

async function loadSeasonOffers(seasonKey) {
  try {
    const content = await getSectionContent(TENANT_ID, 'seasons');
    const seasonContent = content.filter(c => c.slug?.includes(seasonKey));

    if ($w('#seasonContent') && seasonContent.length) {
      $w('#seasonContent').text = seasonContent[0].title;
    }

    const offers = await getCuratedOffers(TENANT_ID);
    const seasonOffers = offers.filter(o => {
      const target = JSON.parse(o.ctaTargetJson || '{}');
      return target.seasonKey === seasonKey;
    });

    if ($w('#seasonOffersRepeater') && seasonOffers.length) {
      $w('#seasonOffersRepeater').data = seasonOffers.map(o => ({
        _id: o._id,
        title: o.title,
        image: o.heroMediaId,
        ctaLabel: o.ctaLabel || 'استكشف',
      }));
    }
  } catch (e) {
    console.log('Failed to load season content:', e);
  }
}
