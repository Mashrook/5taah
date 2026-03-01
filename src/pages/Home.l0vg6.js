/**
 * 5ATTH | خته — Home Page
 * Premium GCC Travel Platform — Dark Mode
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { searchFlights, searchHotels } from 'backend/searchService.web';
import { getCuratedOffers, getArticles, getSectionContent } from 'backend/cmsService.web';

const TENANT_ID = 'default';

$w.onReady(async function () {
  // ─── Hero Search Tabs ──────────────────────────────────
  setupSearchTabs();

  // ─── Load Dynamic Content ──────────────────────────────
  await Promise.all([
    loadCuratedOffers(),
    loadSeasonCards(),
    loadDestinations(),
    loadArticles(),
  ]);

  // ─── Search Button ────────────────────────────────────
  if ($w('#searchBtn')) {
    $w('#searchBtn').onClick(() => handleSearch());
  }
});

// ─── Search Tabs: Flights / Hotels / Cars / Tours ────────
function setupSearchTabs() {
  const tabs = ['#tabFlights', '#tabHotels', '#tabCars', '#tabTours'];
  const panels = ['#panelFlights', '#panelHotels', '#panelCars', '#panelTours'];

  tabs.forEach((tab, index) => {
    if ($w(tab)) {
      $w(tab).onClick(() => {
        tabs.forEach((t, i) => {
          try {
            if ($w(t)) $w(t).style.backgroundColor = i === index ? '#C9A227' : '#1E1E27';
            if ($w(panels[i])) {
              if (i === index) $w(panels[i]).expand();
              else $w(panels[i]).collapse();
            }
          } catch (e) {}
        });
      });
    }
  });
}

async function handleSearch() {
  const currency = wixWindow.storage.local.getItem('selectedCurrency') || 'SAR';
  const activeTab = wixWindow.storage.local.getItem('activeSearchTab') || 'flights';

  if (activeTab === 'flights') {
    const params = {
      origin: $w('#flightFrom')?.value || '',
      destination: $w('#flightTo')?.value || '',
      departDate: $w('#flightDepart')?.value || '',
      returnDate: $w('#flightReturn')?.value || '',
      adults: parseInt($w('#flightAdults')?.value) || 1,
      cabin: $w('#flightCabin')?.value || 'ECONOMY',
      currency,
    };
    wixWindow.storage.local.setItem('searchParams', JSON.stringify(params));
    wixLocation.to('/flights');
  } else if (activeTab === 'hotels') {
    const params = {
      cityCode: $w('#hotelCity')?.value || '',
      checkInDate: $w('#hotelCheckIn')?.value || '',
      checkOutDate: $w('#hotelCheckOut')?.value || '',
      adults: parseInt($w('#hotelGuests')?.value) || 1,
      currency,
    };
    wixWindow.storage.local.setItem('searchParams', JSON.stringify(params));
    wixLocation.to('/hotels');
  } else if (activeTab === 'cars') {
    wixLocation.to('/cars');
  } else if (activeTab === 'tours') {
    wixLocation.to('/tours');
  }
}

// ─── Dynamic Content Loaders ─────────────────────────────

async function loadCuratedOffers() {
  try {
    const offers = await getCuratedOffers(TENANT_ID);
    if ($w('#offersRepeater') && offers.length) {
      $w('#offersRepeater').data = offers.map(o => ({
        _id: o._id,
        title: o.title,
        image: o.heroMediaId,
        ctaLabel: o.ctaLabel || 'احجز الآن',
        segmentKey: o.segmentKey,
      }));

      $w('#offersRepeater').onItemReady(($item, itemData) => {
        $item('#offerTitle').text = itemData.title;
        if (itemData.image) $item('#offerImage').src = itemData.image;
        $item('#offerCta').label = itemData.ctaLabel;
        $item('#offerCta').onClick(() => {
          const target = JSON.parse(offers.find(o => o._id === itemData._id)?.ctaTargetJson || '{}');
          if (target.offerId) wixLocation.to(`/offer/${target.offerId}`);
          else if (target.searchParams) {
            wixWindow.storage.local.setItem('searchParams', JSON.stringify(target.searchParams));
            wixLocation.to('/flights');
          }
        });
      });
    }
  } catch (e) {
    console.log('Failed to load offers:', e);
  }
}

async function loadSeasonCards() {
  try {
    const seasons = await getSectionContent(TENANT_ID, 'seasons');
    if ($w('#seasonsRepeater') && seasons.length) {
      $w('#seasonsRepeater').data = seasons.map(s => ({
        _id: s._id,
        title: s.title,
        image: s.heroMediaId,
        slug: s.slug,
      }));

      $w('#seasonsRepeater').onItemReady(($item, itemData) => {
        $item('#seasonTitle').text = itemData.title;
        if (itemData.image) $item('#seasonImage').src = itemData.image;
        $item('#seasonCard').onClick(() => wixLocation.to(`/seasons/${itemData.slug}`));
      });
    }
  } catch (e) {
    console.log('Failed to load seasons:', e);
  }
}

async function loadDestinations() {
  try {
    const destinations = await getSectionContent(TENANT_ID, 'destinations');
    if ($w('#destinationsRepeater') && destinations.length) {
      $w('#destinationsRepeater').data = destinations.map(d => ({
        _id: d._id,
        title: d.title,
        image: d.heroMediaId,
        slug: d.slug,
      }));

      $w('#destinationsRepeater').onItemReady(($item, itemData) => {
        $item('#destTitle').text = itemData.title;
        if (itemData.image) $item('#destImage').src = itemData.image;
        $item('#destCard').onClick(() => wixLocation.to(`/destinations/${itemData.slug}`));
      });
    }
  } catch (e) {
    console.log('Failed to load destinations:', e);
  }
}

async function loadArticles() {
  try {
    const articles = await getArticles(TENANT_ID, { limit: 3 });
    if ($w('#articlesRepeater') && articles.length) {
      $w('#articlesRepeater').data = articles.map(a => ({
        _id: a._id,
        title: a.title,
        slug: a.slug,
        seasonKey: a.seasonKey,
      }));

      $w('#articlesRepeater').onItemReady(($item, itemData) => {
        $item('#articleTitle').text = itemData.title;
        $item('#articleCard').onClick(() => wixLocation.to(`/articles/${itemData.slug}`));
      });
    }
  } catch (e) {
    console.log('Failed to load articles:', e);
  }
}
