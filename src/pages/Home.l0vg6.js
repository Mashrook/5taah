/**
 * 5ATTH | خته – Home Page
 * Comprehensive Arabic translation - no emojis
 */
import wixLocation from 'wix-location';

$w.onReady(function () {

  /* =========================================================
   *  1) COMPLETE text translation map — every English string
   * ========================================================= */
  var textMap = {
    /* Hero */
    'Travel in Style': 'سافر بأسلوبك مع خته',
    'Join us on a journey to discover exclusive travel deals across the Gulf region, tailored to your wanderlust': 'منصتك الذكية لحجز رحلات الطيران والفنادق والسيارات بأفضل الأسعار في الخليج',
    'Join us on a journey to discover exclusive travel': 'منصتك الذكية لحجز رحلات الطيران والفنادق والسيارات بأفضل الأسعار في الخليج',
    'deals across the Gulf region, tailored to your wanderlust': '',
    'deals across the Gulf region': '',
    'tailored to your wanderlust': '',

    /* Section titles */
    'Travel Insights': 'مقالات السفر',
    'Deals': 'العروض والباقات',
    'What Our Travelers Say': 'آراء المسافرين',
    'Our Offerings': 'خدماتنا',
    'Our Services': 'خدماتنا',
    'Follow Us': 'تابعنا',
    'Welcome': 'مرحبا بك في خته',
    'Explore the World': 'استكشف العالم',
    'Destinations': 'وجهات مختارة',
    'Popular Destinations': 'وجهات مختارة',
    'Latest Articles': 'أحدث المقالات',

    /* Deals / Courses section */
    'UAE Adventure': 'مغامرة الإمارات',
    'Saudi Tour': 'جولة سعودية',
    'View Course': 'عرض التفاصيل',
    'Bahrain Exploration': 'استكشاف البحرين',
    'Qatar Experience': 'تجربة قطر',
    'Kuwait City': 'مدينة الكويت',
    'Oman Discovery': 'اكتشاف عُمان',

    /* Offerings section */
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
    'Ali shared an incredible experience with 5TAAH': 'علي شاركنا تجربته الرائعة مع خته',
    'finding the best deals for his trip to Dubai': 'في الحصول على أفضل العروض لرحلته إلى دبي',
    'Fatima loved how easy it was to book her vacation in Bahrain through 5TAAH\'s seamless platform': 'فاطمة أحبت سهولة حجز إجازتها في البحرين عبر منصة خته',
    'Fatima loved how easy it was to book her vacation in Bahrain': 'فاطمة أحبت سهولة حجز إجازتها في البحرين عبر خته',
    'through 5TAAH\'s seamless platform': 'عبر منصة خته المتميزة',

    /* Blog */
    'Blog': 'مدونة السفر',
    'Blog Feed': 'المدونة',
    'Courses': 'الجولات السياحية',
    'Sustainability': 'السياحة المستدامة',

    /* General */
    'About Us': 'من نحن',
    'About': 'من نحن',
    'Contact': 'تواصل معنا',
    'Learn More': 'اكتشف المزيد',
    'Read More': 'اقرأ المزيد',
    'View All': 'عرض الكل',
    'See All': 'عرض الكل',
    'Book Now': 'احجز الآن',
    'Sign Up': 'سجّل الآن',
    'Log In': 'تسجيل الدخول',
    'Subscribe': 'اشترك الآن',
    'Newsletter': 'النشرة البريدية',
    'Enter your email': 'أدخل بريدك الإلكتروني',
    'Home': 'الرئيسية',
    'Search': 'بحث',
    'More': 'المزيد',

    /* Footer */
    'All rights reserved': 'جميع الحقوق محفوظة - 5ATTH خته',
    'Copyright': '5ATTH خته',
    'Powered and Secured by Wix': 'جميع الحقوق محفوظة - 5ATTH خته',
    'Privacy Policy': 'سياسة الخصوصية',
    'Terms of Use': 'شروط الاستخدام',
    'Terms & Conditions': 'الشروط والأحكام',
    'Terms': 'الشروط والأحكام',
    'FAQ': 'الأسئلة الشائعة',
    'Accessibility Statement': 'بيان إمكانية الوصول',
    'Refund Policy': 'سياسة الاسترداد',

    /* Footer contact - replace fake data */
    '123-456-7890': '+966 50 000 0000',
    'info@mysite.com': 'info@5atth.com',
    '500 Terry Francine Street': 'الرياض، المملكة العربية السعودية',
    '6th Floor, San Francisco': '',
    'CA 94158': '',
    '500 Terry Francine Street,': 'الرياض، المملكة العربية السعودية',
  };

  try {
    $w('Text').forEach(function (t) {
      try {
        var original = t.text || '';
        if (!original) return;

        /* Sort keys by length descending so longer matches take priority */
        var keys = Object.keys(textMap).sort(function (a, b) { return b.length - a.length; });

        keys.forEach(function (eng) {
          if (original.indexOf(eng) !== -1) {
            if (textMap[eng] === '') {
              t.text = ' ';
              try { t.collapse(); } catch (e) {}
            } else {
              t.text = textMap[eng];
            }
          }
        });
      } catch (e) {}
    });
  } catch (e) {}

  /* =========================================================
   *  2) ALL buttons — no emojis
   * ========================================================= */
  var btnMap = {
    'Get Started': { label: 'ابدأ الآن', link: '/flights' },
    'Book Now': { label: 'احجز الآن', link: '/flights' },
    'Learn More': { label: 'اكتشف المزيد', link: '/offers' },
    'Read More': { label: 'اقرأ المزيد', link: '/articles' },
    'Sign Up': { label: 'سجّل مجانا', link: null },
    'Log In': { label: 'تسجيل الدخول', link: null },
    'Subscribe': { label: 'اشترك', link: null },
    'Contact Us': { label: 'تواصل معنا', link: null },
    'View All': { label: 'عرض الكل', link: '/offers' },
    'View Course': { label: 'عرض التفاصيل', link: '/offers' },
    'See All': { label: 'عرض الكل', link: '/destinations' },
    'Explore': { label: 'استكشف', link: '/destinations' },
    'Search': { label: 'بحث', link: '/search' },
    'Submit': { label: 'إرسال', link: null },
    'Send': { label: 'إرسال', link: null },
  };

  try {
    $w('Button').forEach(function (b) {
      try {
        var lbl = b.label || '';
        var keys = Object.keys(btnMap).sort(function (a, b2) { return b2.length - a.length; });
        keys.forEach(function (eng) {
          if (lbl.indexOf(eng) !== -1) {
            b.label = btnMap[eng].label;
            if (btnMap[eng].link) {
              b.onClick(function () { wixLocation.to(btnMap[eng].link); });
            }
          }
        });
      } catch (e) {}
    });
  } catch (e) {}

  /* =========================================================
   *  3) Navigation — no emojis
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
   *  4) Translate ALL repeater content
   * ========================================================= */
  try {
    $w('Repeater').forEach(function (rep) {
      try {
        rep.forEachItem(function ($i) {
          try {
            /* Translate every text inside every repeater item */
            $i('Text').forEach(function (t) {
              try {
                var txt = t.text || '';
                if (!txt) return;

                var keys = Object.keys(textMap).sort(function (a, b) { return b.length - a.length; });
                keys.forEach(function (eng) {
                  if (txt.indexOf(eng) !== -1 && textMap[eng]) {
                    t.text = textMap[eng];
                  }
                });

                /* Author names - keep but could be Arabic */
                if (txt.indexOf('Ibrahem') !== -1) t.text = 'إبراهيم';
                if (txt.indexOf('Ibrahim') !== -1) t.text = 'إبراهيم';
              } catch (e) {}
            });

            /* Translate buttons inside repeater items */
            $i('Button').forEach(function (b) {
              try {
                var lbl = b.label || '';
                if (lbl.indexOf('View Course') !== -1) b.label = 'عرض التفاصيل';
                else if (lbl.indexOf('Read More') !== -1) b.label = 'اقرأ المزيد';
                else if (lbl.indexOf('Book') !== -1) b.label = 'احجز الآن';
                else if (lbl.indexOf('Learn') !== -1) b.label = 'المزيد';
                else if (lbl.indexOf('View') !== -1) b.label = 'عرض';
                else if (lbl.indexOf('Explore') !== -1) b.label = 'استكشف';
              } catch (e) {}
            });
          } catch (e) {}
        });
      } catch (e) {}
    });
  } catch (e) {}

  /* =========================================================
   *  5) Dark theme on all containers
   * ========================================================= */
  try { $w('Section').forEach(function (s) { try { s.style.backgroundColor = '#0E0E12'; } catch (e) {} }); } catch (e) {}
  try { $w('Header').forEach(function (h) { try { h.style.backgroundColor = '#0E0E12'; } catch (e) {} }); } catch (e) {}
  try { $w('Footer').forEach(function (f) { try { f.style.backgroundColor = '#0E0E12'; } catch (e) {} }); } catch (e) {}

  /* =========================================================
   *  6) Fallback: try known IDs — no emojis
   * ========================================================= */
  try { $w('#heroTitle').text = 'سافر بأسلوبك مع خته'; } catch (e) {}
  try { $w('#heroSubtitle').text = 'منصتك الذكية لحجز رحلات الطيران والفنادق والسيارات بأفضل الأسعار في الخليج'; } catch (e) {}
  try { $w('#getStartedBtn').label = 'ابدأ الآن'; $w('#getStartedBtn').onClick(function () { wixLocation.to('/flights'); }); } catch (e) {}
});
