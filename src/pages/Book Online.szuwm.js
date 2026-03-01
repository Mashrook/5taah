/**
 * 5ATTH | خته – Book Online (الحجز)
 */
$w.onReady(function () {
  var map = {
    'Book Online': 'احجز الآن',
    'Book a Service': 'احجز خدمة',
    'Our Services': 'خدماتنا',
    'UAE Adventure': 'مغامرة الإمارات',
    'Saudi Tour': 'جولة سعودية',
    'Bahrain Exploration': 'استكشاف البحرين',
    'Bahrain Discovery': 'استكشاف البحرين',
    'Qatar Experience': 'تجربة قطر',
    'Book Now': 'احجز الآن',
    'Learn More': 'اكتشف المزيد',
    'Duration': 'المدة',
    'Price': 'السعر',
    'hour': 'ساعة',
    'hours': 'ساعات',
    'minutes': 'دقائق',
    'Select Date': 'اختر التاريخ',
    'Select Time': 'اختر الوقت',
    'Next': 'التالي',
    'Back': 'رجوع',
    'Confirm': 'تأكيد',
  };
  var sk = Object.keys(map).sort(function(a,b){return b.length-a.length;});
  var btnM = { 'Book Now': 'احجز الآن', 'Learn More': 'اكتشف المزيد', 'Next': 'التالي', 'Back': 'رجوع', 'Confirm': 'تأكيد', 'Select': 'اختيار' };
  var bk = Object.keys(btnM).sort(function(a,b){return b.length-a.length;});
  function tr() {
    try { $w('Text').forEach(function(t){try{var o=t.text||'';if(!o)return;if(/[\u0600-\u06FF]/.test(o)&&!/[A-Za-z]{3,}/.test(o))return;sk.forEach(function(e){if(o.indexOf(e)!==-1&&map[e])t.text=map[e];});}catch(e){}}); } catch(e){}
    try { $w('Button').forEach(function(b){try{var l=b.label||'';if(!/[A-Za-z]/.test(l))return;bk.forEach(function(e){if(l.indexOf(e)!==-1)b.label=btnM[e];});}catch(e){}}); } catch(e){}
    try { $w('Repeater').forEach(function(r){try{r.forEachItem(function($i){try{$i('Text').forEach(function(t){try{var o=t.text||'';if(!o)return;if(/[\u0600-\u06FF]/.test(o)&&!/[A-Za-z]{3,}/.test(o))return;sk.forEach(function(e){if(o.indexOf(e)!==-1&&map[e])t.text=map[e];});}catch(e){}});$i('Button').forEach(function(b){try{var l=b.label||'';if(!/[A-Za-z]/.test(l))return;bk.forEach(function(e){if(l.indexOf(e)!==-1)b.label=btnM[e];});}catch(e){}});}catch(e){}});}catch(e){}}); } catch(e){}
  }
  tr(); setTimeout(tr,800); setTimeout(tr,2000); setTimeout(tr,4000); setTimeout(tr,7000);
});
