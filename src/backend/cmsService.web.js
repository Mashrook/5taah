/**
 * 5ATTH | خته — CMS Service (Backend)
 * Manage pages, articles, curated offers
 */
import { Permissions, webMethod } from 'wix-web-module';
import wixData from 'wix-data';
import { checkPermission, PERMISSIONS } from './rbacService.web';

// ─── Public: Get Section Content ───────────────────────────

export const getSectionContent = webMethod(
  Permissions.Anyone,
  async (tenantId, sectionKey) => {
    const pages = await wixData.query('cms_pages')
      .eq('tenantId', tenantId)
      .eq('sectionKey', sectionKey)
      .eq('status', 'published')
      .find();

    return pages.items;
  }
);

export const getArticles = webMethod(
  Permissions.Anyone,
  async (tenantId, filters = {}) => {
    let query = wixData.query('articles')
      .eq('tenantId', tenantId)
      .isNotEmpty('publishedAt')
      .descending('publishedAt');

    if (filters.seasonKey) query = query.eq('seasonKey', filters.seasonKey);
    if (filters.limit) query = query.limit(filters.limit);

    return (await query.find()).items;
  }
);

export const getArticleBySlug = webMethod(
  Permissions.Anyone,
  async (tenantId, slug) => {
    const results = await wixData.query('articles')
      .eq('tenantId', tenantId)
      .eq('slug', slug)
      .find();

    return results.items[0] || null;
  }
);

export const getCuratedOffers = webMethod(
  Permissions.Anyone,
  async (tenantId, segmentKey) => {
    let query = wixData.query('curated_offers')
      .eq('tenantId', tenantId)
      .eq('status', 'active')
      .le('activeFrom', new Date())
      .ge('activeTo', new Date())
      .ascending('priority');

    if (segmentKey) query = query.eq('segmentKey', segmentKey);

    return (await query.find()).items;
  }
);

// ─── Admin: Manage CMS ────────────────────────────────────

export const savePage = webMethod(
  Permissions.SiteMember,
  async (userId, tenantId, pageData) => {
    await checkPermission(userId, tenantId, PERMISSIONS.MANAGE_CMS);

    const data = {
      tenantId,
      sectionKey: pageData.sectionKey,
      slug: pageData.slug,
      title: pageData.title,
      contentRichText: pageData.contentRichText,
      heroMediaId: pageData.heroMediaId,
      seoJson: JSON.stringify(pageData.seo || {}),
      status: pageData.status || 'draft',
      updatedAt: new Date(),
    };

    if (pageData._id) {
      return wixData.update('cms_pages', { ...data, _id: pageData._id });
    }
    return wixData.insert('cms_pages', data);
  }
);

export const saveArticle = webMethod(
  Permissions.SiteMember,
  async (userId, tenantId, articleData) => {
    await checkPermission(userId, tenantId, PERMISSIONS.MANAGE_CMS);

    const data = {
      tenantId,
      slug: articleData.slug,
      title: articleData.title,
      content: articleData.content,
      tagsJson: JSON.stringify(articleData.tags || []),
      seasonKey: articleData.seasonKey || '',
      seoJson: JSON.stringify(articleData.seo || {}),
      publishedAt: articleData.status === 'published' ? new Date() : null,
    };

    if (articleData._id) {
      return wixData.update('articles', { ...data, _id: articleData._id });
    }
    return wixData.insert('articles', data);
  }
);

export const saveCuratedOffer = webMethod(
  Permissions.SiteMember,
  async (userId, tenantId, offerData) => {
    await checkPermission(userId, tenantId, PERMISSIONS.MANAGE_OFFERS);

    const data = {
      tenantId,
      title: offerData.title,
      segmentKey: offerData.segmentKey,
      heroMediaId: offerData.heroMediaId,
      ctaLabel: offerData.ctaLabel,
      ctaTargetJson: JSON.stringify(offerData.ctaTarget || {}),
      activeFrom: offerData.activeFrom ? new Date(offerData.activeFrom) : new Date(),
      activeTo: offerData.activeTo ? new Date(offerData.activeTo) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      priority: offerData.priority || 0,
      status: offerData.status || 'active',
    };

    if (offerData._id) {
      return wixData.update('curated_offers', { ...data, _id: offerData._id });
    }
    return wixData.insert('curated_offers', data);
  }
);

export const submitLead = webMethod(
  Permissions.Anyone,
  async (tenantId, leadData) => {
    return wixData.insert('leads', {
      tenantId,
      segmentKey: leadData.segmentKey || '',
      name: leadData.name,
      phone: leadData.phone,
      budgetRange: leadData.budgetRange || '',
      destinationPreference: leadData.destinationPreference || '',
      travelersCount: leadData.travelersCount || 1,
      source: leadData.source || 'website',
      createdAt: new Date(),
    });
  }
);

// ─── Feature Flags ─────────────────────────────────────────

export const getFeatureFlags = webMethod(
  Permissions.Anyone,
  async (tenantId) => {
    const flags = await wixData.query('feature_flags')
      .eq('tenantId', tenantId)
      .find();

    const flagMap = {};
    flags.items.forEach(f => { flagMap[f.featureKey] = f.enabled; });
    return flagMap;
  }
);

export const toggleFeatureFlag = webMethod(
  Permissions.SiteMember,
  async (userId, tenantId, featureKey, enabled) => {
    await checkPermission(userId, tenantId, PERMISSIONS.MANAGE_FEATURE_FLAGS);

    const existing = await wixData.query('feature_flags')
      .eq('tenantId', tenantId)
      .eq('featureKey', featureKey)
      .find();

    if (existing.items.length) {
      return wixData.update('feature_flags', {
        ...existing.items[0],
        enabled,
      });
    }

    return wixData.insert('feature_flags', {
      tenantId,
      featureKey,
      enabled,
    });
  }
);
