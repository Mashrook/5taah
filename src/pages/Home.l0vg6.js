/**
 * 5ATTH | خته – Home Page
 * Auto-discovery: finds elements by TYPE + CONTENT, no IDs needed
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

const ACCENT = '#C9A227';

$w.onReady(function () {

  /* =========================================================
   *  1) Replace ALL text elements by matching English content
   * ========================================================= */
  var textMap = {
    'Travel in Style': 'سافر بأسلوبك مع خته ✈️',
    'Join us on a journey to discover exclusive travel': 'منصتك الذكية لحجز رحلات الطيران والفنادق والسيارات بأفضل الأسعار في الخليج',
    'deals across the Gulf region': '',
    'tailored to your wanderlust': '',
    'Welcome': 'أهلاً بك في خته',
    'Explore the World': 'استكشف العالم',
    'Our Services': '✈️ خدماتنا',
    'Destinations': '🌍 وجهات مختارة',
    'Popular Destinations': '🌍 وجهات مختارة',
    'Latest Articles': '📰 أحدث المقالات',
    'Blog': '📰 مدونة السفر',
    'Courses': '📚 الدراسة في الخارج',
    'Sustainability': '🌿 السياحة المستدامة',
    'About Us': 'من نحن',
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
    'All rights reserved': 'جميع الحقوق محفوظة © 5ATTH خته',
    'Copyright': '© 5ATTH خته',
    'Privacy Policy': 'سياسة الخصوصية',
    'Terms': 'الشروط والأحكام',
    'FAQ': 'الأسئلة الشائعة',
  };

  try {
    $w('Text').forEach(function (t) {
      try {
        var original = t.text || '';
        /* Exact or partial match */
        Object.keys(textMap).forEach(function (eng) {
          if (original.indexOf(eng) !== -1 && textMap[eng]) {
            t.text = textMap[eng];
          }
        });
        /* Style: make gold accent on price-like or heading text */
        if (t.text && (t.text.indexOf('ر.س') !== -1 || t.text.indexOf('SAR') !== -1)) {
          t.style.color = ACCENT;
        }
      } catch (e) {}
    });
  } catch (e) {}

  /* =========================================================
   *  2) Replace ALL buttons
   * ========================================================= */
  var btnMap = {
    'Get Started': { label: 'ابدأ الآن ✈️', link: '/flights' },
    'Book Now': { label: 'احجز الآن', link: '/flights' },
    'Learn More': { label: 'اكتشف المزيد', link: '/offers' },
    'Read More': { label: 'اقرأ المزيد', link: '/articles' },
    'Sign Up': { label: 'سجّل مجاناً', link: '/register' },
    'Log In': { label: 'تسجيل الدخول', link: '/login' },
    'Subscribe': { label: 'اشترك', link: null },
    'Contact Us': { label: 'تواصل معنا', link: '/contact' },
    'View All': { label: 'عرض الكل', link: '/offers' },
    'See All': { label: 'عرض الكل', link: '/destinations' },
    'Explore': { label: 'استكشف', link: '/destinations' },
    'Search': { label: '🔍 بحث', link: '/search' },
    'Submit': { label: 'إرسال', link: null },
  };

  try {
    $w('Button').forEach(function (b) {
      try {
        var lbl = b.label || '';
        Object.keys(btnMap).forEach(function (eng) {
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
   *  3) Replace navigation menu items
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
          { label: '📰 مقالات', link: '/articles' },
        ];
      } catch (e) {}
    });
  } catch (e) {}

  /* =========================================================
   *  4) Update Repeaters if they exist (any ID)
   * ========================================================= */
  try {
    $w('Repeater').forEach(function (rep, idx) {
      try {
        if (idx === 0) {
          /* First repeater → services or featured */
          rep.forEachItem(function ($i) {
            try {
              $i('Text').forEach(function (t) {
                var txt = t.text || '';
                if (txt.indexOf('Flight') !== -1 || txt.indexOf('flight') !== -1) t.text = '✈️ رحلات الطيران';
                else if (txt.indexOf('Hotel') !== -1 || txt.indexOf('hotel') !== -1) t.text = '🏨 حجز الفنادق';
                else if (txt.indexOf('Car') !== -1 || txt.indexOf('car') !== -1) t.text = '🚗 تأجير سيارات';
                else if (txt.indexOf('Tour') !== -1 || txt.indexOf('tour') !== -1) t.text = '🎯 جولات سياحية';
                else if (txt.indexOf('Activity') !== -1 || txt.indexOf('activity') !== -1) t.text = '🎯 أنشطة وتجارب';
              });
            } catch (e) {}
          });
        }
      } catch (e) {}
    });
  } catch (e) {}

  /* =========================================================
   *  5) Update page background / section styles
   * ========================================================= */
  try {
    $w('Section').forEach(function (sec) {
      try {
        sec.style.backgroundColor = '#0E0E12';
      } catch (e) {}
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
   *  6) Also try by known IDs (if user assigns them later)
   * ========================================================= */
  try { $w('#heroTitle').text = 'سافر بأسلوبك مع خته ✈️'; } catch (e) {}
  try { $w('#heroSubtitle').text = 'منصتك الذكية لحجز رحلات الطيران والفنادق والسيارات بأفضل الأسعار في الخليج'; } catch (e) {}
  try { $w('#getStartedBtn').label = 'ابدأ الآن ✈️'; $w('#getStartedBtn').onClick(function () { wixLocation.to('/flights'); }); } catch (e) {}
});
