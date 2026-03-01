/**
 * 5ATTH | خته — Pricing / Markup Service (Backend)
 */
import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';

export const applyMarkup = webMethod(
  Permissions.Anyone,
  async (tenantId, basePrice, context) => {
    const rules = await wixData.query('markup_rules')
      .eq('tenantId', tenantId)
      .eq('enabled', true)
      .ascending('priority')
      .find();

    let totalMarkup = 0;

    for (const rule of rules.items) {
      const scope = JSON.parse(rule.scopeJson || '{}');

      // Match scope
      if (scope.productType && scope.productType !== context.productType) continue;
      if (scope.providerName && scope.providerName !== context.providerName) continue;
      if (scope.cabin && scope.cabin !== context.cabin) continue;
      if (scope.seasonKey && scope.seasonKey !== context.seasonKey) continue;
      if (scope.segmentKey && scope.segmentKey !== context.segmentKey) continue;
      if (scope.route) {
        const routeMatch = `${context.origin}-${context.destination}`;
        if (scope.route !== routeMatch && scope.route !== '*') continue;
      }

      if (rule.ruleType === 'percentage') {
        totalMarkup += basePrice * (rule.value / 100);
      } else if (rule.ruleType === 'fixed') {
        totalMarkup += rule.value;
      }
    }

    totalMarkup = Math.round(totalMarkup * 100) / 100;

    return {
      basePrice,
      markup: totalMarkup,
      total: basePrice + totalMarkup,
      currency: context.currency || 'SAR',
      rulesApplied: rules.items.length,
    };
  }
);

export const getMarkupRules = webMethod(
  Permissions.SiteMember,
  async (tenantId) => {
    const rules = await wixData.query('markup_rules')
      .eq('tenantId', tenantId)
      .ascending('priority')
      .find();

    return rules.items;
  }
);

export const saveMarkupRule = webMethod(
  Permissions.SiteMember,
  async (tenantId, rule) => {
    const data = {
      tenantId,
      scopeJson: JSON.stringify(rule.scope || {}),
      ruleType: rule.ruleType,
      value: rule.value,
      enabled: rule.enabled !== false,
      priority: rule.priority || 0,
    };

    if (rule._id) {
      return wixData.update('markup_rules', { ...data, _id: rule._id });
    }
    return wixData.insert('markup_rules', data);
  }
);

export const deleteMarkupRule = webMethod(
  Permissions.SiteMember,
  async (ruleId) => {
    await wixData.remove('markup_rules', ruleId);
    return { success: true };
  }
);
