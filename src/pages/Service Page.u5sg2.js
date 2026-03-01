/**
 * 5ATTH | خته – Service Page (تفاصيل الخدمة)
 */
$w.onReady(function () {
  var map = {
    'Service Page': 'تفاصيل الخدمة',
    'UAE Adventure': 'مغامرة الإمارات',
    'Saudi Tour': 'جولة سعودية',
    'Bahrain Exploration': 'استكشاف البحرين',
    'Bahrain Discovery': 'استكشاف البحرين',
    'Qatar Experience': 'تجربة قطر',
    'Book Now': 'احجز الآن',
    'Learn More': 'اكتشف المزيد',
    'Duration': 'المدة',
    'Price': 'السعر',
    'Description': 'الوصف',
    'Details': 'التفاصيل',
    'Contact Us': 'تواصل معنا',
    'Check Availability': 'تحقق من التوفر',
  };
  var sk = Object.keys(map).sort(function(a,b){return b.length-a.length;});
  function tr() {
    try { $w('Text').forEach(function(t){try{var o=t.text||'';if(!o)return;if(/[\u0600-\u06FF]/.test(o)&&!/[A-Za-z]{3,}/.test(o))return;sk.forEach(function(e){if(o.indexOf(e)!==-1&&map[e])t.text=map[e];});}catch(e){}}); } catch(e){}
    try { $w('Button').forEach(function(b){try{var l=b.label||'';if(!/[A-Za-z]/.test(l))return;if(l.indexOf('Book')!==-1)b.label='احجز الآن';if(l.indexOf('Check')!==-1)b.label='تحقق من التوفر';if(l.indexOf('Contact')!==-1)b.label='تواصل معنا';}catch(e){}}); } catch(e){}
  }
  tr(); setTimeout(tr,800); setTimeout(tr,2000); setTimeout(tr,4000);
});
