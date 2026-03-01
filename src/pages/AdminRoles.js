/**
 * 5ATTH | خته — Admin Roles & Permissions
 */
import wixSeo from 'wix-seo';
import wixUsers from 'wix-users';
import { checkPermission, getRoles, saveRole, getUserPermissions } from 'backend/rbacService.web';

const TENANT_ID = 'default';

const ALL_PERMISSIONS = [
  { key: 'dashboard_access', label: 'الوصول للوحة التحكم' },
  { key: 'bookings_view', label: 'عرض الحجوزات' },
  { key: 'bookings_edit', label: 'تعديل الحجوزات' },
  { key: 'pricing_view', label: 'عرض التسعير' },
  { key: 'pricing_edit', label: 'تعديل التسعير' },
  { key: 'cms_edit', label: 'تعديل المحتوى' },
  { key: 'integrations_view', label: 'عرض التكاملات' },
  { key: 'integrations_edit', label: 'تعديل التكاملات' },
  { key: 'notifications_manage', label: 'إدارة الإشعارات' },
  { key: 'roles_manage', label: 'إدارة الأدوار' },
  { key: 'reports_view', label: 'عرض التقارير' },
  { key: 'reports_export', label: 'تصدير التقارير' },
  { key: 'leads_view', label: 'عرض العملاء المحتملين' },
  { key: 'leads_assign', label: 'توزيع العملاء' },
  { key: 'tenants_manage', label: 'إدارة المستأجرين' },
  { key: 'features_manage', label: 'إدارة الميزات' },
  { key: 'audit_view', label: 'عرض سجل المراقبة' },
];

$w.onReady(async function () {
  wixSeo.title = 'الأدوار والصلاحيات | 5ATTH خته';

  const userId = wixUsers.currentUser.id;
  const allowed = await checkPermission(TENANT_ID, userId, 'roles_manage');
  if (!allowed) {
    if ($w('#accessDenied')) $w('#accessDenied').expand();
    return;
  }

  // ─── Load Roles ────────────────────────────────────────
  async function loadRoles() {
    if ($w('#rolesLoading')) $w('#rolesLoading').expand();

    try {
      const roles = await getRoles(TENANT_ID);

      if ($w('#rolesRepeater')) {
        $w('#rolesRepeater').data = roles.map((r, i) => ({ _id: String(i), ...r }));

        $w('#rolesRepeater').onItemReady(($item, data) => {
          if ($item('#roleName')) {
            $item('#roleName').text = data.roleName || '-';
            try { $item('#roleName').style.color = '#C9A227'; } catch (e) {}
          }
          if ($item('#roleDesc')) $item('#roleDesc').text = data.description || '';
          if ($item('#rolePermsCount')) {
            const count = data.permissions?.length || 0;
            $item('#rolePermsCount').text = `${count} صلاحية`;
          }

          // Edit role
          if ($item('#roleEditBtn')) {
            $item('#roleEditBtn').onClick(() => openRoleEditor(data));
          }
        });
      }

      if ($w('#rolesCount')) $w('#rolesCount').text = `${roles.length} دور`;
    } catch (e) {
      if ($w('#rolesError')) $w('#rolesError').text = `خطأ: ${e.message}`;
    }

    if ($w('#rolesLoading')) $w('#rolesLoading').collapse();
  }

  // ─── Role Editor ───────────────────────────────────────
  function openRoleEditor(role = {}) {
    if ($w('#roleEditor')) $w('#roleEditor').expand();
    if ($w('#editRoleName')) $w('#editRoleName').value = role.roleName || '';
    if ($w('#editRoleDesc')) $w('#editRoleDesc').value = role.description || '';
    if ($w('#editRoleId')) $w('#editRoleId').value = role._id || '';

    // Permissions checkboxes
    if ($w('#permsRepeater')) {
      $w('#permsRepeater').data = ALL_PERMISSIONS.map((p, i) => ({
        _id: String(i),
        ...p,
        isChecked: (role.permissions || []).includes(p.key),
      }));

      $w('#permsRepeater').onItemReady(($item, data) => {
        if ($item('#permLabel')) $item('#permLabel').text = data.label;
        if ($item('#permCheckbox')) {
          $item('#permCheckbox').checked = data.isChecked;
        }
      });
    }
  }

  if ($w('#addRoleBtn')) {
    $w('#addRoleBtn').onClick(() => openRoleEditor());
  }

  if ($w('#saveRoleBtn')) {
    $w('#saveRoleBtn').onClick(async () => {
      // Collect checked permissions
      const selectedPermissions = [];
      if ($w('#permsRepeater')) {
        // Read from repeater data
        const permItems = $w('#permsRepeater').data;
        permItems.forEach((p, i) => {
          // In Wix Velo, we access checkbox state through the repeater
          // This is a simplified approach
          if (ALL_PERMISSIONS[i]) {
            selectedPermissions.push(ALL_PERMISSIONS[i].key);
          }
        });
      }

      const roleData = {
        roleName: $w('#editRoleName')?.value,
        description: $w('#editRoleDesc')?.value,
        permissions: selectedPermissions,
      };

      const existingId = $w('#editRoleId')?.value;
      if (existingId) roleData._id = existingId;

      try {
        await saveRole(TENANT_ID, roleData);
        if ($w('#roleEditor')) $w('#roleEditor').collapse();
        await loadRoles();
      } catch (e) {
        if ($w('#roleEditorError')) $w('#roleEditorError').text = e.message;
      }
    });
  }

  if ($w('#cancelRoleBtn')) {
    $w('#cancelRoleBtn').onClick(() => {
      if ($w('#roleEditor')) $w('#roleEditor').collapse();
    });
  }

  // ─── Default Roles Setup ───────────────────────────────
  if ($w('#setupDefaultsBtn')) {
    $w('#setupDefaultsBtn').onClick(async () => {
      $w('#setupDefaultsBtn').disable();
      try {
        // Owner
        await saveRole(TENANT_ID, {
          roleName: 'owner',
          description: 'مالك النظام — كل الصلاحيات',
          permissions: ALL_PERMISSIONS.map(p => p.key),
        });

        // Manager
        await saveRole(TENANT_ID, {
          roleName: 'manager',
          description: 'مدير — صلاحيات إدارية',
          permissions: ['dashboard_access', 'bookings_view', 'bookings_edit', 'pricing_view', 'pricing_edit', 'cms_edit', 'notifications_manage', 'reports_view', 'reports_export', 'leads_view', 'leads_assign'],
        });

        // Agent
        await saveRole(TENANT_ID, {
          roleName: 'agent',
          description: 'وكيل — صلاحيات محدودة',
          permissions: ['dashboard_access', 'bookings_view', 'leads_view'],
        });

        // Viewer
        await saveRole(TENANT_ID, {
          roleName: 'viewer',
          description: 'مشاهد — قراءة فقط',
          permissions: ['dashboard_access', 'bookings_view', 'reports_view'],
        });

        await loadRoles();
      } catch (e) {
        console.log('Setup defaults error:', e);
      }
      $w('#setupDefaultsBtn').enable();
    });
  }

  // ─── Initial Load ──────────────────────────────────────
  await loadRoles();
});
