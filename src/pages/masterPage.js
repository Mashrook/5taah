/**
 * 5ATTH | خته – Master Page (Global Site Code)
 * Comprehensive Arabic translation on every page
 * Uses delayed sweeps to catch async Wix app widgets (Blog, Pricing Plans, etc.)
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

$w.onReady(function () {

  /* ==========  FULL TRANSLATION MAP  ========== */
  var map = {
    /* ----- Blog post titles (from Wix Blog app) ----- */
    'The Importance of Sustainable Living in Today\'s World': 'أهمية السياحة المستدامة في عالمنا اليوم',
    'The Art of Crafting Engaging Blog Posts': 'فن التخطيط لرحلة سفر مميزة',
    'Sustainable living is no longer just a trend; it has become a necessity': 'السياحة المستدامة لم تعد مجرد توجه بل أصبحت ضرورة',
    'Creating engaging blog posts is both an art and a science': 'التخطيط لرحلة ناجحة يجمع بين الفن والعلم',
    'In an era where climate change and environmental degradation are pressing issues': 'في عصر التحديات البيئية والتغيرات المناخية',
    'Sustainable living is no longer just a trend': 'السياحة المستدامة ليست مجرد توجه',
    'it has become a necessity': 'بل أصبحت ضرورة',
    'As we face the realities of climate change': 'في ظل التحديات البيئية',
    'resource depletion, and environmental degradation': 'واستنزاف الموارد الطبيعية',
    'the need for a lifestyle that minimizes our ecological footprint is more pressing than ev': 'الحاجة لأسلوب حياة يحافظ على البيئة أصبحت ملحة أكثر من أي وقت',
    'the concept of sustainable living has gained significant traction': 'مفهوم السفر المستدام اكتسب زخما كبيرا',
    'More than just a trend': 'أكثر من مجرد توجه',
    'sustainable living is a lifestyle choice': 'السفر المستدام هو خيار حياة',
    'In a world where content is abundant': 'في عالم مليء بالخيارات',
    'Creating engaging blog posts': 'التخطيط لرحلة سفر مميزة',
    'keeping them engaged is crucial': 'الحفاظ على تجربة ممتعة أمر ضروري',
    'This post will guide you through the essential elements': 'سنرشدك في هذا المقال عبر العناصر الأساسية',
    'of writing compelling': 'لكتابة محتوى جذاب',

    /* ----- Testimonials ----- */
    'Ali shared an incredible experience with 5TAAH, finding the best deals for his trip to Dubai': 'علي شاركنا تجربته الرائعة مع خته في الحصول على أفضل العروض لرحلته إلى دبي',
    'Ali shared an incredible experience with 5TAAH': 'شاركنا تجربته الرائعة مع خته',
    'finding the best deals for his trip to Dubai': 'في الحصول على أفضل العروض لرحلته إلى دبي',
    'Fatima loved how easy it was to book her vacation in Bahrain through 5TAAH\'s seamless platform': 'فاطمة أحبت سهولة حجز إجازتها في البحرين عبر منصة خته',
    'Fatima loved how easy it was to book her vacation in Bahrain': 'أحبت سهولة حجز إجازتها في البحرين عبر خته',
    'through 5TAAH\'s seamless platform': 'عبر منصة خته المتميزة',
    'Omar appreciated the variety of options available on 5TAAH for his family trip to Qatar': 'عمر أعجب بتنوع الخيارات المتاحة في خته لرحلته العائلية إلى قطر',
    'Omar appreciated the variety of options available on 5TAAH': 'أعجب بتنوع الخيارات المتاحة في خته',
    'Omar appreciated the variety of options': 'أعجب بتنوع الخيارات المتاحة',
    'available on 5TAAH for his family trip to Qatar': 'في خته لرحلته العائلية إلى قطر',
    'for his family trip to Qatar': 'لرحلته العائلية إلى قطر',
    'Fatima Ali': 'فاطمة علي',
    'Omar Khouri': 'عمر الخوري',
    'Ali Hassan': 'علي حسن',
    'Ibrahem H': 'إبراهيم',
    'Ibrahem': 'إبراهيم',
    'Ibrahim': 'إبراهيم',

    /* ----- Hero & Sections ----- */
    'Travel in Style': 'سافر بأسلوبك مع خته',
    'Join us on a journey to discover exclusive travel deals across the Gulf region, tailored to your wanderlust': 'منصتك الذكية لحجز رحلات الطيران والفنادق والسيارات بأفضل الأسعار في الخليج',
    'Join us on a journey to discover exclusive travel': 'منصتك الذكية لحجز رحلات الطيران والفنادق',
    'deals across the Gulf region, tailored to your wanderlust': 'والسيارات بأفضل الأسعار في الخليج',
    'deals across the Gulf region': 'بأفضل الأسعار في الخليج',
    'tailored to your wanderlust': '',
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

    /* ----- Deals / Pricing Plans ----- */
    'UAE Adventure': 'مغامرة الإمارات',
    'Saudi Tour': 'جولة سعودية',
    'Bahrain Exploration': 'استكشاف البحرين',
    'Bahrain Discovery': 'استكشاف البحرين',
    'Qatar Experience': 'تجربة قطر',
    'Kuwait City': 'مدينة الكويت',
    'Oman Discovery': 'اكتشاف عُمان',

    /* ----- Offerings / Services ----- */
    'Exclusive Packages': 'باقات حصرية',
    'Our exclusive travel packages provide incredible value for your adventures, making it easier to explore the Gulf\'s top destinations': 'باقات سفر حصرية بقيمة استثنائية تسهل عليك استكشاف أفضل الوجهات في الخليج',
    'Our exclusive travel packages provide incredible value for your adventures': 'باقات سفر حصرية بقيمة استثنائية لمغامراتك',
    'Our exclusive travel packages provide incredible value': 'باقات سفر حصرية بقيمة استثنائية',
    'making it easier to explore the Gulf\'s top destinations': 'تسهل عليك استكشاف أفضل الوجهات في الخليج',
    'Personalized Service': 'خدمة مخصصة',
    'We are dedicated to offering personalized service to ensure you find exactly what you wish for in your travels': 'نحرص على تقديم خدمة مخصصة لنضمن لك العثور على ما تبحث عنه في رحلاتك',
    'We are dedicated to offering personalized service': 'نحرص على تقديم خدمة مخصصة لضمان راحتك',
    'to ensure you find exactly what you wish for in your travels': 'لنضمن لك العثور على ما تبحث عنه',
    'User-Friendly Platform': 'منصة سهلة الاستخدام',
    'User-Friendly': 'سهلة الاستخدام',
    'Platform': 'منصة',
    'Customer Support': 'دعم العملاء',
    'Best Deals': 'أفضل العروض',
    'Secure Payments': 'دفع آمن',
    'Easy Booking': 'حجز سهل',
    'Free Cancellation': 'إلغاء مجاني',
    'Price Guarantee': 'ضمان أفضل سعر',
    '24/7 Support': 'دعم على مدار الساعة',

    /* ----- Navigation ----- */
    'Home': 'الرئيسية',
    'Welcome': 'مرحبا بك',
    'Blog Feed': 'المدونة',
    'Blog': 'مدونة السفر',
    'More': 'المزيد',
    'About': 'من نحن',
    'About Us': 'من نحن',
    'Contact': 'تواصل معنا',
    'Contact Us': 'تواصل معنا',

    /* ----- General actions ----- */
    'Get Started': 'ابدأ الآن',
    'Learn More': 'اكتشف المزيد',
    'Read More': 'اقرأ المزيد',
    'View All': 'عرض الكل',
    'View Course': 'عرض التفاصيل',
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
    'Send Message': 'إرسال',
    'Submit': 'إرسال',
    'Send': 'إرسال',
    'Explore': 'استكشف',
    'Go to Homepage': 'العودة للرئيسية',

    /* ----- Booking / Plans pages ----- */
    'Book Online': 'احجز الآن',
    'Plans & Pricing': 'العروض والباقات',
    'Plan Customization': 'تخصيص الباقة',
    'My Bookings': 'حجوزاتي',
    'My Orders': 'طلباتي',
    'My Subscriptions': 'اشتراكاتي',
    'Account Settings': 'إعدادات الحساب',
    'Notifications': 'الإشعارات',
    'Profile': 'الملف الشخصي',
    'Service Page': 'تفاصيل الخدمة',
    'Thank You': 'شكرا لك',

    /* ----- Footer ----- */
    'All rights reserved': 'جميع الحقوق محفوظة',
    'Copyright': '5ATTH خته',
    'Powered and Secured by Wix': '',
    'Powered and secured by Wix': '',
    'Privacy Policy': 'سياسة الخصوصية',
    'Terms of Use': 'شروط الاستخدام',
    'Terms & Conditions': 'الشروط والأحكام',
    'Accessibility': 'إمكانية الوصول',
    'Accessibility Statement': 'بيان إمكانية الوصول',
    'Refund Policy': 'سياسة الاسترداد',

    /* ----- Footer contact ----- */
    '123-456-7890': '+968 50 000 0000',
    'info@mysite.com': 'info@5atth.com',
    '500 Terry Francine Street': 'الرياض، المملكة العربية السعودية',
    '500 Terry Francine Street,': 'الرياض، المملكة العربية السعودية',
    '6th Floor, San Francisco': '',
    'CA 94158': '',
    'San Francisco': '',
  };

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
    'Go to Homepage': 'العودة للرئيسية',
  };

  var sortedKeys = Object.keys(map).sort(function (a, b) { return b.length - a.length; });
  var sortedBtnKeys = Object.keys(btnMap).sort(function (a, b) { return b.length - a.length; });

  /* ========== translateAll: single sweep of all elements ========== */
  function translateAll() {
    /* 1) Text elements */
    try {
      $w('Text').forEach(function (t) {
        try {
          var original = t.text || '';
          if (!original) return;
          /* Skip if already Arabic (contains Arabic chars and no Latin letters) */
          if (/[\u0600-\u06FF]/.test(original) && !/[A-Za-z]{3,}/.test(original)) return;
          sortedKeys.forEach(function (eng) {
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

    /* 2) Buttons */
    try {
      $w('Button').forEach(function (b) {
        try {
          var lbl = b.label || '';
          if (!lbl || !/[A-Za-z]/.test(lbl)) return;
          sortedBtnKeys.forEach(function (eng) {
            if (lbl.indexOf(eng) !== -1) {
              b.label = btnMap[eng];
            }
          });
        } catch (e) {}
      });
    } catch (e) {}

    /* 3) Repeaters (Blog, Pricing Plans, Testimonials, etc.) */
    try {
      $w('Repeater').forEach(function (rep) {
        try {
          rep.forEachItem(function ($i) {
            try {
              $i('Text').forEach(function (t) {
                try {
                  var txt = t.text || '';
                  if (!txt) return;
                  if (/[\u0600-\u06FF]/.test(txt) && !/[A-Za-z]{3,}/.test(txt)) return;
                  sortedKeys.forEach(function (eng) {
                    if (txt.indexOf(eng) !== -1 && map[eng]) {
                      t.text = map[eng];
                    }
                  });
                } catch (e) {}
              });
              $i('Button').forEach(function (b) {
                try {
                  var lbl = b.label || '';
                  if (!lbl || !/[A-Za-z]/.test(lbl)) return;
                  sortedBtnKeys.forEach(function (eng) {
                    if (lbl.indexOf(eng) !== -1) {
                      b.label = btnMap[eng];
                    }
                  });
                } catch (e) {}
              });
            } catch (e) {}
          });
        } catch (e) {}
      });
    } catch (e) {}
  }

  /* ========== Dark Theme ========== */
  try { $w('Section').forEach(function (s) { try { s.style.backgroundColor = '#0E0E12'; } catch (e) {} }); } catch (e) {}
  try { $w('Header').forEach(function (h) { try { h.style.backgroundColor = '#0E0E12'; } catch (e) {} }); } catch (e) {}
  try { $w('Footer').forEach(function (f) { try { f.style.backgroundColor = '#0E0E12'; } catch (e) {} }); } catch (e) {}

  /* ========== Run translation immediately ========== */
  translateAll();

  /* ========== Delayed sweeps to catch async Wix app widgets ========== */
  setTimeout(translateAll, 800);
  setTimeout(translateAll, 2000);
  setTimeout(translateAll, 4000);
  setTimeout(translateAll, 7000);

  /* =========================================================
   *  Navigation Menu — links to EXISTING pages only
   * ========================================================= */
  try {
    $w('Menu').forEach(function (menu) {
      try {
        menu.menuItems = [
          { label: 'الرئيسية', link: '/' },
          { label: 'العروض', link: '/plans-pricing' },
          { label: 'الحجز', link: '/book-online' },
          { label: 'المدونة', link: '/blog' },
        ];
      } catch (e) {}
    });
  } catch (e) {}

  /* ========== Country / Currency Selector ========== */
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

  /* ========== Footer ========== */
  try { $w('#footerText').text = '2026 5ATTH | خته - جميع الحقوق محفوظة'; } catch (e) {}
  try { $w('#footerDesc').text = 'منصتك الذكية لحجز السفر في الخليج'; } catch (e) {}
});
