/**
 * 5ATTH | خته — استقدام العمالة (Labor Import)
 * ⚠️ PLACEHOLDER — Disabled via feature flag, Phase 2
 */
import wixSeo from 'wix-seo';

$w.onReady(function () {
  wixSeo.title = 'استقدام العمالة | 5ATTH خته';
  wixSeo.description = 'خدمات استقدام العمالة - قريباً';

  // This page is disabled by default via feature flag 'labor_import'
  if ($w('#comingSoon')) {
    $w('#comingSoon').text = 'هذه الخدمة قيد التطوير وستتوفر قريباً';
  }
});
