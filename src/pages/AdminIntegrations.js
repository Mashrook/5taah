/**
 * 5ATTH | خته — Admin Integrations (Provider Management)
 */
import wixSeo from 'wix-seo';
import wixUsers from 'wix-users';
import { checkPermission } from 'backend/rbacService.web';
import {
  getProviders,
  saveProviderEndpoint,
  toggleProvider,
  getProviderCredentials,
  saveCredential,
  rotateCredential,
  disableCredential,
  testProviderConnection,
  getAuditLogs,
} from 'backend/integrationsAdmin.web';

const TENANT_ID = 'default';

$w.onReady(async function () {
  wixSeo.title = 'إدارة التكاملات | 5ATTH خته';

  const userId = wixUsers.currentUser.id;
  const allowed = await checkPermission(TENANT_ID, userId, 'integrations_view');
  if (!allowed) {
    if ($w('#accessDenied')) $w('#accessDenied').expand();
    return;
  }

  const canEdit = await checkPermission(TENANT_ID, userId, 'integrations_edit');

  // ─── Load Providers ────────────────────────────────────
  async function loadProviders() {
    if ($w('#intLoading')) $w('#intLoading').expand();

    try {
      const providers = await getProviders(TENANT_ID);

      if ($w('#providersRepeater')) {
        $w('#providersRepeater').data = providers.map((p, i) => ({ _id: String(i), ...p }));

        $w('#providersRepeater').onItemReady(($item, data) => {
          // Provider name & type
          if ($item('#provName')) $item('#provName').text = data.providerName || '-';
          if ($item('#provType')) $item('#provType').text = data.providerType || '-';

          // Status
          if ($item('#provStatus')) {
            $item('#provStatus').text = data.isActive ? 'نشط' : 'معطل';
            try {
              $item('#provStatus').style.color = data.isActive ? '#22C55E' : '#EF4444';
            } catch (e) {}
          }

          // Priority
          if ($item('#provPriority')) $item('#provPriority').text = `أولوية: ${data.priority || 0}`;

          // Feature flag
          if ($item('#provFeatureFlag')) {
            $item('#provFeatureFlag').text = data.featureFlagRequired ? `🏴 ${data.featureFlagRequired}` : '';
          }

          // Toggle button
          if ($item('#provToggleBtn') && canEdit) {
            $item('#provToggleBtn').label = data.isActive ? 'تعطيل' : 'تفعيل';
            $item('#provToggleBtn').onClick(async () => {
              $item('#provToggleBtn').disable();
              try {
                await toggleProvider(TENANT_ID, data.providerName, !data.isActive);
                await loadProviders();
              } catch (e) {
                console.log('Toggle error:', e);
              }
              $item('#provToggleBtn').enable();
            });
          } else if ($item('#provToggleBtn')) {
            $item('#provToggleBtn').collapse();
          }

          // Test Connection
          if ($item('#provTestBtn')) {
            $item('#provTestBtn').onClick(async () => {
              $item('#provTestBtn').disable();
              if ($item('#provTestResult')) $item('#provTestResult').text = 'جاري الاختبار...';
              try {
                const result = await testProviderConnection(TENANT_ID, data.providerName);
                if ($item('#provTestResult')) {
                  $item('#provTestResult').text = result.ok ? '✅ متصل' : `❌ ${result.error}`;
                  try {
                    $item('#provTestResult').style.color = result.ok ? '#22C55E' : '#EF4444';
                  } catch (e) {}
                }
              } catch (e) {
                if ($item('#provTestResult')) $item('#provTestResult').text = `❌ ${e.message}`;
              }
              $item('#provTestBtn').enable();
            });
          }

          // View Credentials (masked)
          if ($item('#provCredsBtn')) {
            $item('#provCredsBtn').onClick(async () => {
              try {
                const creds = await getProviderCredentials(TENANT_ID, data.providerName);
                showCredentialsModal(data.providerName, creds);
              } catch (e) {
                console.log('Creds error:', e);
              }
            });
          }

          // Endpoints
          if ($item('#provEndpointsBtn')) {
            $item('#provEndpointsBtn').onClick(() => {
              showEndpointsModal(data);
            });
          }
        });
      }
    } catch (e) {
      if ($w('#intError')) $w('#intError').text = `خطأ: ${e.message}`;
    }

    if ($w('#intLoading')) $w('#intLoading').collapse();
  }

  // ─── Credentials Modal ─────────────────────────────────
  function showCredentialsModal(providerName, creds) {
    if ($w('#credsModal')) $w('#credsModal').expand();
    if ($w('#credsProviderName')) $w('#credsProviderName').text = providerName;

    if ($w('#credsRepeater')) {
      $w('#credsRepeater').data = creds.map((c, i) => ({ _id: String(i), ...c }));
      $w('#credsRepeater').onItemReady(($item, data) => {
        if ($item('#credKey')) $item('#credKey').text = data.credentialKey || '-';
        if ($item('#credValue')) $item('#credValue').text = data.maskedValue || '******';
        if ($item('#credEnv')) $item('#credEnv').text = data.environment || 'production';
        if ($item('#credActive')) {
          $item('#credActive').text = data.isActive ? 'نشط' : 'معطل';
          try { $item('#credActive').style.color = data.isActive ? '#22C55E' : '#EF4444'; } catch (e) {}
        }

        // Rotate
        if ($item('#credRotateBtn') && canEdit) {
          $item('#credRotateBtn').onClick(async () => {
            const newVal = $item('#credNewValue')?.value;
            if (!newVal) return;
            try {
              await rotateCredential(TENANT_ID, providerName, data.credentialKey, newVal);
              if ($item('#credNewValue')) $item('#credNewValue').value = '';
              const updated = await getProviderCredentials(TENANT_ID, providerName);
              showCredentialsModal(providerName, updated);
            } catch (e) {
              console.log('Rotate error:', e);
            }
          });
        }

        // Disable
        if ($item('#credDisableBtn') && canEdit) {
          $item('#credDisableBtn').onClick(async () => {
            try {
              await disableCredential(TENANT_ID, providerName, data.credentialKey);
              const updated = await getProviderCredentials(TENANT_ID, providerName);
              showCredentialsModal(providerName, updated);
            } catch (e) {
              console.log('Disable error:', e);
            }
          });
        }
      });
    }
  }

  if ($w('#closeCredsModal')) {
    $w('#closeCredsModal').onClick(() => {
      if ($w('#credsModal')) $w('#credsModal').collapse();
    });
  }

  // ─── Add Credential ────────────────────────────────────
  if ($w('#addCredBtn') && canEdit) {
    $w('#addCredBtn').onClick(async () => {
      const providerName = $w('#credsProviderName')?.text;
      const key = $w('#newCredKey')?.value;
      const value = $w('#newCredValue')?.value;
      const env = $w('#newCredEnv')?.value || 'production';

      if (!key || !value) return;

      try {
        await saveCredential(TENANT_ID, providerName, key, value, env);
        if ($w('#newCredKey')) $w('#newCredKey').value = '';
        if ($w('#newCredValue')) $w('#newCredValue').value = '';
        const updated = await getProviderCredentials(TENANT_ID, providerName);
        showCredentialsModal(providerName, updated);
      } catch (e) {
        console.log('Add credential error:', e);
      }
    });
  }

  // ─── Endpoints Modal ──────────────────────────────────
  function showEndpointsModal(provider) {
    if ($w('#endpointsModal')) $w('#endpointsModal').expand();
    if ($w('#endpProviderName')) $w('#endpProviderName').text = provider.providerName;

    // Pre-fill
    if ($w('#endpBaseUrl')) $w('#endpBaseUrl').value = '';
    if ($w('#endpAuthUrl')) $w('#endpAuthUrl').value = '';
    if ($w('#endpSearchUrl')) $w('#endpSearchUrl').value = '';
    if ($w('#endpBookUrl')) $w('#endpBookUrl').value = '';
    if ($w('#endpFallbackUrl')) $w('#endpFallbackUrl').value = provider.fallbackUrl || '';
  }

  if ($w('#saveEndpointsBtn') && canEdit) {
    $w('#saveEndpointsBtn').onClick(async () => {
      const providerName = $w('#endpProviderName')?.text;
      const endpointData = {
        baseUrl: $w('#endpBaseUrl')?.value,
        authUrl: $w('#endpAuthUrl')?.value,
        searchUrl: $w('#endpSearchUrl')?.value,
        bookUrl: $w('#endpBookUrl')?.value,
        fallbackUrl: $w('#endpFallbackUrl')?.value,
        env: 'production',
      };

      try {
        await saveProviderEndpoint(TENANT_ID, providerName, endpointData);
        if ($w('#endpointsModal')) $w('#endpointsModal').collapse();
        await loadProviders();
      } catch (e) {
        console.log('Save endpoints error:', e);
      }
    });
  }

  if ($w('#closeEndpointsModal')) {
    $w('#closeEndpointsModal').onClick(() => {
      if ($w('#endpointsModal')) $w('#endpointsModal').collapse();
    });
  }

  // ─── Audit Log Preview ─────────────────────────────────
  if ($w('#provAuditBtn')) {
    $w('#provAuditBtn').onClick(async () => {
      try {
        const logs = await getAuditLogs(TENANT_ID, { limit: 20 });
        // Show in a simple text area
        if ($w('#auditPreview')) {
          $w('#auditPreview').value = logs.map(l =>
            `[${new Date(l._createdDate).toLocaleString('ar-SA')}] ${l.action} — ${l.providerName} — ${l.performedBy}`
          ).join('\n');
          $w('#auditPreview').expand();
        }
      } catch (e) {
        console.log('Audit log error:', e);
      }
    });
  }

  // ─── Initial Load ──────────────────────────────────────
  await loadProviders();
});
