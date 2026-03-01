/**
 * 5ATTH | خته — Cars Search Page
 */
import wixSeo from 'wix-seo';
import { searchActivities } from 'backend/searchService.web';

const TENANT_ID = 'default';

$w.onReady(function () {
  wixSeo.title = 'تأجير سيارات | 5ATTH خته';

  // ─── Search Handler ────────────────────────────────────
  if ($w('#carSearchBtn')) {
    $w('#carSearchBtn').onClick(async () => {
      const pickupCity = $w('#pickupCity')?.value;
      const pickupDate = $w('#pickupDate')?.value;
      const returnDate = $w('#returnDate')?.value;

      if (!pickupCity || !pickupDate || !returnDate) {
        if ($w('#carsError')) $w('#carsError').text = 'يرجى تعبئة جميع الحقول';
        return;
      }

      if ($w('#carsLoading')) $w('#carsLoading').expand();
      if ($w('#carsError')) $w('#carsError').text = '';

      try {
        // Using searchActivities as a generic search — could be extended
        const results = await searchActivities(TENANT_ID, pickupCity, pickupDate, returnDate, 1, 'SAR');
        renderCarResults(results.offers || []);
      } catch (e) {
        if ($w('#carsError')) $w('#carsError').text = `خطأ: ${e.message}`;
      }

      if ($w('#carsLoading')) $w('#carsLoading').collapse();
    });
  }

  function renderCarResults(offers) {
    if (!$w('#carsRepeater')) return;

    if (offers.length === 0) {
      if ($w('#noResults')) $w('#noResults').expand();
      $w('#carsRepeater').data = [];
      return;
    }
    if ($w('#noResults')) $w('#noResults').collapse();

    $w('#carsRepeater').data = offers.map((o, i) => ({
      _id: String(i),
      ...o,
    }));

    $w('#carsRepeater').onItemReady(($item, data) => {
      if ($item('#carName')) $item('#carName').text = data.providerOfferId || 'سيارة';
      if ($item('#carPrice')) {
        $item('#carPrice').text = `${data.totalAmount} ${data.currency}`;
        try { $item('#carPrice').style.color = '#C9A227'; } catch (e) {}
      }
      if ($item('#carProvider')) $item('#carProvider').text = data.source || '';

      if ($item('#carBookBtn')) {
        $item('#carBookBtn').onClick(() => {
          import('wix-window').then(wixWindow => {
            wixWindow.storage.local.setItem('selectedOffer', JSON.stringify(data));
          });
          import('wix-location').then(wixLocation => {
            wixLocation.to('/checkout');
          });
        });
      }
    });
  }

  // ─── Popular Cities ────────────────────────────────────
  const popularCities = [
    { name: 'الرياض', code: 'RUH' },
    { name: 'جدة', code: 'JED' },
    { name: 'الدمام', code: 'DMM' },
    { name: 'دبي', code: 'DXB' },
    { name: 'الكويت', code: 'KWI' },
  ];

  if ($w('#popularCarsRepeater')) {
    $w('#popularCarsRepeater').data = popularCities.map((c, i) => ({
      _id: String(i),
      ...c,
    }));

    $w('#popularCarsRepeater').onItemReady(($item, data) => {
      if ($item('#cityName')) $item('#cityName').text = data.name;
      if ($item('#cityBtn')) {
        $item('#cityBtn').onClick(() => {
          if ($w('#pickupCity')) $w('#pickupCity').value = data.code;
        });
      }
    });
  }
});
