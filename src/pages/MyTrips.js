/**
 * 5ATTH | خته — My Trips Page
 */
import wixSeo from 'wix-seo';
import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import { getUserBookings, getBookingDetails, cancelBooking } from 'backend/bookingService.web';

const TENANT_ID = 'default';

$w.onReady(async function () {
  wixSeo.title = 'رحلاتي | 5ATTH خته';

  if (!wixUsers.currentUser.loggedIn) {
    wixLocation.to('/login');
    return;
  }

  const userId = wixUsers.currentUser.id;

  // ─── Tab Switching ─────────────────────────────────────
  let activeTab = 'upcoming';

  if ($w('#tabUpcoming')) {
    $w('#tabUpcoming').onClick(() => {
      activeTab = 'upcoming';
      highlightTab();
      loadTrips();
    });
  }
  if ($w('#tabPast')) {
    $w('#tabPast').onClick(() => {
      activeTab = 'past';
      highlightTab();
      loadTrips();
    });
  }
  if ($w('#tabCancelled')) {
    $w('#tabCancelled').onClick(() => {
      activeTab = 'cancelled';
      highlightTab();
      loadTrips();
    });
  }

  function highlightTab() {
    ['#tabUpcoming', '#tabPast', '#tabCancelled'].forEach(id => {
      if ($w(id)) {
        try {
          $w(id).style.backgroundColor = '#1E1E27';
          $w(id).style.color = '#9AA0A6';
        } catch (e) {}
      }
    });
    const activeId = activeTab === 'upcoming' ? '#tabUpcoming' : activeTab === 'past' ? '#tabPast' : '#tabCancelled';
    if ($w(activeId)) {
      try {
        $w(activeId).style.backgroundColor = '#C9A227';
        $w(activeId).style.color = '#0E0E12';
      } catch (e) {}
    }
  }

  async function loadTrips() {
    if ($w('#tripsLoading')) $w('#tripsLoading').expand();

    try {
      const bookings = await getUserBookings(TENANT_ID, userId);
      const now = new Date();

      let filtered = [];
      if (activeTab === 'upcoming') {
        filtered = bookings.filter(b => b.status === 'confirmed' && new Date(b.departureDate || b._createdDate) > now);
      } else if (activeTab === 'past') {
        filtered = bookings.filter(b => b.status === 'confirmed' && new Date(b.departureDate || b._createdDate) <= now);
      } else {
        filtered = bookings.filter(b => b.status === 'cancelled' || b.status === 'refunded');
      }

      renderTrips(filtered);
    } catch (e) {
      if ($w('#tripsError')) $w('#tripsError').text = `خطأ: ${e.message}`;
    }

    if ($w('#tripsLoading')) $w('#tripsLoading').collapse();
  }

  function renderTrips(bookings) {
    if (!$w('#tripsRepeater')) return;

    if (bookings.length === 0) {
      if ($w('#noTrips')) $w('#noTrips').expand();
      $w('#tripsRepeater').data = [];
      return;
    }
    if ($w('#noTrips')) $w('#noTrips').collapse();

    $w('#tripsRepeater').data = bookings.map((b, i) => ({
      _id: String(i),
      ...b,
    }));

    $w('#tripsRepeater').onItemReady(($item, data) => {
      if ($item('#tripBookingId')) $item('#tripBookingId').text = `رقم الحجز: ${data.bookingId}`;
      if ($item('#tripRoute')) $item('#tripRoute').text = data.offerSummary || 'رحلة';
      if ($item('#tripDate')) $item('#tripDate').text = new Date(data._createdDate).toLocaleDateString('ar-SA');
      if ($item('#tripAmount')) {
        $item('#tripAmount').text = `${data.amount} ${data.currency}`;
        try { $item('#tripAmount').style.color = '#C9A227'; } catch (e) {}
      }

      // Status badge
      if ($item('#tripStatus')) {
        const statusLabels = {
          confirmed: 'مؤكد',
          pending_payment: 'بانتظار الدفع',
          cancelled: 'ملغي',
          refunded: 'مسترد',
          draft: 'مسودة',
        };
        $item('#tripStatus').text = statusLabels[data.status] || data.status;
        try {
          const statusColors = {
            confirmed: '#22C55E',
            pending_payment: '#EAB308',
            cancelled: '#EF4444',
            refunded: '#3B82F6',
            draft: '#9AA0A6',
          };
          $item('#tripStatus').style.color = statusColors[data.status] || '#9AA0A6';
        } catch (e) {}
      }

      // Cancel button (only for confirmed upcoming)
      if ($item('#cancelBtn')) {
        if (data.status === 'confirmed' && activeTab === 'upcoming') {
          $item('#cancelBtn').expand();
          $item('#cancelBtn').onClick(async () => {
            $item('#cancelBtn').disable();
            try {
              await cancelBooking(TENANT_ID, data.bookingId, data.userId);
              loadTrips();
            } catch (e) {
              if ($item('#tripError')) $item('#tripError').text = e.message;
            }
            $item('#cancelBtn').enable();
          });
        } else {
          $item('#cancelBtn').collapse();
        }
      }

      // View details
      if ($item('#viewDetailsBtn')) {
        $item('#viewDetailsBtn').onClick(() => {
          wixLocation.to(`/my-trips/details/${data.bookingId}`);
        });
      }
    });
  }

  // ─── Initial Load ──────────────────────────────────────
  highlightTab();
  await loadTrips();
});
