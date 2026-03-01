/**
 * 5ATTH | خته — Admin Notifications Management
 */
import wixSeo from 'wix-seo';
import wixUsers from 'wix-users';
import wixData from 'wix-data';
import { checkPermission } from 'backend/rbacService.web';
import { sendNotification } from 'backend/notificationService.web';

const TENANT_ID = 'default';

$w.onReady(async function () {
  wixSeo.title = 'إدارة الإشعارات | 5ATTH خته';

  const userId = wixUsers.currentUser.id;
  const allowed = await checkPermission(TENANT_ID, userId, 'notifications_manage');
  if (!allowed) {
    if ($w('#accessDenied')) $w('#accessDenied').expand();
    return;
  }

  let activeTab = 'log';

  // ─── Tab Switching ─────────────────────────────────────
  if ($w('#tabLog')) {
    $w('#tabLog').onClick(() => { activeTab = 'log'; updateView(); });
  }
  if ($w('#tabSend')) {
    $w('#tabSend').onClick(() => { activeTab = 'send'; updateView(); });
  }

  function updateView() {
    if ($w('#logSection')) $w('#logSection')[activeTab === 'log' ? 'expand' : 'collapse']();
    if ($w('#sendSection')) $w('#sendSection')[activeTab === 'send' ? 'expand' : 'collapse']();

    ['#tabLog', '#tabSend'].forEach(t => {
      if ($w(t)) {
        try {
          const isActive = (t === '#tabLog' && activeTab === 'log') || (t === '#tabSend' && activeTab === 'send');
          $w(t).style.backgroundColor = isActive ? '#C9A227' : '#1E1E27';
          $w(t).style.color = isActive ? '#0E0E12' : '#9AA0A6';
        } catch (e) {}
      }
    });
  }

  // ─── Notifications Log ─────────────────────────────────
  let currentPage = 0;
  const pageSize = 20;
  let channelFilter = 'all';

  if ($w('#filterAll')) $w('#filterAll').onClick(() => { channelFilter = 'all'; currentPage = 0; loadLog(); });
  if ($w('#filterPush')) $w('#filterPush').onClick(() => { channelFilter = 'push'; currentPage = 0; loadLog(); });
  if ($w('#filterEmail')) $w('#filterEmail').onClick(() => { channelFilter = 'email'; currentPage = 0; loadLog(); });
  if ($w('#filterSms')) $w('#filterSms').onClick(() => { channelFilter = 'sms'; currentPage = 0; loadLog(); });

  async function loadLog() {
    if ($w('#logLoading')) $w('#logLoading').expand();

    try {
      let query = wixData.query('notifications_log')
        .eq('tenantId', TENANT_ID)
        .descending('_createdDate')
        .skip(currentPage * pageSize)
        .limit(pageSize);

      if (channelFilter !== 'all') {
        query = query.eq('channel', channelFilter);
      }

      const results = await query.find();

      if ($w('#logCount')) $w('#logCount').text = `${results.totalCount} إشعار`;

      if ($w('#logRepeater')) {
        $w('#logRepeater').data = results.items.map((n, i) => ({ _id: String(i), ...n }));

        $w('#logRepeater').onItemReady(($item, data) => {
          if ($item('#notifChannel')) {
            const channelLabels = { push: '📱 إشعار', email: '📧 بريد', sms: '💬 رسالة' };
            $item('#notifChannel').text = channelLabels[data.channel] || data.channel;
          }
          if ($item('#notifRecipient')) $item('#notifRecipient').text = data.recipientId || '-';
          if ($item('#notifSubject')) $item('#notifSubject').text = data.subject || data.title || '-';
          if ($item('#notifDate')) $item('#notifDate').text = new Date(data._createdDate).toLocaleString('ar-SA');
          if ($item('#notifStatus')) {
            $item('#notifStatus').text = data.deliveryStatus === 'sent' ? 'تم الإرسال' : data.deliveryStatus === 'failed' ? 'فشل' : 'معلق';
            try {
              $item('#notifStatus').style.color = data.deliveryStatus === 'sent' ? '#22C55E' : data.deliveryStatus === 'failed' ? '#EF4444' : '#EAB308';
            } catch (e) {}
          }
        });
      }

      // Pagination
      if ($w('#logPrev')) {
        $w('#logPrev')[currentPage > 0 ? 'enable' : 'disable']();
        $w('#logPrev').onClick(() => { currentPage--; loadLog(); });
      }
      if ($w('#logNext')) {
        $w('#logNext')[results.hasNext() ? 'enable' : 'disable']();
        $w('#logNext').onClick(() => { currentPage++; loadLog(); });
      }

    } catch (e) {
      if ($w('#logError')) $w('#logError').text = `خطأ: ${e.message}`;
    }

    if ($w('#logLoading')) $w('#logLoading').collapse();
  }

  // ─── Send Notification ─────────────────────────────────
  if ($w('#sendNotifBtn')) {
    $w('#sendNotifBtn').onClick(async () => {
      const channel = $w('#sendChannel')?.value || 'push';
      const recipient = $w('#sendRecipient')?.value;
      const title = $w('#sendTitle')?.value;
      const body = $w('#sendBody')?.value;

      if (!recipient || !title) {
        if ($w('#sendError')) $w('#sendError').text = 'يرجى تعبئة المستلم والعنوان';
        return;
      }

      $w('#sendNotifBtn').disable();
      if ($w('#sendStatus')) $w('#sendStatus').text = 'جاري الإرسال...';

      try {
        await sendNotification(TENANT_ID, {
          channel,
          recipientId: recipient,
          title,
          body,
          data: {},
        });
        if ($w('#sendStatus')) {
          $w('#sendStatus').text = 'تم الإرسال بنجاح ✅';
          try { $w('#sendStatus').style.color = '#22C55E'; } catch (e) {}
        }
        // Clear form
        if ($w('#sendRecipient')) $w('#sendRecipient').value = '';
        if ($w('#sendTitle')) $w('#sendTitle').value = '';
        if ($w('#sendBody')) $w('#sendBody').value = '';
      } catch (e) {
        if ($w('#sendError')) $w('#sendError').text = `خطأ: ${e.message}`;
      }

      $w('#sendNotifBtn').enable();
    });
  }

  // ─── Initial Load ──────────────────────────────────────
  updateView();
  await loadLog();
});
