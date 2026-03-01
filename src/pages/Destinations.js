/**
 * 5ATTH | خته — وجهات (Curated Destinations Page)
 */
import wixSeo from 'wix-seo';
import wixLocation from 'wix-location';
import { getSectionContent } from 'backend/cmsService.web';

const TENANT_ID = 'default';

$w.onReady(async function () {
  wixSeo.title = 'وجهات مختارة | 5ATTH خته';
  wixSeo.description = 'وجهات سفر مختارة بعناية لك - أفضل الأماكن السياحية في العالم مع عروض وباقات حصرية';

  try {
    const destinations = await getSectionContent(TENANT_ID, 'destinations');

    if ($w('#destinationsRepeater') && destinations.length) {
      $w('#destinationsRepeater').data = destinations.map(d => ({
        _id: d._id,
        title: d.title,
        image: d.heroMediaId,
        slug: d.slug,
        description: d.contentRichText?.substring(0, 120) || '',
      }));

      $w('#destinationsRepeater').onItemReady(($item, itemData) => {
        $item('#destTitle').text = itemData.title;
        if (itemData.image) $item('#destImage').src = itemData.image;
        if (itemData.description) $item('#destDesc').text = itemData.description;

        // Gold glow hover
        $item('#destCard').onMouseIn(() => {
          try {
            $item('#destCard').style.borderColor = '#C9A227';
            $item('#destCard').style.boxShadow = '0 0 20px rgba(201, 162, 39, 0.15)';
          } catch (e) {}
        });
        $item('#destCard').onMouseOut(() => {
          try {
            $item('#destCard').style.borderColor = '#2A2A35';
            $item('#destCard').style.boxShadow = 'none';
          } catch (e) {}
        });

        $item('#destCard').onClick(() => {
          wixLocation.to(`/destinations/${itemData.slug}`);
        });
      });
    }
  } catch (e) {
    console.log('Failed to load destinations:', e);
  }

  // ─── Country Filter ────────────────────────────────────
  if ($w('#countryFilter')) {
    $w('#countryFilter').onChange(async (e) => {
      const country = e.target.value;
      const all = await getSectionContent(TENANT_ID, 'destinations');
      const filtered = country ? all.filter(d => d.slug?.includes(country.toLowerCase())) : all;
      if ($w('#destinationsRepeater')) {
        $w('#destinationsRepeater').data = filtered.map(d => ({
          _id: d._id,
          title: d.title,
          image: d.heroMediaId,
          slug: d.slug,
        }));
      }
    });
  }
});
