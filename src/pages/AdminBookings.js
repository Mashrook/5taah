/**
 * 5ATTH | خته — Admin Bookings Management
 */
import wixSeo from 'wix-seo';
import wixUsers from 'wix-users';
import wixData from 'wix-data';
import { checkPermission } from 'backend/rbacService.web';
import { cancelBooking, confirmBooking } from 'backend/bookingService.web';
import { refundPayment } from 'backend/paymentMoyasar.web';

const TENANT_ID = 'default';

$w.onReady(async function () {
  wixSeo.title = 'إدارة الحجوزات | 5ATTH خته';

  const userId = wixUsers.currentUser.id;
  const allowed = await checkPermission(TENANT_ID, userId, 'bookings_view');
  if (!allowed) {
    if ($w('#accessDenied')) $w('#accessDenied').expand();
    return;
  }

  let currentPage = 0;
  const pageSize = 20;
  let statusFilter = 'all';

  // ─── Filter Buttons ────────────────────────────────────
  const filters = ['all', 'confirmed', 'pending_payment', 'cancelled', 'refunded'];
  const filterLabels = { all: 'الكل', confirmed: 'مؤكد', pending_payment: 'بانتظار الدفع', cancelled: 'ملغي', refunded: 'مسترد' };

  if ($w('#filterRepeater')) {
    $w('#filterRepeater').data = filters.map((f, i) => ({ _id: String(i), filter: f, label: filterLabels[f] }));
    $w('#filterRepeater').onItemReady(($item, data) => {
      if ($item('#filterBtn')) {
        $item('#filterBtn').label = data.label;
        $item('#filterBtn').onClick(() => {
          statusFilter = data.filter;
          currentPage = 0;
          loadBookings();
        });
      }
    });
  }

  // ─── Search ────────────────────────────────────────────
  if ($w('#bookingSearchInput')) {
    $w('#bookingSearchInput').onKeyPress((event) => {
      if (event.key === 'Enter') loadBookings();
    });
  }

  // ─── Load Bookings ────────────────────────────────────
  async function loadBookings() {
    if ($w('#bookingsLoading')) $w('#bookingsLoading').expand();

    try {
      let query = wixData.query('bookings')
        .eq('tenantId', TENANT_ID)
        .descending('_createdDate')
        .skip(currentPage * pageSize)
        .limit(pageSize);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const searchTerm = $w('#bookingSearchInput')?.value;
      if (searchTerm) {
        query = query.contains('bookingId', searchTerm);
      }

      const results = await query.find();

      if ($w('#bookingsCount')) $w('#bookingsCount').text = `${results.totalCount} حجز`;

      renderBookings(results.items);

      // Pagination
      if ($w('#prevPage')) {
        $w('#prevPage')[currentPage > 0 ? 'enable' : 'disable']();
        $w('#prevPage').onClick(() => { currentPage--; loadBookings(); });
      }
      if ($w('#nextPage')) {
        $w('#nextPage')[results.hasNext() ? 'enable' : 'disable']();
        $w('#nextPage').onClick(() => { currentPage++; loadBookings(); });
      }
      if ($w('#pageInfo')) $w('#pageInfo').text = `صفحة ${currentPage + 1}`;

    } catch (e) {
      if ($w('#bookingsError')) $w('#bookingsError').text = `خطأ: ${e.message}`;
    }

    if ($w('#bookingsLoading')) $w('#bookingsLoading').collapse();
  }

  function renderBookings(bookings) {
    if (!$w('#bookingsRepeater')) return;

    $w('#bookingsRepeater').data = bookings.map((b, i) => ({ _id: String(i), ...b }));

    $w('#bookingsRepeater').onItemReady(($item, data) => {
      if ($item('#bkId')) $item('#bkId').text = data.bookingId || '-';
      if ($item('#bkUser')) $item('#bkUser').text = data.userId || '-';
      if ($item('#bkDate')) $item('#bkDate').text = new Date(data._createdDate).toLocaleDateString('ar-SA');
      if ($item('#bkAmount')) {
        $item('#bkAmount').text = `${data.amount} ${data.currency}`;
        try { $item('#bkAmount').style.color = '#C9A227'; } catch (e) {}
      }
      if ($item('#bkStatus')) {
        const labels = { confirmed: 'مؤكد', pending_payment: 'بانتظار الدفع', cancelled: 'ملغي', refunded: 'مسترد', draft: 'مسودة' };
        $item('#bkStatus').text = labels[data.status] || data.status;
        try {
          const colors = { confirmed: '#22C55E', pending_payment: '#EAB308', cancelled: '#EF4444', refunded: '#3B82F6', draft: '#9AA0A6' };
          $item('#bkStatus').style.color = colors[data.status] || '#9AA0A6';
        } catch (e) {}
      }

      // Cancel action
      if ($item('#bkCancelBtn')) {
        if (data.status === 'confirmed' || data.status === 'pending_payment') {
          $item('#bkCancelBtn').expand();
          $item('#bkCancelBtn').onClick(async () => {
            const canEdit = await checkPermission(TENANT_ID, userId, 'bookings_edit');
            if (!canEdit) return;
            $item('#bkCancelBtn').disable();
            try {
              await cancelBooking(TENANT_ID, data.bookingId, data.userId);
              loadBookings();
            } catch (e) {
              console.log('Cancel error:', e);
            }
            $item('#bkCancelBtn').enable();
          });
        } else {
          $item('#bkCancelBtn').collapse();
        }
      }

      // Refund action
      if ($item('#bkRefundBtn')) {
        if (data.status === 'cancelled') {
          $item('#bkRefundBtn').expand();
          $item('#bkRefundBtn').onClick(async () => {
            const canEdit = await checkPermission(TENANT_ID, userId, 'bookings_edit');
            if (!canEdit) return;
            $item('#bkRefundBtn').disable();
            try {
              // Find payment for this booking
              const payment = await wixData.query('payments')
                .eq('bookingId', data.bookingId)
                .eq('status', 'paid')
                .find();
              if (payment.items.length > 0) {
                await refundPayment(TENANT_ID, payment.items[0].moyasarPaymentId);
              }
              loadBookings();
            } catch (e) {
              console.log('Refund error:', e);
            }
            $item('#bkRefundBtn').enable();
          });
        } else {
          $item('#bkRefundBtn').collapse();
        }
      }
    });
  }

  // ─── Export ────────────────────────────────────────────
  if ($w('#exportBtn')) {
    $w('#exportBtn').onClick(async () => {
      const canExport = await checkPermission(TENANT_ID, userId, 'reports_export');
      if (!canExport) return;
      // Export logic — would generate CSV
      console.log('Export bookings — to be implemented with wixWindow.openUrl to a backend export endpoint');
    });
  }

  // ─── Initial Load ──────────────────────────────────────
  await loadBookings();
});
