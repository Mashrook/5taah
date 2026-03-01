/**
 * 5ATTH | خته — عروض (Offers Page)
 * SEO-ready with structured content
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { getCuratedOffers } from 'backend/cmsService.web';
import { searchFlights } from 'backend/searchService.web';

const TENANT_ID = 'default';

$w.onReady(async function () {
  // ─── SEO ───────────────────────────────────────────────
  wixSeo.title = 'عروض السفر | 5ATTH خته';
  wixSeo.description = 'اكتشف أفضل عروض السفر والحجز في الخليج العربي - طيران، فنادق، جولات سياحية بأسعار تنافسية';

  const currency = wixWindow.storage.local.getItem('selectedCurrency') || 'SAR';

  // ─── Load Offers ───────────────────────────────────────
  try {
    const offers = await getCuratedOffers(TENANT_ID);

    if ($w('#offersRepeater') && offers.length) {
      $w('#offersRepeater').data = offers.map(o => ({
        _id: o._id,
        title: o.title,
        image: o.heroMediaId,
        ctaLabel: o.ctaLabel || 'احجز الآن',
        segmentKey: o.segmentKey,
        priority: o.priority,
      }));

      $w('#offersRepeater').onItemReady(($item, itemData) => {
        $item('#offerTitle').text = itemData.title;
        if (itemData.image) $item('#offerImage').src = itemData.image;
        $item('#offerCta').label = itemData.ctaLabel;

        // Gold accent on hover
        $item('#offerCard').onMouseIn(() => {
          try { $item('#offerCard').style.borderColor = '#C9A227'; } catch (e) {}
        });
        $item('#offerCard').onMouseOut(() => {
          try { $item('#offerCard').style.borderColor = '#2A2A35'; } catch (e) {}
        });

        $item('#offerCta').onClick(() => {
          const offer = offers.find(o => o._id === itemData._id);
          const target = JSON.parse(offer?.ctaTargetJson || '{}');
          if (target.offerId) wixLocation.to(`/offer/${target.offerId}`);
          else wixLocation.to('/flights');
        });
      });
    }
  } catch (e) {
    console.log('Failed to load offers:', e);
  }

  // ─── Segment Filter ────────────────────────────────────
  const segments = [
    { label: 'الكل', value: '' },
    { label: 'فاخر', value: 'luxury' },
    { label: 'عائلي', value: 'family' },
    { label: 'مغامرات', value: 'adventure' },
    { label: 'حج وعمرة', value: 'hajj' },
  ];

  if ($w('#segmentFilter')) {
    $w('#segmentFilter').options = segments.map(s => ({ label: s.label, value: s.value }));
    $w('#segmentFilter').onChange(async (e) => {
      const segment = e.target.value;
      const filtered = segment
        ? await getCuratedOffers(TENANT_ID, segment)
        : await getCuratedOffers(TENANT_ID);
      if ($w('#offersRepeater')) {
        $w('#offersRepeater').data = filtered.map(o => ({
          _id: o._id,
          title: o.title,
          image: o.heroMediaId,
          ctaLabel: o.ctaLabel || 'احجز الآن',
          segmentKey: o.segmentKey,
        }));
      }
    });
  }
});
