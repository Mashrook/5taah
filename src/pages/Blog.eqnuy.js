/**
 * 5ATTH | خته – Blog (المدونة)
 */
$w.onReady(function () {
  var map = {
    'Blog': 'مدونة السفر',
    'All Posts': 'جميع المقالات',
    'Recent Posts': 'أحدث المقالات',
    'The Importance of Sustainable Living in Today\'s World': 'أهمية السياحة المستدامة في عالمنا اليوم',
    'The Art of Crafting Engaging Blog Posts': 'فن التخطيط لرحلة سفر مميزة',
    'Ibrahem H': 'إبراهيم',
    'Ibrahem': 'إبراهيم',
    'Read More': 'اقرأ المزيد',
    'Search': 'بحث',
    'Categories': 'التصنيفات',
    'Tags': 'الوسوم',
    'No posts found': 'لا توجد مقالات',
    'Share': 'مشاركة',
    'Comments': 'التعليقات',
    'Leave a comment': 'اكتب تعليقا',
    'Post': 'نشر',
    'Sustainable living is no longer just a trend': 'السياحة المستدامة ليست مجرد توجه',
    'Creating engaging blog posts is both an art and a science': 'التخطيط لرحلة ناجحة يجمع بين الفن والعلم',
  };
  var sk = Object.keys(map).sort(function(a,b){return b.length-a.length;});
  function tr() {
    try { $w('Text').forEach(function(t){try{var o=t.text||'';if(!o)return;if(/[\u0600-\u06FF]/.test(o)&&!/[A-Za-z]{3,}/.test(o))return;sk.forEach(function(e){if(o.indexOf(e)!==-1&&map[e])t.text=map[e];});}catch(e){}}); } catch(e){}
    try { $w('Button').forEach(function(b){try{var l=b.label||'';if(!/[A-Za-z]/.test(l))return;if(l.indexOf('Read')!==-1)b.label='اقرأ المزيد';if(l.indexOf('Search')!==-1)b.label='بحث';if(l.indexOf('Post')!==-1)b.label='نشر';}catch(e){}}); } catch(e){}
    try { $w('Repeater').forEach(function(r){try{r.forEachItem(function($i){try{$i('Text').forEach(function(t){try{var o=t.text||'';if(!o)return;if(/[\u0600-\u06FF]/.test(o)&&!/[A-Za-z]{3,}/.test(o))return;sk.forEach(function(e){if(o.indexOf(e)!==-1&&map[e])t.text=map[e];});}catch(e){}});}catch(e){}});}catch(e){}}); } catch(e){}
  }
  tr(); setTimeout(tr,800); setTimeout(tr,2000); setTimeout(tr,4000); setTimeout(tr,7000);
});
