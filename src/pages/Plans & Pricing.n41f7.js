/**
 * 5ATTH | خته – Plans & Pricing (العروض والباقات)
 */
$w.onReady(function () {
  var map = {
    'Plans & Pricing': 'العروض والباقات',
    'Choose a Plan': 'اختر باقتك',
    'Select a plan': 'اختر باقتك',
    'UAE Adventure': 'مغامرة الإمارات',
    'Saudi Tour': 'جولة سعودية',
    'Bahrain Exploration': 'استكشاف البحرين',
    'Bahrain Discovery': 'استكشاف البحرين',
    'Qatar Experience': 'تجربة قطر',
    'Kuwait City': 'مدينة الكويت',
    'Oman Discovery': 'اكتشاف عُمان',
    'View Course': 'عرض التفاصيل',
    'Select': 'اختيار',
    'Best Value': 'أفضل قيمة',
    'Most Popular': 'الأكثر طلبا',
    'per month': 'شهريا',
    'per year': 'سنويا',
    'Free': 'مجاني',
    'month': 'شهر',
    'year': 'سنة',
    'Learn More': 'اكتشف المزيد',
    'Get Started': 'ابدأ الآن',
    'Book Now': 'احجز الآن',
  };
  var btnM = { 'View Course': 'عرض التفاصيل', 'Select': 'اختيار', 'Get Started': 'ابدأ الآن', 'Book Now': 'احجز الآن', 'Learn More': 'اكتشف المزيد' };
  var sk = Object.keys(map).sort(function(a,b){return b.length-a.length;});
  var bk = Object.keys(btnM).sort(function(a,b){return b.length-a.length;});
  function tr() {
    try { $w('Text').forEach(function(t){try{var o=t.text||'';if(!o)return;if(/[\u0600-\u06FF]/.test(o)&&!/[A-Za-z]{3,}/.test(o))return;sk.forEach(function(e){if(o.indexOf(e)!==-1&&map[e])t.text=map[e];});}catch(e){}}); } catch(e){}
    try { $w('Button').forEach(function(b){try{var l=b.label||'';if(!/[A-Za-z]/.test(l))return;bk.forEach(function(e){if(l.indexOf(e)!==-1)b.label=btnM[e];});}catch(e){}}); } catch(e){}
    try { $w('Repeater').forEach(function(r){try{r.forEachItem(function($i){try{$i('Text').forEach(function(t){try{var o=t.text||'';if(!o)return;if(/[\u0600-\u06FF]/.test(o)&&!/[A-Za-z]{3,}/.test(o))return;sk.forEach(function(e){if(o.indexOf(e)!==-1&&map[e])t.text=map[e];});}catch(e){}});$i('Button').forEach(function(b){try{var l=b.label||'';if(!/[A-Za-z]/.test(l))return;bk.forEach(function(e){if(l.indexOf(e)!==-1)b.label=btnM[e];});}catch(e){}});}catch(e){}});}catch(e){}}); } catch(e){}
  }
  tr(); setTimeout(tr,800); setTimeout(tr,2000); setTimeout(tr,4000); setTimeout(tr,7000);
});
