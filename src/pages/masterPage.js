/**
 * 5ATTH | خته – Master Page (Global Site Code)
 * Comprehensive Arabic translation on every page - no emojis
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

$w.onReady(function () {

  /* =========================================================
   *  1) Dark Theme on ALL containers
   * ========================================================= */
  try { $w('Section').forEach(function (s) { try { s.style.backgroundColor = '#0E0E12'; } catch (e) {} }); } catch (e) {}
  try { $w('Header').forEach(function (h) { try { h.style.backgroundColor = '#0E0E12'; } catch (e) {} }); } catch (e) {}
  try { $w('Footer').forEach(function (f) { try { f.style.backgroundColor = '#0E0E12'; } catch (e) {} }); } catch (e) {}

  /* =========================================================
   *  2) FULL translation map for ALL text on EVERY page
   * ========================================================= */
  var map = {
    /* Navigation */
    'Home': 'الرئيسية',
    'Welcome': 'مرحبا بك',
    'Blog Feed': 'المدونة',
    'Blog': 'مدونة السفر',
    'More': 'المزيد',
    'About': 'من نحن',
    'About Us': 'من نحن',
    'Contact': 'تواصل معنا',
    'Contact Us': 'تواصل معنا',

    /* Sections */
    'Travel Insights': 'مقالات السفر',
    'Deals': 'العروض والباقات',
    'What Our Travelers Say': 'آراء المسافرين',
    'Our Offerings': 'خدماتنا',
    'Our Services': 'خدماتنا',
    'Follow Us': 'تابعنا',
    'Explore the World': 'استكشف العالم',
    'Destinations': 'وجهات مختارة',
    'Popular Destinations': 'وجهات مختارة',
    'Latest Articles': 'أحدث المقالات',
    'Courses': 'الجولات السياحية',
    'Sustainability': 'السياحة المستدامة',

    /* Deals content */
    'UAE Adventure': 'مغامرة الإمارات',
    'Saudi Tour': 'جولة سعودية',
    'Bahrain Exploration': 'استكشاف البحرين',
    'Qatar Experience': 'تجربة قطر',

    /* Offerings */
    'Exclusive Packages': 'باقات حصرية',
    'Our exclusive travel packages provide incredible value for your adventures, making it easier to explore the Gulf\'s top destinations': 'باقات سفر حصرية بقيمة استثنائية تسهل عليك استكشاف أفضل الوجهات في الخليج',
    'Our exclusive travel packages provide incredible value for your adventures': 'باقات سفر حصرية بقيمة استثنائية لمغامراتك',
    'making it easier to explore the Gulf\'s top destinations': 'تسهل عليك استكشاف أفضل الوجهات في الخليج',
    'Personalized Service': 'خدمة مخصصة',
    'We are dedicated to offering personalized service to ensure you find exactly what you wish for in your travels': 'نحرص على تقديم خدمة مخصصة لنضمن لك العثور على ما تبحث عنه في رحلاتك',
    'We are dedicated to offering personalized service': 'نحرص على تقديم خدمة مخصصة لضمان راحتك',
    'to ensure you find exactly what you wish for in your travels': 'لنضمن لك العثور على ما تبحث عنه',

    /* Testimonials */
    'Ali shared an incredible experience with 5TAAH, finding the best deals for his trip to Dubai': 'علي شاركنا تجربته الرائعة مع خته في الحصول على أفضل العروض لرحلته إلى دبي',
    'Ali shared an incredible experience with 5TAAH': 'شاركنا تجربته الرائعة مع خته',
    'finding the best deals for his trip to Dubai': 'في الحصول على أفضل العروض لرحلته إلى دبي',
    'Fatima loved how easy it was to book her vacation in Bahrain through 5TAAH\'s seamless platform': 'فاطمة أحبت سهولة حجز إجازتها في البحرين عبر منصة خته',
    'Fatima loved how easy it was to book her vacation in Bahrain': 'أحبت سهولة حجز إجازتها في البحرين عبر خته',
    'through 5TAAH\'s seamless platform': 'عبر منصة خته المتميزة',

    /* General actions */
    'Learn More': 'اكتشف المزيد',
    'Read More': 'اقرأ المزيد',
    'View All': 'عرض الكل',
    'See All': 'عرض الكل',
    'Book Now': 'احجز الآن',
    'Sign Up': 'سجّل الآن',
    'Log In': 'تسجيل الدخول',
    'Subscribe': 'اشترك',
    'Newsletter': 'النشرة البريدية',
    'Enter your email': 'أدخل بريدك الإلكتروني',
    'Search': 'بحث',
    'My Account': 'حسابي',
    'Cart': 'السلة',
    'Get in Touch': 'تواصل معنا',

    /* Footer */
    'All rights reserved': 'جميع الحقوق محفوظة - 5ATTH خته',
    'Copyright': '5ATTH خته',
    'Powered and Secured by Wix': 'جميع الحقوق محفوظة - 5ATTH خته',
    'Privacy Policy': 'سياسة الخصوصية',
    'Terms of Use': 'شروط الاستخدام',
    'Terms & Conditions': 'الشروط والأحكام',
    'Accessibility': 'إمكانية الوصول',
    'Accessibility Statement': 'بيان إمكانية الوصول',
    'Refund Policy': 'سياسة الاسترداد',

    /* Footer contact info - replace fake US data */
    '123-456-7890': '+966 50 000 0000',
    'info@mysite.com': 'info@5atth.com',
    '500 Terry Francine Street': 'الرياض، المملكة العربية السعودية',
    '500 Terry Francine Street,': 'الرياض، المملكة العربية السعودية',
    '6th Floor, San Francisco': '',
    'CA 94158': '',
    'San Francisco': '',
  };

  /* Apply to ALL text elements */
  try {
    $w('Text').forEach(function (t) {
      try {
        var original = t.text || '';
        if (!original) return;
        var keys = Object.keys(map).sort(function (a, b) { return b.length - a.length; });
        keys.forEach(function (eng) {
          if (original.indexOf(eng) !== -1) {
            if (map[eng] === '') {
              t.text = ' ';
              try { t.collapse(); } catch (e) {}
            } else {
              t.text = map[eng];
            }
          }
        });
      } catch (e) {}
    });
  } catch (e) {}

  /* =========================================================
   *  3) Translate ALL buttons — no emojis
   * ========================================================= */
  var btnMap = {
    'Get Started': 'ابدأ الآن',
    'Book Now': 'احجز الآن',
    'Learn More': 'اكتشف المزيد',
    'Read More': 'اقرأ المزيد',
    'Log In': 'تسجيل الدخول',
    'Sign Up': 'سجّل الآن',
    'Subscribe': 'اشترك',
    'Submit': 'إرسال',
    'Send': 'إرسال',
    'Contact Us': 'تواصل معنا',
    'View All': 'عرض الكل',
    'View Course': 'عرض التفاصيل',
    'See All': 'عرض الكل',
    'Explore': 'استكشف',
    'Search': 'بحث',
  };

  try {
    $w('Button').forEach(function (b) {
      try {
        var lbl = b.label || '';
        var keys = Object.keys(btnMap).sort(function (a, b2) { return b2.length - a.length; });
        keys.forEach(function (eng) {
          if (lbl.indexOf(eng) !== -1) {
            b.label = btnMap[eng];
          }
        });
      } catch (e) {}
    });
  } catch (e) {}

  /* =========================================================
   *  4) Translate ALL repeater item content
   * ========================================================= */
  try {
    $w('Repeater').forEach(function (rep) {
      try {
        rep.forEachItem(function ($i) {
          try {
            $i('Text').forEach(function (t) {
              try {
                var txt = t.text || '';
                if (!txt) return;
                var keys = Object.keys(map).sort(function (a, b) { return b.length - a.length; });
                keys.forEach(function (eng) {
                  if (txt.indexOf(eng) !== -1 && map[eng]) {
                    t.text = map[eng];
                  }
                });
                if (txt.indexOf('Ibrahem') !== -1) t.text = 'إبراهيم';
                if (txt.indexOf('Ibrahim') !== -1) t.text = 'إبراهيم';
              } catch (e) {}
            });
            $i('Button').forEach(function (b) {
              try {
                var lbl = b.label || '';
                if (lbl.indexOf('View Course') !== -1) b.label = 'عرض التفاصيل';
                else if (lbl.indexOf('Read More') !== -1) b.label = 'اقرأ المزيد';
                else if (lbl.indexOf('Book') !== -1) b.label = 'احجز الآن';
                else if (lbl.indexOf('Learn') !== -1) b.label = 'المزيد';
                else if (lbl.indexOf('View') !== -1) b.label = 'عرض';
              } catch (e) {}
            });
          } catch (e) {}
        });
      } catch (e) {}
    });
  } catch (e) {}

  /* =========================================================
   *  5) Navigation Menu — no emojis
   * ========================================================= */
  try {
    $w('Menu').forEach(function (menu) {
      try {
        menu.menuItems = [
          { label: 'الرئيسية', link: '/' },
          { label: 'رحلات', link: '/flights' },
          { label: 'فنادق', link: '/hotels' },
          { label: 'سيارات', link: '/cars' },
          { label: 'عروض', link: '/offers' },
          { label: 'وجهات', link: '/destinations' },
          { label: 'جولات', link: '/tours' },
          { label: 'مواسم', link: '/seasons' },
          { label: 'السعودية', link: '/saudi-tourism' },
          { label: 'دراسة', link: '/study-abroad' },
          { label: 'مقالات', link: '/articles' },
        ];
      } catch (e) {}
    });
  } catch (e) {}

  /* =========================================================
   *  6) Country / Currency Selector
   * ========================================================= */
  try {
    var storage = (wixWindow && wixWindow.storage) ? wixWindow.storage.local : null;
    var savedCountry = storage ? (storage.getItem('selectedCountry') || 'SA') : 'SA';
    var currencies = { SA: 'SAR', AE: 'AED', KW: 'KWD', QA: 'QAR', BH: 'BHD' };
    var cs = $w('#countrySelector');
    if (cs) {
      cs.value = savedCountry;
      cs.onChange(function (e) {
        try {
          if (storage) {
            storage.setItem('selectedCountry', e.target.value);
            storage.setItem('selectedCurrency', currencies[e.target.value] || 'SAR');
          }
          wixLocation.to(wixLocation.url);
        } catch (err) {}
      });
    }
  } catch (e) {}

  /* =========================================================
   *  7) Footer text (by ID if exists)
   * ========================================================= */
  try { $w('#footerText').text = '© 2026 5ATTH | خته - جميع الحقوق محفوظة'; } catch (e) {}
  try { $w('#footerDesc').text = 'منصتك الذكية لحجز السفر في الخليج'; } catch (e) {}
});
