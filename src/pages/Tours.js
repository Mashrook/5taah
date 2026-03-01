/**
 * 5ATTH | خته — جولات (Tours & Experiences Page)
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { searchActivities } from 'backend/searchService.web';

const TENANT_ID = 'default';

$w.onReady(async function () {
  wixSeo.title = 'جولات وتجارب سياحية | 5ATTH خته';
  wixSeo.description = 'اكتشف أفضل الجولات والتجارب السياحية في الخليج والعالم. أنشطة مغامرات، ثقافة، طبيعة';

  const currency = wixWindow.storage.local.getItem('selectedCurrency') || 'SAR';

  // ─── Category Filter ───────────────────────────────────
  const categories = [
    { label: 'الكل', value: '' },
    { label: 'مغامرات', value: 'adventure' },
    { label: 'ثقافة وتاريخ', value: 'culture' },
    { label: 'طبيعة', value: 'nature' },
    { label: 'طعام', value: 'food' },
    { label: 'رياضة', value: 'sports' },
  ];

  if ($w('#categoryFilter')) {
    $w('#categoryFilter').options = categories.map(c => ({ label: c.label, value: c.value }));
  }

  // ─── City Search ───────────────────────────────────────
  if ($w('#tourCity')) {
    $w('#tourCity').onInput((e) => {
      // Debounced autocomplete
      clearTimeout(window._tourCityTimeout);
      window._tourCityTimeout = setTimeout(() => {
        // City suggestions would come from backend
      }, 300);
    });
  }

  // ─── Search ────────────────────────────────────────────
  if ($w('#searchToursBtn')) {
    $w('#searchToursBtn').onClick(async () => {
      if ($w('#loadingIndicator')) $w('#loadingIndicator').expand();

      try {
        // Get city coordinates (simplified — would need geocoding)
        const params = {
          latitude: 24.7136, // Default: Riyadh
          longitude: 46.6753,
          radius: 50,
          currency,
        };

        const result = await searchActivities(TENANT_ID, params);

        if ($w('#toursRepeater') && result.offers.length) {
          $w('#toursRepeater').data = result.offers.map(o => ({
            _id: o.providerOfferId,
            title: JSON.parse(o.tourData?.activityJson || '{}').name || 'جولة سياحية',
            price: `${o.totalAmount} ${o.currency}`,
            duration: o.tourData?.duration || '',
            image: JSON.parse(o.tourData?.activityJson || '{}').pictures?.[0] || '',
            deepLink: o.deepLinkUrl,
          }));

          $w('#toursRepeater').onItemReady(($item, itemData) => {
            $item('#tourTitle').text = itemData.title;
            $item('#tourPrice').text = itemData.price;
            if (itemData.duration) $item('#tourDuration').text = itemData.duration;
            if (itemData.image) $item('#tourImage').src = itemData.image;

            $item('#tourCard').onMouseIn(() => {
              try { $item('#tourCard').style.borderColor = '#C9A227'; } catch (e) {}
            });
            $item('#tourCard').onMouseOut(() => {
              try { $item('#tourCard').style.borderColor = '#2A2A35'; } catch (e) {}
            });
          });
        }

        if ($w('#resultsCount')) {
          $w('#resultsCount').text = `${result.count} نتيجة`;
        }
      } catch (e) {
        console.log('Tour search failed:', e);
      }

      if ($w('#loadingIndicator')) $w('#loadingIndicator').collapse();
    });
  }
});
