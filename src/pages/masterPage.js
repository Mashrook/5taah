/**
 * 5ATTH | خته — Master Page (Global Site Code)
 * Dark Mode Premium GCC Travel Platform
 * Runs on every page load
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { getFeatureFlags } from 'backend/cmsService.web';

const TENANT_ID = 'default';

$w.onReady(async function () {
  // ─── RTL + Dark Theme ──────────────────────────────────
  applyDarkTheme();

  // ─── Country/Currency Selector ─────────────────────────
  const savedCountry = wixWindow.storage.local.getItem('selectedCountry') || 'SA';
  const currencies = { SA: 'SAR', AE: 'AED', KW: 'KWD', QA: 'QAR', BH: 'BHD' };

  if ($w('#countrySelector')) {
    $w('#countrySelector').value = savedCountry;
    $w('#countrySelector').onChange((e) => {
      wixWindow.storage.local.setItem('selectedCountry', e.target.value);
      wixWindow.storage.local.setItem('selectedCurrency', currencies[e.target.value] || 'SAR');
      wixLocation.to(wixLocation.url);
    });
  }

  // ─── Navigation ────────────────────────────────────────
  const navLinks = [
    { id: '#navHome', url: '/' },
    { id: '#navOffers', url: '/offers' },
    { id: '#navSeasons', url: '/seasons' },
    { id: '#navTours', url: '/tours' },
    { id: '#navDestinations', url: '/destinations' },
    { id: '#navStudyAbroad', url: '/study-abroad' },
    { id: '#navSaudiTourism', url: '/saudi-tourism' },
    { id: '#navArticles', url: '/articles' },
    { id: '#navFlights', url: '/flights' },
    { id: '#navHotels', url: '/hotels' },
    { id: '#navCars', url: '/cars' },
  ];
  navLinks.forEach(link => {
    if ($w(link.id)) {
      $w(link.id).onClick(() => wixLocation.to(link.url));
    }
  });

  // ─── Feature Flags ─────────────────────────────────────
  try {
    const flags = await getFeatureFlags(TENANT_ID);
    if ($w('#laborImportSection') && !flags['labor_import']) {
      $w('#laborImportSection').collapse();
    }
  } catch (e) {
    console.log('Feature flags not loaded');
  }

  // ─── WhatsApp + Consultation CTAs ─────────────────────
  if ($w('#whatsappBtn')) {
    $w('#whatsappBtn').onClick(() => {
      wixWindow.openUrl('https://wa.me/966XXXXXXXXX?text=أريد استشارة سفر');
    });
  }
  if ($w('#consultBtn')) {
    $w('#consultBtn').onClick(() => {
      wixWindow.openLightbox('ConsultationForm');
    });
  }
});

function applyDarkTheme() {
  const darkElements = ['#headerStrip', '#footerStrip', '#mainContainer'];
  darkElements.forEach(selector => {
    try { if ($w(selector)) $w(selector).style.backgroundColor = '#0E0E12'; } catch (e) {}
  });
}
