/**
 * 5ATTH | خته — Admin Dashboard
 */
import wixSeo from 'wix-seo';
import wixUsers from 'wix-users';
import wixData from 'wix-data';
import { checkPermission } from 'backend/rbacService.web';

const TENANT_ID = 'default';

$w.onReady(async function () {
  wixSeo.title = 'لوحة التحكم | 5ATTH خته';

  const userId = wixUsers.currentUser.id;
  const allowed = await checkPermission(TENANT_ID, userId, 'dashboard_access');
  if (!allowed) {
    if ($w('#accessDenied')) $w('#accessDenied').expand();
    return;
  }

  // ─── KPIs ──────────────────────────────────────────────
  try {
    // Bookings stats
    const bookings = await wixData.query('bookings')
      .eq('tenantId', TENANT_ID)
      .find();
    const totalBookings = bookings.totalCount;
    const confirmedBookings = bookings.items.filter(b => b.status === 'confirmed').length;
    const pendingBookings = bookings.items.filter(b => b.status === 'pending_payment').length;

    if ($w('#kpiTotalBookings')) $w('#kpiTotalBookings').text = String(totalBookings);
    if ($w('#kpiConfirmed')) $w('#kpiConfirmed').text = String(confirmedBookings);
    if ($w('#kpiPending')) $w('#kpiPending').text = String(pendingBookings);

    // Revenue
    const payments = await wixData.query('payments')
      .eq('tenantId', TENANT_ID)
      .eq('status', 'paid')
      .find();
    const totalRevenue = payments.items.reduce((sum, p) => sum + (p.amount || 0), 0);
    if ($w('#kpiRevenue')) {
      $w('#kpiRevenue').text = `${(totalRevenue / 100).toLocaleString('ar-SA')} ر.س`;
      try { $w('#kpiRevenue').style.color = '#C9A227'; } catch (e) {}
    }

    // Leads
    const leads = await wixData.query('leads')
      .eq('tenantId', TENANT_ID)
      .descending('_createdDate')
      .limit(10)
      .find();
    if ($w('#kpiLeads')) $w('#kpiLeads').text = String(leads.totalCount);

    // Active providers
    const providers = await wixData.query('providers')
      .eq('tenantId', TENANT_ID)
      .eq('isActive', true)
      .find();
    if ($w('#kpiProviders')) $w('#kpiProviders').text = String(providers.totalCount);

  } catch (e) {
    console.log('Dashboard load error:', e);
  }

  // ─── Recent Bookings Table ─────────────────────────────
  try {
    const recent = await wixData.query('bookings')
      .eq('tenantId', TENANT_ID)
      .descending('_createdDate')
      .limit(10)
      .find();

    if ($w('#recentBookingsRepeater')) {
      $w('#recentBookingsRepeater').data = recent.items.map((b, i) => ({
        _id: String(i),
        ...b,
      }));

      $w('#recentBookingsRepeater').onItemReady(($item, data) => {
        if ($item('#rbId')) $item('#rbId').text = data.bookingId || '-';
        if ($item('#rbDate')) $item('#rbDate').text = new Date(data._createdDate).toLocaleDateString('ar-SA');
        if ($item('#rbAmount')) {
          $item('#rbAmount').text = `${data.amount} ${data.currency}`;
          try { $item('#rbAmount').style.color = '#C9A227'; } catch (e) {}
        }
        if ($item('#rbStatus')) {
          const labels = { confirmed: 'مؤكد', pending_payment: 'بانتظار الدفع', cancelled: 'ملغي', refunded: 'مسترد' };
          $item('#rbStatus').text = labels[data.status] || data.status;
        }
      });
    }
  } catch (e) {
    console.log('Recent bookings error:', e);
  }

  // ─── Recent Leads ──────────────────────────────────────
  try {
    const recentLeads = await wixData.query('leads')
      .eq('tenantId', TENANT_ID)
      .descending('_createdDate')
      .limit(5)
      .find();

    if ($w('#recentLeadsRepeater')) {
      $w('#recentLeadsRepeater').data = recentLeads.items.map((l, i) => ({
        _id: String(i),
        ...l,
      }));

      $w('#recentLeadsRepeater').onItemReady(($item, data) => {
        if ($item('#leadName')) $item('#leadName').text = data.name || '-';
        if ($item('#leadType')) $item('#leadType').text = data.type || '-';
        if ($item('#leadDate')) $item('#leadDate').text = new Date(data._createdDate).toLocaleDateString('ar-SA');
      });
    }
  } catch (e) {
    console.log('Leads error:', e);
  }

  // ─── Quick Nav ─────────────────────────────────────────
  const navLinks = {
    '#navBookings': '/admin/bookings',
    '#navCms': '/admin/cms',
    '#navIntegrations': '/admin/integrations',
    '#navPricing': '/admin/pricing',
    '#navNotifications': '/admin/notifications',
    '#navRoles': '/admin/roles',
    '#navAuditLogs': '/admin/audit-logs',
  };

  Object.entries(navLinks).forEach(([selector, path]) => {
    if ($w(selector)) {
      $w(selector).onClick(() => {
        import('wix-location').then(loc => loc.to(path));
      });
    }
  });
});
