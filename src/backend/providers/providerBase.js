/**
 * 5ATTH | خته — Provider Adapter Base
 * Unified interface for all travel providers
 */
import { secrets } from 'wix-secrets-backend';
import wixData from 'wix-data';

// ─── Helpers ───────────────────────────────────────────────
export async function getProviderConfig(tenantId, providerName, environment = 'production') {
  const endpoints = await wixData.query('provider_endpoints')
    .eq('providerName', providerName)
    .eq('tenantId', tenantId)
    .eq('environment', environment)
    .eq('enabled', true)
    .ascending('priority')
    .find();

  if (!endpoints.items.length) {
    throw new Error(`No active endpoint for provider: ${providerName}`);
  }
  return endpoints.items[0];
}

export async function getProviderCredentials(tenantId, providerName) {
  const creds = await wixData.query('provider_credentials')
    .eq('providerName', providerName)
    .eq('tenantId', tenantId)
    .eq('isActive', true)
    .find();

  const credentials = {};
  for (const cred of creds.items) {
    if (cred.isSecret && cred.secretRefName) {
      try {
        credentials[cred.keyName] = await secrets.getSecret(cred.secretRefName);
      } catch (e) {
        console.error(`Failed to get secret: ${cred.secretRefName}`, e);
      }
    } else {
      credentials[cred.keyName] = cred.plainValue;
    }
  }
  return credentials;
}

export async function getActiveProviders(tenantId, serviceType, strategy = 'gds_first') {
  const endpoints = await wixData.query('provider_endpoints')
    .eq('tenantId', tenantId)
    .eq('enabled', true)
    .ascending('priority')
    .find();

  // Get provider metadata
  const providers = await wixData.query('providers')
    .eq('serviceType', serviceType)
    .find();

  const providerMap = {};
  providers.items.forEach(p => { providerMap[p.name] = p; });

  let activeEndpoints = endpoints.items.filter(ep => providerMap[ep.providerName]);

  // Check feature flags for restricted providers
  const flags = await wixData.query('feature_flags')
    .eq('tenantId', tenantId)
    .find();
  const flagMap = {};
  flags.items.forEach(f => { flagMap[f.featureKey] = f.enabled; });

  // Filter out disabled feature-flagged providers
  const restrictedProviders = ['skiplagged', 'swoodoo'];
  activeEndpoints = activeEndpoints.filter(ep => {
    if (restrictedProviders.includes(ep.providerName)) {
      return flagMap[`provider_${ep.providerName}`] === true;
    }
    return true;
  });

  // Sort by strategy
  if (strategy === 'gds_first') {
    activeEndpoints.sort((a, b) => {
      const catA = providerMap[a.providerName]?.category || '';
      const catB = providerMap[b.providerName]?.category || '';
      if (catA === 'gds' && catB !== 'gds') return -1;
      if (catA !== 'gds' && catB === 'gds') return 1;
      return a.priority - b.priority;
    });
  } else if (strategy === 'meta_first') {
    activeEndpoints.sort((a, b) => {
      const catA = providerMap[a.providerName]?.category || '';
      const catB = providerMap[b.providerName]?.category || '';
      if (catA === 'meta' && catB !== 'meta') return -1;
      if (catA !== 'meta' && catB === 'meta') return 1;
      return a.priority - b.priority;
    });
  }

  return activeEndpoints;
}

export async function logProviderAudit(tenantId, providerName, actorUserId, actionType, oldValue, newValue) {
  await wixData.insert('provider_audit_logs', {
    tenantId,
    providerName,
    actorUserId,
    actionType,
    oldValueJson: JSON.stringify(oldValue || {}),
    newValueJson: JSON.stringify(newValue || {}),
    ipAddress: '',
    userAgent: '',
    createdAt: new Date(),
  });
}

// ─── Unified Search with Fallback ──────────────────────────
export async function searchWithFallback(tenantId, serviceType, strategy, searchFn) {
  const providerEndpoints = await getActiveProviders(tenantId, serviceType, strategy);

  for (const endpoint of providerEndpoints) {
    try {
      const credentials = await getProviderCredentials(tenantId, endpoint.providerName);
      const result = await searchFn(endpoint, credentials);
      if (result && result.length > 0) {
        return { provider: endpoint.providerName, results: result };
      }
    } catch (err) {
      console.error(`Provider ${endpoint.providerName} failed:`, err.message);
      // Try fallback URL
      if (endpoint.fallbackUrl) {
        try {
          const credentials = await getProviderCredentials(tenantId, endpoint.providerName);
          const fallbackEndpoint = { ...endpoint, baseUrl: endpoint.fallbackUrl };
          const result = await searchFn(fallbackEndpoint, credentials);
          if (result && result.length > 0) {
            return { provider: endpoint.providerName, results: result };
          }
        } catch (fallbackErr) {
          console.error(`Provider ${endpoint.providerName} fallback failed:`, fallbackErr.message);
        }
      }
    }
  }

  return { provider: null, results: [] };
}
