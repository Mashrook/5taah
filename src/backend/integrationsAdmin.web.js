/**
 * 5ATTH | خته — Integrations Admin Service (Backend)
 * Manage providers, endpoints, credentials — no secrets returned to UI
 */
import { Permissions, webMethod } from 'wix-web-module';
import { secrets } from 'wix-secrets-backend';
import wixData from 'wix-data';
import { checkPermission, PERMISSIONS } from './rbacService.web';
import { logProviderAudit } from './providers/providerBase';
import * as amadeus from './providers/amadeus.adapter';
import * as sabre from './providers/sabre.adapter';
import * as travelport from './providers/travelport.adapter';
import * as skyscanner from './providers/skyscanner.adapter';

const adapters = { amadeus, sabre, travelport, skyscanner };

// ─── Providers ─────────────────────────────────────────────

export const getProviders = webMethod(
  Permissions.SiteMember,
  async (userId, tenantId) => {
    await checkPermission(userId, tenantId, PERMISSIONS.MANAGE_PROVIDERS);
    const providers = await wixData.query('providers').find();

    // Get endpoints for each
    const endpoints = await wixData.query('provider_endpoints')
      .eq('tenantId', tenantId)
      .find();

    return providers.items.map(p => ({
      ...p,
      endpoints: endpoints.items.filter(ep => ep.providerName === p.name),
    }));
  }
);

export const saveProviderEndpoint = webMethod(
  Permissions.SiteMember,
  async (userId, tenantId, endpointData) => {
    await checkPermission(userId, tenantId, PERMISSIONS.MANAGE_PROVIDERS);

    const data = {
      tenantId,
      providerName: endpointData.providerName,
      environment: endpointData.environment,
      baseUrl: endpointData.baseUrl,
      fallbackUrl: endpointData.fallbackUrl || '',
      enabled: endpointData.enabled !== false,
      priority: endpointData.priority || 0,
      updatedAt: new Date(),
    };

    let result;
    if (endpointData._id) {
      const old = await wixData.get('provider_endpoints', endpointData._id);
      result = await wixData.update('provider_endpoints', { ...data, _id: endpointData._id });
      await logProviderAudit(tenantId, endpointData.providerName, userId, 'UPDATE_URL', old, result);
    } else {
      result = await wixData.insert('provider_endpoints', data);
      await logProviderAudit(tenantId, endpointData.providerName, userId, 'CREATE_URL', null, result);
    }
    return result;
  }
);

export const toggleProvider = webMethod(
  Permissions.SiteMember,
  async (userId, tenantId, endpointId, enabled) => {
    await checkPermission(userId, tenantId, PERMISSIONS.MANAGE_PROVIDERS);

    const endpoint = await wixData.get('provider_endpoints', endpointId);
    if (!endpoint) throw new Error('Endpoint not found');

    const old = { ...endpoint };
    endpoint.enabled = enabled;
    endpoint.updatedAt = new Date();
    await wixData.update('provider_endpoints', endpoint);

    const action = enabled ? 'ENABLE_PROVIDER' : 'DISABLE_PROVIDER';
    await logProviderAudit(tenantId, endpoint.providerName, userId, action, old, endpoint);
    return endpoint;
  }
);

// ─── Credentials (MASKED) ─────────────────────────────────

export const getProviderCredentials = webMethod(
  Permissions.SiteMember,
  async (userId, tenantId, providerName) => {
    await checkPermission(userId, tenantId, PERMISSIONS.MANAGE_API_KEYS);

    const creds = await wixData.query('provider_credentials')
      .eq('tenantId', tenantId)
      .eq('providerName', providerName)
      .find();

    // NEVER return secret values — mask them
    return creds.items.map(c => ({
      _id: c._id,
      keyName: c.keyName,
      isSecret: c.isSecret,
      isActive: c.isActive,
      rotatedAt: c.rotatedAt,
      createdAt: c.createdAt,
      maskedValue: c.isSecret
        ? '••••••••••••'
        : (c.plainValue ? c.plainValue.slice(0, 4) + '••••••••' : ''),
    }));
  }
);

export const saveCredential = webMethod(
  Permissions.SiteMember,
  async (userId, tenantId, credData) => {
    await checkPermission(userId, tenantId, PERMISSIONS.MANAGE_API_KEYS);

    const data = {
      tenantId,
      providerName: credData.providerName,
      keyName: credData.keyName,
      isSecret: credData.isSecret !== false,
      isActive: credData.isActive !== false,
      createdAt: new Date(),
    };

    if (credData.isSecret && credData.value) {
      // Store in Wix Secrets Manager
      const secretName = `${tenantId}_${credData.providerName}_${credData.keyName}`;
      try {
        await secrets.createSecret(secretName, credData.value);
      } catch {
        // Secret might already exist, update it
        await secrets.updateSecret(secretName, credData.value);
      }
      data.secretRefName = secretName;
      data.plainValue = '';
    } else {
      data.secretRefName = '';
      data.plainValue = credData.value || '';
    }

    let result;
    if (credData._id) {
      result = await wixData.update('provider_credentials', { ...data, _id: credData._id });
      await logProviderAudit(tenantId, credData.providerName, userId, 'UPDATE_KEY', { keyName: credData.keyName }, { keyName: credData.keyName, isActive: data.isActive });
    } else {
      result = await wixData.insert('provider_credentials', data);
      await logProviderAudit(tenantId, credData.providerName, userId, 'CREATE_KEY', null, { keyName: credData.keyName });
    }
    return { _id: result._id, keyName: result.keyName, isSecret: result.isSecret, isActive: result.isActive };
  }
);

export const rotateCredential = webMethod(
  Permissions.SiteMember,
  async (userId, tenantId, credId, newValue) => {
    await checkPermission(userId, tenantId, PERMISSIONS.ROTATE_KEYS);

    const cred = await wixData.get('provider_credentials', credId);
    if (!cred) throw new Error('Credential not found');

    if (cred.isSecret) {
      const secretName = `${tenantId}_${cred.providerName}_${cred.keyName}_${Date.now()}`;
      await secrets.createSecret(secretName, newValue);
      cred.secretRefName = secretName;
    } else {
      cred.plainValue = newValue;
    }

    cred.rotatedAt = new Date();
    await wixData.update('provider_credentials', cred);

    await logProviderAudit(tenantId, cred.providerName, userId, 'ROTATE_KEY', { keyName: cred.keyName }, { keyName: cred.keyName, rotatedAt: cred.rotatedAt });
    return { success: true, rotatedAt: cred.rotatedAt };
  }
);

export const disableCredential = webMethod(
  Permissions.SiteMember,
  async (userId, tenantId, credId) => {
    await checkPermission(userId, tenantId, PERMISSIONS.MANAGE_API_KEYS);

    const cred = await wixData.get('provider_credentials', credId);
    if (!cred) throw new Error('Credential not found');

    cred.isActive = false;
    await wixData.update('provider_credentials', cred);

    await logProviderAudit(tenantId, cred.providerName, userId, 'DISABLE_KEY', { keyName: cred.keyName, isActive: true }, { keyName: cred.keyName, isActive: false });
    return { success: true };
  }
);

// ─── Test Connection ───────────────────────────────────────

export const testProviderConnection = webMethod(
  Permissions.SiteMember,
  async (userId, tenantId, providerName) => {
    await checkPermission(userId, tenantId, PERMISSIONS.TEST_CONNECTIONS);

    const adapter = adapters[providerName];
    if (!adapter?.testConnection) {
      return { success: false, message: `No test available for ${providerName}` };
    }

    const endpoints = await wixData.query('provider_endpoints')
      .eq('tenantId', tenantId)
      .eq('providerName', providerName)
      .eq('enabled', true)
      .ascending('priority')
      .find();

    if (!endpoints.items.length) {
      return { success: false, message: 'No active endpoint configured' };
    }

    const endpoint = endpoints.items[0];

    // Get real credentials
    const creds = await wixData.query('provider_credentials')
      .eq('tenantId', tenantId)
      .eq('providerName', providerName)
      .eq('isActive', true)
      .find();

    const credentials = {};
    for (const cred of creds.items) {
      if (cred.isSecret && cred.secretRefName) {
        credentials[cred.keyName] = await secrets.getSecret(cred.secretRefName);
      } else {
        credentials[cred.keyName] = cred.plainValue;
      }
    }

    try {
      const result = await adapter.testConnection(endpoint, credentials);
      await logProviderAudit(tenantId, providerName, userId, 'TEST_CONNECTION', null, result);
      return result;
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
);

// ─── Audit Logs ────────────────────────────────────────────

export const getAuditLogs = webMethod(
  Permissions.SiteMember,
  async (userId, tenantId, filters = {}) => {
    await checkPermission(userId, tenantId, PERMISSIONS.VIEW_AUDIT_LOGS);

    let query = wixData.query('provider_audit_logs')
      .eq('tenantId', tenantId)
      .descending('createdAt');

    if (filters.providerName) query = query.eq('providerName', filters.providerName);
    if (filters.actionType) query = query.eq('actionType', filters.actionType);
    if (filters.limit) query = query.limit(filters.limit);

    const logs = await query.find();
    return logs.items;
  }
);
