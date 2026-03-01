/**
 * 5ATTH | خته – Master Page (Global Site Code)
 * Auto-discovery: finds elements by TYPE + CONTENT
 * Runs on every page load
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

$w.onReady(function () {

  /* =========================================================
   *  1) Dark Theme — apply to ALL sections, header, footer
   * ========================================================= */
  try {
    $w('Section').forEach(function (s) {
      try { s.style.backgroundColor = '#0E0E12'; } catch (e) {}
    });
  } catch (e) {}
  try {
    $w('Header').forEach(function (h) {
      try { h.style.backgroundColor = '#0E0E12'; } catch (e) {}
    });
  } catch (e) {}
  try {
    $w('Footer').forEach(function (f) {
      try { f.style.backgroundColor = '#0E0E12'; } catch (e) {}
    });
  } catch (e) {}

  /* =========================================================
   *  2) Translate ALL text elements on EVERY page
   * ========================================================= */
  var globalTextMap = {
    'Home': 'الرئيسية',
    'Welcome': 'أهلاً بك',
    'Blog Feed': 'المدونة',
    'Blog': 'مدونة السفر',
    'More': 'المزيد',
    'About': 'من نحن',
    'Contact': 'تواصل معنا',
    'All rights reserved': '© 5ATTH خته - جميع الحقوق محفوظة',
    'Copyright': '© 5ATTH خته',
    'Privacy Policy': 'سياسة الخصوصية',
    'Terms of Use': 'شروط الاستخدام',
    'Terms & Conditions': 'الشروط والأحكام',
    'Accessibility': 'إمكانية الوصول',
    'Get in Touch': 'تواصل معنا',
    'Follow Us': 'تابعنا',
    'Newsletter': 'النشرة البريدية',
    'Subscribe': 'اشترك',
    'Enter your email': 'أدخل بريدك',
    'Log In': 'تسجيل الدخول',
    'Sign Up': 'سجّل الآن',
    'My Account': 'حسابي',
    'Cart': 'السلة',
    'Search': 'بحث',
    'Learn More': 'اكتشف المزيد',
    'Read More': 'اقرأ المزيد',
    'View All': 'عرض الكل',
    'Book Now': 'احجز الآن',
  };

  try {
    $w('Text').forEach(function (t) {
      try {
        var original = t.text || '';
        Object.keys(globalTextMap).forEach(function (eng) {
          if (original.indexOf(eng) !== -1 && original.length < 200) {
            t.text = globalTextMap[eng];
          }
        });
      } catch (e) {}
    });
  } catch (e) {}

  /* =========================================================
   *  3) Translate ALL buttons on every page
   * ========================================================= */
  var globalBtnMap = {
    'Get Started': 'ابدأ الآن ✈️',
    'Book Now': 'احجز الآن',
    'Learn More': 'اكتشف المزيد',
    'Read More': 'اقرأ المزيد',
    'Log In': 'تسجيل الدخول',
    'Sign Up': 'سجّل الآن',
    'Subscribe': 'اشترك',
    'Submit': 'إرسال',
    'Contact Us': 'تواصل معنا',
    'View All': 'عرض الكل',
    'See All': 'عرض الكل',
    'Explore': 'استكشف',
    'Search': 'بحث',
  };

  try {
    $w('Button').forEach(function (b) {
      try {
        var lbl = b.label || '';
        Object.keys(globalBtnMap).forEach(function (eng) {
          if (lbl.indexOf(eng) !== -1) {
            b.label = globalBtnMap[eng];
          }
        });
      } catch (e) {}
    });
  } catch (e) {}

  /* =========================================================
   *  4) Update Navigation Menu
   * ========================================================= */
  try {
    $w('Menu').forEach(function (menu) {
      try {
        menu.menuItems = [
          { label: 'الرئيسية', link: '/' },
          { label: '✈️ رحلات', link: '/flights' },
          { label: '🏨 فنادق', link: '/hotels' },
          { label: '🚗 سيارات', link: '/cars' },
          { label: '🏷️ عروض', link: '/offers' },
          { label: '🌍 وجهات', link: '/destinations' },
          { label: '🗺️ جولات', link: '/tours' },
          { label: '📅 مواسم', link: '/seasons' },
          { label: '🇸🇦 السعودية', link: '/saudi-tourism' },
          { label: '📚 دراسة', link: '/study-abroad' },
          { label: '📰 أخبار', link: '/news' },
        ];
      } catch (e) {}
    });
  } catch (e) {}

  /* =========================================================
   *  5) Country / Currency Selector (by ID if exists)
   * ========================================================= */
  var savedCountry = wixWindow.storage.local.getItem('selectedCountry') || 'SA';
  var currencies = { SA: 'SAR', AE: 'AED', KW: 'KWD', QA: 'QAR', BH: 'BHD' };
  try {
    var cs = $w('#countrySelector');
    if (cs) {
      cs.value = savedCountry;
      cs.onChange(function (e) {
        wixWindow.storage.local.setItem('selectedCountry', e.target.value);
        wixWindow.storage.local.setItem('selectedCurrency', currencies[e.target.value] || 'SAR');
        wixLocation.to(wixLocation.url);
      });
    }
  } catch (e) {}

  /* =========================================================
   *  6) WhatsApp CTA (if button exists)
   * ========================================================= */
  try {
    $w('#whatsappBtn').onClick(function () {
      wixWindow.openUrl('https://wa.me/966500000000?text=أريد استشارة سفر من خته');
    });
  } catch (e) {}

  /* =========================================================
   *  7) Footer text (by ID if exists)
   * ========================================================= */
  try { $w('#footerText').text = '© 2026 5ATTH | خته - جميع الحقوق محفوظة'; } catch (e) {}
  try { $w('#footerDesc').text = 'منصتك الذكية لحجز السفر في الخليج'; } catch (e) {}
});
