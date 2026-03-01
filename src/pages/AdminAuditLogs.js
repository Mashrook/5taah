/**
 * 5ATTH | خته — Admin Audit Logs
 */
import wixSeo from 'wix-seo';
import wixUsers from 'wix-users';
import wixData from 'wix-data';
import { checkPermission } from 'backend/rbacService.web';

const TENANT_ID = 'default';

$w.onReady(async function () {
  wixSeo.title = 'سجل المراقبة | 5ATTH خته';

  const userId = wixUsers.currentUser.id;
  const allowed = await checkPermission(TENANT_ID, userId, 'audit_view');
  if (!allowed) {
    if ($w('#accessDenied')) $w('#accessDenied').expand();
    return;
  }

  let currentPage = 0;
  const pageSize = 30;
  let actionFilter = 'all';
  let providerFilter = 'all';

  // ─── Filters ───────────────────────────────────────────
  if ($w('#filterAction')) {
    $w('#filterAction').onChange(() => {
      actionFilter = $w('#filterAction').value || 'all';
      currentPage = 0;
      loadLogs();
    });
  }
  if ($w('#filterProvider')) {
    $w('#filterProvider').onChange(() => {
      providerFilter = $w('#filterProvider').value || 'all';
      currentPage = 0;
      loadLogs();
    });
  }
  if ($w('#filterDateFrom')) {
    $w('#filterDateFrom').onChange(() => { currentPage = 0; loadLogs(); });
  }
  if ($w('#filterDateTo')) {
    $w('#filterDateTo').onChange(() => { currentPage = 0; loadLogs(); });
  }

  // ─── Load Logs ─────────────────────────────────────────
  async function loadLogs() {
    if ($w('#auditLoading')) $w('#auditLoading').expand();

    try {
      let query = wixData.query('provider_audit_logs')
        .eq('tenantId', TENANT_ID)
        .descending('_createdDate')
        .skip(currentPage * pageSize)
        .limit(pageSize);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }
      if (providerFilter !== 'all') {
        query = query.eq('providerName', providerFilter);
      }

      const dateFrom = $w('#filterDateFrom')?.value;
      const dateTo = $w('#filterDateTo')?.value;
      if (dateFrom) query = query.ge('_createdDate', new Date(dateFrom));
      if (dateTo) query = query.le('_createdDate', new Date(dateTo));

      const results = await query.find();

      if ($w('#auditCount')) $w('#auditCount').text = `${results.totalCount} سجل`;

      renderLogs(results.items);

      // Pagination
      if ($w('#auditPrev')) {
        $w('#auditPrev')[currentPage > 0 ? 'enable' : 'disable']();
        $w('#auditPrev').onClick(() => { currentPage--; loadLogs(); });
      }
      if ($w('#auditNext')) {
        $w('#auditNext')[results.hasNext() ? 'enable' : 'disable']();
        $w('#auditNext').onClick(() => { currentPage++; loadLogs(); });
      }
      if ($w('#auditPage')) $w('#auditPage').text = `صفحة ${currentPage + 1}`;

    } catch (e) {
      if ($w('#auditError')) $w('#auditError').text = `خطأ: ${e.message}`;
    }

    if ($w('#auditLoading')) $w('#auditLoading').collapse();
  }

  function renderLogs(logs) {
    if (!$w('#auditRepeater')) return;

    $w('#auditRepeater').data = logs.map((l, i) => ({ _id: String(i), ...l }));

    $w('#auditRepeater').onItemReady(($item, data) => {
      if ($item('#logDate')) {
        $item('#logDate').text = new Date(data._createdDate).toLocaleString('ar-SA');
      }
      if ($item('#logAction')) {
        $item('#logAction').text = data.action || '-';
        try {
          const actionColors = {
            credential_saved: '#22C55E',
            credential_rotated: '#3B82F6',
            credential_disabled: '#EF4444',
            provider_toggled: '#EAB308',
            connection_tested: '#8B5CF6',
            endpoint_saved: '#06B6D4',
          };
          $item('#logAction').style.color = actionColors[data.action] || '#9AA0A6';
        } catch (e) {}
      }
      if ($item('#logProvider')) $item('#logProvider').text = data.providerName || '-';
      if ($item('#logUser')) $item('#logUser').text = data.performedBy || '-';
      if ($item('#logDetails')) {
        const details = data.details ? JSON.stringify(data.details) : '';
        // Mask sensitive values
        $item('#logDetails').text = details.replace(/"(secret|password|token|key)":"[^"]+"/gi, '"$1":"***"');
      }

      // IP / Environment
      if ($item('#logEnv')) $item('#logEnv').text = data.environment || 'production';
    });
  }

  // ─── Export ────────────────────────────────────────────
  if ($w('#exportAuditBtn')) {
    $w('#exportAuditBtn').onClick(async () => {
      const canExport = await checkPermission(TENANT_ID, userId, 'reports_export');
      if (!canExport) return;
      // CSV export
      try {
        const all = await wixData.query('provider_audit_logs')
          .eq('tenantId', TENANT_ID)
          .descending('_createdDate')
          .limit(1000)
          .find();

        const csv = [
          'التاريخ,الإجراء,المزود,المنفذ,البيئة',
          ...all.items.map(l =>
            `${new Date(l._createdDate).toLocaleString('ar-SA')},${l.action},${l.providerName},${l.performedBy},${l.environment || ''}`
          ),
        ].join('\n');

        // In Wix Velo, downloading a file requires a backend endpoint
        console.log('Audit CSV generated, length:', csv.length);
        if ($w('#exportStatus')) $w('#exportStatus').text = `تم تجميع ${all.items.length} سجل للتصدير`;
      } catch (e) {
        console.log('Export error:', e);
      }
    });
  }

  // ─── Stats ─────────────────────────────────────────────
  async function loadStats() {
    try {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentLogs = await wixData.query('provider_audit_logs')
        .eq('tenantId', TENANT_ID)
        .ge('_createdDate', last24h)
        .find();

      if ($w('#statTotal24h')) $w('#statTotal24h').text = String(recentLogs.totalCount);

      const actions = {};
      recentLogs.items.forEach(l => {
        actions[l.action] = (actions[l.action] || 0) + 1;
      });

      if ($w('#statTopAction')) {
        const topAction = Object.entries(actions).sort((a, b) => b[1] - a[1])[0];
        $w('#statTopAction').text = topAction ? `${topAction[0]} (${topAction[1]})` : '-';
      }
    } catch (e) {
      console.log('Stats error:', e);
    }
  }

  // ─── Initial Load ──────────────────────────────────────
  await Promise.all([loadLogs(), loadStats()]);
});
