/**
 * 5ATTH | خته – Master Page (Global Site Code)
 * Runs on every page load – RTL, dark theme, navigation
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

function el(id) { try { return $w(id); } catch (e) { return null; } }
function setText(id, txt) { try { var e = el(id); if (e) e.text = txt; } catch (e) {} }
function setLabel(id, txt) { try { var e = el(id); if (e) e.label = txt; } catch (e) {} }
function btn(id, fn) { try { var e = el(id); if (e) e.onClick(fn); } catch (e) {} }

$w.onReady(function () {
  /* ——— Dark Theme ——————————————————— */
  var darkSections = ['#headerStrip', '#footerStrip', '#mainContainer', '#header1', '#footer1'];
  darkSections.forEach(function (s) {
    try { if (el(s)) el(s).style.backgroundColor = '#0E0E12'; } catch (e) {}
  });

  /* ——— Country / Currency ——————————————————— */
  var savedCountry = wixWindow.storage.local.getItem('selectedCountry') || 'SA';
  var currencies = { SA: 'SAR', AE: 'AED', KW: 'KWD', QA: 'QAR', BH: 'BHD' };
  try {
    var cs = el('#countrySelector');
    if (cs) {
      cs.value = savedCountry;
      cs.onChange(function (e) {
        wixWindow.storage.local.setItem('selectedCountry', e.target.value);
        wixWindow.storage.local.setItem('selectedCurrency', currencies[e.target.value] || 'SAR');
        wixLocation.to(wixLocation.url);
      });
    }
  } catch (e) {}

  /* ——— Navigation Links ——————————————————— */
  var navLinks = [
    { id: '#navHome', url: '/' },
    { id: '#navFlights', url: '/flights' },
    { id: '#navHotels', url: '/hotels' },
    { id: '#navCars', url: '/cars' },
    { id: '#navOffers', url: '/offers' },
    { id: '#navSeasons', url: '/seasons' },
    { id: '#navTours', url: '/tours' },
    { id: '#navDestinations', url: '/destinations' },
    { id: '#navStudyAbroad', url: '/study-abroad' },
    { id: '#navSaudiTourism', url: '/saudi-tourism' },
    { id: '#navArticles', url: '/articles' },
    { id: '#navNews', url: '/news' },
  ];
  navLinks.forEach(function (link) {
    btn(link.id, function () { wixLocation.to(link.url); });
  });

  /* ——— WhatsApp CTA ——————————————————— */
  btn('#whatsappBtn', function () {
    wixWindow.openUrl('https://wa.me/966500000000?text=أريد استشارة سفر من خته');
  });

  /* ——— Footer Text ——————————————————— */
  setText('#footerText', '© 2026 5ATTH | خته - جميع الحقوق محفوظة');
  setText('#footerDesc', 'منصتك الذكية لحجز السفر في الخليج');
});
