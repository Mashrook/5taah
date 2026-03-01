/**
 * 5ATTH | خته — السياحة في السعودية (Saudi Tourism / Vision 2030)
 */
import wixSeo from 'wix-seo';
import wixLocation from 'wix-location';
import { getSectionContent, getCuratedOffers } from 'backend/cmsService.web';

const TENANT_ID = 'default';

$w.onReady(async function () {
  wixSeo.title = 'السياحة في السعودية | رؤية 2030 | 5ATTH خته';
  wixSeo.description = 'اكتشف جمال المملكة العربية السعودية - العلا، نيوم، الدرعية، جدة التاريخية، الرياض وأكثر. تجارب سياحية فريدة';

  // ─── Saudi Tourism Sections ────────────────────────────
  const highlights = [
    { key: 'alula', title: 'العلا', desc: 'تجربة تاريخية فريدة في قلب الحضارات القديمة' },
    { key: 'neom', title: 'نيوم', desc: 'مدينة المستقبل على ساحل البحر الأحمر' },
    { key: 'diriyah', title: 'الدرعية', desc: 'بوابة تاريخ الدولة السعودية الأولى' },
    { key: 'jeddah', title: 'جدة التاريخية', desc: 'عبق التاريخ وروعة البحر الأحمر' },
    { key: 'riyadh', title: 'الرياض', desc: 'العاصمة النابضة بالحياة والفعاليات العالمية' },
    { key: 'aseer', title: 'عسير', desc: 'طبيعة خلابة ومناخ معتدل على مدار العام' },
  ];

  if ($w('#saudiRepeater')) {
    $w('#saudiRepeater').data = highlights.map(h => ({ _id: h.key, ...h }));

    $w('#saudiRepeater').onItemReady(($item, itemData) => {
      $item('#saudiTitle').text = itemData.title;
      $item('#saudiDesc').text = itemData.desc;

      // Gold hover effect
      $item('#saudiCard').onMouseIn(() => {
        try { $item('#saudiCard').style.borderColor = '#C9A227'; } catch (e) {}
      });
      $item('#saudiCard').onMouseOut(() => {
        try { $item('#saudiCard').style.borderColor = '#2A2A35'; } catch (e) {}
      });

      $item('#saudiCard').onClick(() => {
        wixLocation.to(`/saudi-tourism/${itemData.key}`);
      });
    });
  }

  // ─── Load CMS Content ──────────────────────────────────
  try {
    const content = await getSectionContent(TENANT_ID, 'saudi_tourism');
    if ($w('#saudiContent') && content.length) {
      $w('#saudiContent').html = content[0].contentRichText || '';
    }

    const offers = await getCuratedOffers(TENANT_ID, 'saudi');
    if ($w('#saudiOffersRepeater') && offers.length) {
      $w('#saudiOffersRepeater').data = offers.map(o => ({
        _id: o._id,
        title: o.title,
        image: o.heroMediaId,
        ctaLabel: o.ctaLabel || 'احجز تجربتك',
      }));
    }
  } catch (e) {
    console.log('Failed to load Saudi tourism content:', e);
  }
});
