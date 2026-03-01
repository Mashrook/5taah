/**
 * 5ATTH | خته – Study Abroad 📚
 * الدراسة في الخارج
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import { getSectionContent, submitLead } from 'backend/cmsService.web';

function el(id) { try { return $w(id); } catch (e) { return null; } }
function setText(id, txt) { try { var e = el(id); if (e) e.text = txt; } catch (e) {} }
function setLabel(id, txt) { try { var e = el(id); if (e) e.label = txt; } catch (e) {} }
function show(id) { try { var e = el(id); if (e) e.expand(); } catch (e) {} }
function hide(id) { try { var e = el(id); if (e) e.collapse(); } catch (e) {} }
function btn(id, fn) { try { var e = el(id); if (e) e.onClick(fn); } catch (e) {} }

var TENANT = 'default';

var programs = [
  {
    _id: 'p1', country: '🇬🇧 بريطانيا', city: 'لندن، مانشستر، أكسفورد',
    programs: 'لغة إنجليزية، بكالوريوس، ماجستير', duration: '٣ أشهر - ٤ سنوات',
    price: 'من ١٥,٠٠٠ ر.س/فصل', features: ['جامعات معتمدة عالمياً', 'تأشيرة طالب', 'سكن طلابي', 'تأمين صحي شامل'],
    desc: 'بريطانيا وجهة التعليم الأولى عالمياً. جامعات عريقة مثل أكسفورد وكامبريدج مع فرص عمل بعد التخرج.'
  },
  {
    _id: 'p2', country: '🇺🇸 أمريكا', city: 'نيويورك، لوس أنجلوس، بوسطن',
    programs: 'لغة إنجليزية، بكالوريوس، ماجستير، دكتوراه', duration: '٦ أشهر - ٥ سنوات',
    price: 'من ٢٠,٠٠٠ ر.س/فصل', features: ['أفضل الجامعات العالمية', 'فرص بحثية', 'OPT بعد التخرج', 'حوالات دراسية'],
    desc: 'أمريكا تضم أفضل الجامعات في العالم مع برامج متنوعة وفرص بحثية لا مثيل لها.'
  },
  {
    _id: 'p3', country: '🇲🇾 ماليزيا', city: 'كوالالمبور، بينانج',
    programs: 'لغة إنجليزية، دبلوم، بكالوريوس', duration: '٣ أشهر - ٤ سنوات',
    price: 'من ٨,٠٠٠ ر.س/فصل', features: ['تكلفة معيشة منخفضة', 'بيئة إسلامية', 'طعام حلال', 'جامعات معتمدة'],
    desc: 'ماليزيا خيار مثالي للطلاب السعوديين - بيئة إسلامية، تكلفة معقولة، وجودة تعليم ممتازة.'
  },
  {
    _id: 'p4', country: '🇹🇷 تركيا', city: 'إسطنبول، أنقرة، إزمير',
    programs: 'لغة تركية، بكالوريوس، ماجستير', duration: '٤ أشهر - ٤ سنوات',
    price: 'من ٥,٠٠٠ ر.س/فصل', features: ['منح حكومية', 'ثقافة قريبة', 'تكلفة منخفضة', 'اعتراف دولي'],
    desc: 'تركيا تقدم منحاً حكومية سخية وجامعات حديثة بتكلفة معقولة وثقافة قريبة من المجتمع العربي.'
  },
  {
    _id: 'p5', country: '🇦🇺 أستراليا', city: 'سيدني، ملبورن',
    programs: 'لغة إنجليزية، بكالوريوس، ماجستير', duration: '٣ أشهر - ٤ سنوات',
    price: 'من ١٨,٠٠٠ ر.س/فصل', features: ['جودة حياة عالية', 'إقامة بعد التخرج', 'بيئة متنوعة', 'جامعات مرموقة'],
    desc: 'أستراليا توفر تجربة تعليمية مميزة مع إمكانية الحصول على إقامة عمل بعد التخرج.'
  },
  {
    _id: 'p6', country: '🇮🇪 أيرلندا', city: 'دبلن، كورك',
    programs: 'لغة إنجليزية، بكالوريوس، ماجستير', duration: '٣ أشهر - ٤ سنوات',
    price: 'من ١٢,٠٠٠ ر.س/فصل', features: ['بيئة آمنة', 'مركز تقني أوروبي', 'فرص عمل Tech', 'شعب ودود'],
    desc: 'أيرلندا مركز التقنية الأوروبي مع وجود شركات مثل Google و Apple وفرص عمل ممتازة.'
  },
];

$w.onReady(async function () {
  wixSeo.title = 'الدراسة في الخارج | 5ATTH خته';
  wixSeo.description = 'برامج دراسية في بريطانيا وأمريكا وماليزيا وتركيا وأستراليا - استشارة مجانية';

  setText('#pageTitle', '📚 الدراسة في الخارج');
  setText('#pageSubtitle', 'حقق حلمك الأكاديمي مع خته - استشارة مجانية وخدمات شاملة');

  /* ——— Render Programs ——————————————————— */
  try {
    var rep = el('#programsRepeater');
    if (rep) {
      rep.data = programs;
      rep.onItemReady(function ($i, d) {
        try { $i('#programCountry').text = d.country; } catch (e) {}
        try { $i('#programCity').text = '📍 ' + d.city; } catch (e) {}
        try { $i('#programTypes').text = '📋 ' + d.programs; } catch (e) {}
        try { $i('#programDuration').text = '⏱ ' + d.duration; } catch (e) {}
        try { $i('#programPrice').text = d.price; } catch (e) {}
        try { $i('#programPrice').style.color = '#C9A227'; } catch (e) {}
        try { $i('#programDesc').text = d.desc; } catch (e) {}
        try {
          var featText = d.features.map(function (f) { return '✅ ' + f; }).join('\n');
          $i('#programFeatures').text = featText;
        } catch (e) {}
        try {
          $i('#programConsultBtn').onClick(function () {
            setText('#selectedProgram', d.country);
            show('#consultForm');
          });
        } catch (e) {}
      });
    }
  } catch (e) {}

  /* ——— Consultation Form ——————————————————— */
  setText('#formTitle', '📝 طلب استشارة مجانية');
  setText('#nameLabel', 'الاسم الكامل');
  setText('#phoneLabel', 'رقم الجوال');
  setText('#emailLabel', 'البريد الإلكتروني');
  setText('#programLabel', 'البرنامج المطلوب');
  setText('#messageLabel', 'رسالتك');
  setLabel('#submitConsultBtn', '📩 إرسال الطلب');

  btn('#submitConsultBtn', async function () {
    var name = (el('#consultName') || {}).value || '';
    var phone = (el('#consultPhone') || {}).value || '';
    var email = (el('#consultEmail') || {}).value || '';
    var program = (el('#consultProgram') || {}).value || '';
    var message = (el('#consultMessage') || {}).value || '';

    if (!name || !phone) {
      setText('#formError', 'يرجى تعبئة الاسم ورقم الجوال');
      return;
    }

    try {
      await submitLead(TENANT, {
        name: name, phone: phone, email: email,
        source: 'study_abroad', program: program, message: message,
      });
      hide('#consultForm');
      show('#successMessage');
      setText('#successText', '✅ تم إرسال طلبك بنجاح! سنتواصل معك خلال ٢٤ ساعة.');
    } catch (e) {
      setText('#formError', 'حدث خطأ. يرجى المحاولة مرة أخرى أو التواصل عبر واتساب.');
    }
  });

  /* ——— Try CMS ——————————————————— */
  try {
    var cmsData = await getSectionContent(TENANT, 'study_abroad');
    if (cmsData && cmsData.length > 0) {
      // merge CMS data
    }
  } catch (e) {}

  /* ——— Stats ——————————————————— */
  setText('#stat1', '+٥٠٠');
  setText('#stat1Label', 'طالب خدمناهم');
  setText('#stat2', '+٣٠');
  setText('#stat2Label', 'جامعة شريكة');
  setText('#stat3', '٩٨٪');
  setText('#stat3Label', 'نسبة القبول');
  setText('#stat4', '+١٠');
  setText('#stat4Label', 'دول متاحة');
});
