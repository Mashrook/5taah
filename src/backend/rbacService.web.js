/**
 * 5ATTH | خته — RBAC Service (Backend)
 * Permission checks on every backend action
 */
import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';

// Permission keys
export const PERMISSIONS = {
  MANAGE_PROVIDERS: 'manage_providers',
  MANAGE_API_KEYS: 'manage_api_keys',
  ROTATE_KEYS: 'rotate_keys',
  TEST_CONNECTIONS: 'test_connections',
  MANAGE_PAYMENTS: 'manage_payments',
  MANAGE_NOTIFICATIONS: 'manage_notifications',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_BOOKINGS: 'manage_bookings',
  MANAGE_CMS: 'manage_cms',
  MANAGE_OFFERS: 'manage_offers',
  MANAGE_MARKUP: 'manage_markup',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_MEMBERS: 'manage_members',
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_REPORTS: 'view_reports',
  MANAGE_TENANTS: 'manage_tenants',
  MANAGE_FEATURE_FLAGS: 'manage_feature_flags',
};

export async function checkPermission(userId, tenantId, permissionKey) {
  // Get user's role in tenant
  const membership = await wixData.query('tenant_members')
    .eq('userId', userId)
    .eq('tenantId', tenantId)
    .find();

  if (!membership.items.length) {
    throw new Error('غير مصرح - ليس لديك عضوية في هذا المؤسسة');
  }

  const role = membership.items[0].role;

  // Owner has all permissions
  if (role === 'owner') return true;

  // Get role ID
  const roles = await wixData.query('roles')
    .eq('name', role)
    .eq('tenantId', tenantId)
    .find();

  if (!roles.items.length) {
    throw new Error('الدور غير موجود');
  }

  // Check role permissions
  const rolePerms = await wixData.query('role_permissions')
    .eq('roleId', roles.items[0]._id)
    .eq('permissionKey', permissionKey)
    .find();

  if (!rolePerms.items.length) {
    throw new Error(`غير مصرح - لا تملك صلاحية: ${permissionKey}`);
  }

  return true;
}

export const getUserPermissions = webMethod(
  Permissions.SiteMember,
  async (userId, tenantId) => {
    const membership = await wixData.query('tenant_members')
      .eq('userId', userId)
      .eq('tenantId', tenantId)
      .find();

    if (!membership.items.length) return { role: null, permissions: [] };

    const role = membership.items[0].role;
    if (role === 'owner') return { role, permissions: Object.values(PERMISSIONS) };

    const roles = await wixData.query('roles')
      .eq('name', role)
      .eq('tenantId', tenantId)
      .find();

    if (!roles.items.length) return { role, permissions: [] };

    const rolePerms = await wixData.query('role_permissions')
      .eq('roleId', roles.items[0]._id)
      .find();

    return {
      role,
      permissions: rolePerms.items.map(p => p.permissionKey),
    };
  }
);

export const getRoles = webMethod(
  Permissions.SiteMember,
  async (tenantId) => {
    const roles = await wixData.query('roles')
      .eq('tenantId', tenantId)
      .find();

    const result = [];
    for (const role of roles.items) {
      const perms = await wixData.query('role_permissions')
        .eq('roleId', role._id)
        .find();
      result.push({
        ...role,
        permissions: perms.items.map(p => p.permissionKey),
      });
    }
    return result;
  }
);

// ─── DB-backed Rate Limiting ──────────────────────────
export const enforceRateLimit = webMethod(
  Permissions.Anyone,
  async (ip, action, maxPerMinute = 20) => {
    const windowMs = 60 * 1000;
    const since = new Date(Date.now() - windowMs);

    const results = await wixData.query('RateLimits')
      .eq('ip', ip)
      .eq('action', action)
      .ge('createdAt', since)
      .find();

    if (results.items.length >= maxPerMinute) {
      throw new Error('Rate limit exceeded');
    }

    await wixData.insert('RateLimits', {
      ip,
      action,
      createdAt: new Date(),
    });

    return { allowed: true, remaining: maxPerMinute - results.items.length - 1 };
  }
);

export const saveRole = webMethod(
  Permissions.SiteMember,
  async (userId, tenantId, roleData) => {
    await checkPermission(userId, tenantId, PERMISSIONS.MANAGE_ROLES);

    let role;
    if (roleData._id) {
      role = await wixData.update('roles', {
        _id: roleData._id,
        name: roleData.name,
        description: roleData.description,
        tenantId,
        createdAt: roleData.createdAt || new Date(),
      });
    } else {
      role = await wixData.insert('roles', {
        name: roleData.name,
        description: roleData.description,
        tenantId,
        createdAt: new Date(),
      });
    }

    // Update permissions
    const existing = await wixData.query('role_permissions')
      .eq('roleId', role._id)
      .find();

    // Remove old
    for (const ep of existing.items) {
      await wixData.remove('role_permissions', ep._id);
    }

    // Add new
    for (const perm of (roleData.permissions || [])) {
      await wixData.insert('role_permissions', {
        roleId: role._id,
        permissionKey: perm,
        createdAt: new Date(),
      });
    }

    return role;
  }
);
