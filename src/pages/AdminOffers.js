/**
 * 5ATTH | خته — Admin Offers Management (/admin/offers)
 * CRUD for CuratedOffers collection
 */
import wixSeo from 'wix-seo';
import wixUsers from 'wix-users';
import wixData from 'wix-data';
import { checkPermission } from 'backend/rbacService.web';
import { getCuratedOffers, saveCuratedOffer } from 'backend/cmsService.web';

const TENANT_ID = 'default';

$w.onReady(async function () {
  wixSeo.title = 'إدارة العروض | 5ATTH خته';

  const userId = wixUsers.currentUser.id;
  const allowed = await checkPermission(TENANT_ID, userId, 'cms_edit');
  if (!allowed) {
    if ($w('#accessDenied')) $w('#accessDenied').expand();
    return;
  }

  let segmentFilter = 'all';

  // ─── Segment Tabs ──────────────────────────────────────
  const segments = ['all', 'luxury', 'family', 'adventure', 'hajj', 'umrah', 'summer', 'winter'];
  const segmentLabels = {
    all: 'الكل', luxury: 'فاخر', family: 'عائلي', adventure: 'مغامرة',
    hajj: 'حج', umrah: 'عمرة', summer: 'صيف', winter: 'شتاء',
  };

  if ($w('#segmentRepeater')) {
    $w('#segmentRepeater').data = segments.map((s, i) => ({ _id: String(i), key: s, label: segmentLabels[s] }));
    $w('#segmentRepeater').onItemReady(($item, data) => {
      if ($item('#segBtn')) {
        $item('#segBtn').label = data.label;
        $item('#segBtn').onClick(() => {
          segmentFilter = data.key;
          loadOffers();
        });
      }
    });
  }

  // ─── Load Offers ───────────────────────────────────────
  async function loadOffers() {
    if ($w('#offersLoading')) $w('#offersLoading').expand();

    try {
      let query = wixData.query('CuratedOffers')
        .descending('_createdDate');

      if (segmentFilter !== 'all') {
        query = query.eq('segmentKey', segmentFilter);
      }

      const results = await query.limit(50).find();

      if ($w('#offersCount')) $w('#offersCount').text = `${results.totalCount} عرض`;

      if ($w('#offersRepeater')) {
        $w('#offersRepeater').data = results.items.map((o, i) => ({ _id: String(i), ...o }));

        $w('#offersRepeater').onItemReady(($item, data) => {
          if ($item('#ofTitle')) $item('#ofTitle').text = data.title || '-';
          if ($item('#ofSegment')) {
            $item('#ofSegment').text = segmentLabels[data.segmentKey] || data.segmentKey || '-';
            try { $item('#ofSegment').style.color = '#C9A227'; } catch (e) {}
          }
          if ($item('#ofCta')) $item('#ofCta').text = data.ctaLabel || '-';
          if ($item('#ofStatus')) {
            $item('#ofStatus').text = data.status === 'active' ? 'نشط' : 'غير نشط';
            try {
              $item('#ofStatus').style.color = data.status === 'active' ? '#22C55E' : '#9AA0A6';
            } catch (e) {}
          }
          if ($item('#ofDates')) {
            const from = data.activeFrom ? new Date(data.activeFrom).toLocaleDateString('ar-SA') : '-';
            const to = data.activeTo ? new Date(data.activeTo).toLocaleDateString('ar-SA') : '-';
            $item('#ofDates').text = `${from} — ${to}`;
          }

          // Edit
          if ($item('#ofEditBtn')) {
            $item('#ofEditBtn').onClick(() => openOfferEditor(data));
          }

          // Delete
          if ($item('#ofDeleteBtn')) {
            $item('#ofDeleteBtn').onClick(async () => {
              $item('#ofDeleteBtn').disable();
              try {
                await wixData.remove('CuratedOffers', data._id);
                await loadOffers();
              } catch (e) {
                console.log('Delete error:', e);
              }
              $item('#ofDeleteBtn').enable();
            });
          }

          // Toggle status
          if ($item('#ofToggleBtn')) {
            $item('#ofToggleBtn').label = data.status === 'active' ? 'تعطيل' : 'تفعيل';
            $item('#ofToggleBtn').onClick(async () => {
              await wixData.update('CuratedOffers', {
                ...data,
                status: data.status === 'active' ? 'inactive' : 'active',
              });
              await loadOffers();
            });
          }
        });
      }
    } catch (e) {
      if ($w('#offersError')) $w('#offersError').text = `خطأ: ${e.message}`;
    }

    if ($w('#offersLoading')) $w('#offersLoading').collapse();
  }

  // ─── Offer Editor ──────────────────────────────────────
  function openOfferEditor(offer = {}) {
    if ($w('#offerEditor')) $w('#offerEditor').expand();
    if ($w('#edTitle')) $w('#edTitle').value = offer.title || '';
    if ($w('#edSegment')) $w('#edSegment').value = offer.segmentKey || '';
    if ($w('#edCta')) $w('#edCta').value = offer.ctaLabel || '';
    if ($w('#edCtaTarget')) $w('#edCtaTarget').value = offer.ctaTargetJson || '';
    if ($w('#edActiveFrom')) $w('#edActiveFrom').value = offer.activeFrom ? new Date(offer.activeFrom) : null;
    if ($w('#edActiveTo')) $w('#edActiveTo').value = offer.activeTo ? new Date(offer.activeTo) : null;
    if ($w('#edStatus')) $w('#edStatus').value = offer.status || 'active';
    if ($w('#edOfferId')) $w('#edOfferId').value = offer._id || '';
  }

  if ($w('#addOfferBtn')) {
    $w('#addOfferBtn').onClick(() => openOfferEditor());
  }

  if ($w('#saveOfferBtn')) {
    $w('#saveOfferBtn').onClick(async () => {
      const offerData = {
        title: $w('#edTitle')?.value,
        segmentKey: $w('#edSegment')?.value,
        ctaLabel: $w('#edCta')?.value,
        ctaTargetJson: $w('#edCtaTarget')?.value,
        activeFrom: $w('#edActiveFrom')?.value,
        activeTo: $w('#edActiveTo')?.value,
        status: $w('#edStatus')?.value || 'active',
      };

      const existingId = $w('#edOfferId')?.value;
      try {
        await saveCuratedOffer(TENANT_ID, { ...offerData, ...(existingId ? { _id: existingId } : {}) });
        if ($w('#offerEditor')) $w('#offerEditor').collapse();
        await loadOffers();
      } catch (e) {
        if ($w('#edError')) $w('#edError').text = e.message;
      }
    });
  }

  if ($w('#cancelOfferBtn')) {
    $w('#cancelOfferBtn').onClick(() => {
      if ($w('#offerEditor')) $w('#offerEditor').collapse();
    });
  }

  // ─── Initial Load ──────────────────────────────────────
  await loadOffers();
});
