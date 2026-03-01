/**
 * 5ATTH | خته — HTTP Functions
 *
 * POST /_functions/moyasar-webhook
 * POST /_functions/provider-test
 * GET  /_functions/public-config
 * POST /_functions/search
 * POST /_functions/create-booking
 */
import { ok, badRequest, serverError, forbidden } from 'wix-http-functions';
import wixData from 'wix-data';
import { sendNotification } from './notificationService.web';
import { testConnection, getActiveProvider, searchWithFallback, getCredential } from './integrationRegistry.jsw';
import { checkPermission } from './rbacService.web';
import { applyMarkup } from './pricingService.web';
import { searchFlightsUnified } from './search/unifiedSearch.adapter.js';

// ════════════════════════════════════════════════════════
// Rate limiter (in-memory, per-instance — fast first layer)
// ════════════════════════════════════════════════════════
const rateLimitMap = {};
function checkRateLimit(ip, maxPerMinute = 30) {
  const now = Date.now();
  if (!rateLimitMap[ip]) rateLimitMap[ip] = [];
  rateLimitMap[ip] = rateLimitMap[ip].filter(t => now - t < 60000);
  if (rateLimitMap[ip].length >= maxPerMinute) return false;
  rateLimitMap[ip].push(now);
  return true;
}

// DB-backed rate limiter (persistent across instances)
async function enforceRateLimit(ip, action, maxPerMinute = 20) {
  const since = new Date(Date.now() - 60 * 1000);
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
}

// ════════════════════════════════════════════════════════
// Search Cache Helpers (10-minute window)
// ════════════════════════════════════════════════════════
async function findCachedSearch(productType, params) {
  const now = new Date();
  const results = await wixData.query('SearchSessions')
    .eq('productType', productType)
    .eq('paramsJson', JSON.stringify(params))
    .ge('expiresAt', now)
    .limit(1)
    .find();

  if (!results.items.length) return null;

  const session = results.items[0];
  const offers = await wixData.query('Offers')
    .eq('searchSessionId', session._id)
    .limit(100)
    .find();

  if (!offers.items.length) return null;

  return {
    sessionId: session._id,
    offers: offers.items,
  };
}

async function saveSearchCache(productType, params, sessionId, offers) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Update the session with the paramsJson so it can be matched later
  try {
    const existing = await wixData.get('SearchSessions', sessionId);
    if (existing) {
      await wixData.update('SearchSessions', {
        ...existing,
        paramsJson: JSON.stringify(params),
        expiresAt,
      });
    }
  } catch (_) {
    // Session was already created by the unified search pipeline
  }
}


// ════════════════════════════════════════════════════════
// POST /_functions/moyasar-webhook
// ════════════════════════════════════════════════════════
export async function post_moyasarWebhook(request) {
  try {
    const body = await request.body.json();

    if (!body.id || !body.status) {
      return badRequest({ body: JSON.stringify({ error: 'Invalid payload' }) });
    }

    const paymentId = body.id;
    const status = body.status; // paid, failed, refunded

    // Idempotency check
    const existingPayments = await wixData.query('payments')
      .eq('providerPaymentId', paymentId)
      .find();

    if (!existingPayments.items.length) {
      return badRequest({ body: JSON.stringify({ error: 'Payment not found' }) });
    }

    const paymentRecord = existingPayments.items[0];

    // Skip if already processed
    if (paymentRecord.status === status) {
      return ok({ body: JSON.stringify({ message: 'Already processed' }) });
    }

    // Update payment record
    await wixData.update('payments', {
      ...paymentRecord,
      status,
      paidAt: status === 'paid' ? new Date() : paymentRecord.paidAt,
      rawPayloadJson: JSON.stringify(body),
    });

    // Find and update invoice
    const invoices = await wixData.query('invoices')
      .eq('bookingId', body.metadata?.bookingId)
      .find();

    if (invoices.items.length) {
      const invoice = invoices.items[0];
      let invoiceStatus = invoice.status;
      if (status === 'paid') invoiceStatus = 'paid';
      else if (status === 'failed') invoiceStatus = 'failed';
      else if (status === 'refunded') invoiceStatus = 'refunded';

      await wixData.update('invoices', {
        ...invoice,
        status: invoiceStatus,
        updatedAt: new Date(),
      });
    }

    // Update booking status
    if (body.metadata?.bookingId) {
      const booking = await wixData.get('bookings', body.metadata.bookingId);
      if (booking) {
        let bookingStatus = booking.status;
        if (status === 'paid') bookingStatus = 'paid';
        else if (status === 'failed') bookingStatus = 'failed';
        else if (status === 'refunded') bookingStatus = 'refunded';

        await wixData.update('bookings', {
          ...booking,
          status: bookingStatus,
          updatedAt: new Date(),
        });

        // Send notifications
        if (booking.userId) {
          const templateMap = {
            paid: 'booking_payment_success',
            failed: 'booking_payment_failed',
            refunded: 'booking_refunded',
          };

          try {
            await sendNotification(booking.tenantId, booking.userId, templateMap[status] || 'payment_update', {
              bookingId: booking._id,
              amount: body.amount / 100,
              currency: body.currency,
              status,
            });
          } catch (notifErr) {
            console.error('Notification failed:', notifErr.message);
          }
        }
      }
    }

    // Audit log
    await wixData.insert('provider_audit_logs', {
      tenantId: body.metadata?.tenantId || '',
      providerName: 'moyasar',
      actorUserId: 'webhook',
      actionType: `PAYMENT_${status.toUpperCase()}`,
      oldValueJson: JSON.stringify({ previousStatus: paymentRecord.status }),
      newValueJson: JSON.stringify({ status, paymentId }),
      ipAddress: request.headers?.['x-forwarded-for'] || '',
      userAgent: request.headers?.['user-agent'] || '',
      createdAt: new Date(),
    });

    return ok({ body: JSON.stringify({ message: 'Webhook processed', status }) });
  } catch (err) {
    console.error('Moyasar webhook error:', err);
    return serverError({ body: JSON.stringify({ error: err.message }) });
  }
}

// ════════════════════════════════════════════════════════
// POST /_functions/provider-test
// Tests a provider connection (admin only)
// Body: { tenantId, providerName, userId }
// ════════════════════════════════════════════════════════
export async function post_providerTest(request) {
  try {
    const body = await request.body.json();
    const { tenantId, providerName, userId } = body;

    if (!tenantId || !providerName || !userId) {
      return badRequest({ body: JSON.stringify({ error: 'tenantId, providerName, userId required' }) });
    }

    // RBAC check
    const allowed = await checkPermission(tenantId, userId, 'integrations_edit');
    if (!allowed) {
      return forbidden({ body: JSON.stringify({ error: 'Access denied' }) });
    }

    const result = await testConnection(tenantId, providerName);

    return ok({
      body: JSON.stringify(result),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return serverError({ body: JSON.stringify({ error: err.message }) });
  }
}

// ════════════════════════════════════════════════════════
// GET /_functions/public-config
// Returns non-sensitive site configuration
// Query: ?tenantId=default
// ════════════════════════════════════════════════════════
export async function get_publicConfig(request) {
  try {
    const tenantId = request.query?.tenantId || 'default';

    // Get tenant info (non-sensitive)
    const tenants = await wixData.query('Tenants')
      .eq('slug', tenantId)
      .find();

    const tenant = tenants.items[0];
    if (!tenant) {
      return badRequest({ body: JSON.stringify({ error: 'Tenant not found' }) });
    }

    // Get feature flags
    const flags = await wixData.query('FeatureFlags')
      .eq('tenantId', tenant._id)
      .find();

    const features = {};
    flags.items.forEach(f => { features[f.featureKey] = f.enabled; });

    // Get active providers (names only, no secrets)
    const endpoints = await wixData.query('ProviderEndpoints')
      .eq('tenantId', tenant._id)
      .eq('enabled', true)
      .find();

    const activeProviders = [...new Set(endpoints.items.map(e => e.providerName))];

    const config = {
      tenantName: tenant.name,
      countryDefault: tenant.countryDefault,
      currencyDefault: tenant.currencyDefault,
      themeJson: tenant.themeJson,
      features,
      activeProviders,
      supportedCountries: ['SA', 'AE', 'KW', 'QA', 'BH'],
      supportedCurrencies: ['SAR', 'AED', 'KWD', 'QAR', 'BHD'],
    };

    return ok({
      body: JSON.stringify(config),
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err) {
    return serverError({ body: JSON.stringify({ error: err.message }) });
  }
}

// ════════════════════════════════════════════════════════
// POST /_functions/search
// Unified search endpoint with caching + DB rate limiting
// Body: { productType, params, tenantId?, currency? }
// ════════════════════════════════════════════════════════
export async function post_search(request) {
  try {
    const ip = request.headers?.['x-forwarded-for'] || 'unknown';

    // Fast in-memory rate limit (first layer)
    if (!checkRateLimit(ip, 30)) {
      return ok({
        status: 429,
        body: JSON.stringify({ error: 'Rate limit exceeded. Try again in 1 minute.' }),
      });
    }

    const body = await request.body.json();

    if (!body || !body.productType || !body.params) {
      return badRequest({ body: JSON.stringify({ error: 'productType, params required' }) });
    }

    const { productType, params, tenantId, currency } = body;

    // Validate required search params
    if (productType === 'flight' || productType === 'flights') {
      const { origin, destination, departDate } = params;
      if (!origin || !destination || !departDate) {
        return badRequest({ body: JSON.stringify({ error: 'Missing required: origin, destination, departDate' }) });
      }
    }

    // DB-persisted rate limit (second layer, across all instances)
    try {
      await enforceRateLimit(ip, 'search', 20);
    } catch (rlErr) {
      return ok({
        status: 429,
        body: JSON.stringify({ error: rlErr.message }),
      });
    }

    // ── Flights: Unified Search Pipeline with cache ──
    if (productType === 'flights' || productType === 'flight') {
      // Check cache first (10-minute window)
      const cached = await findCachedSearch('flight', params);
      if (cached) {
        return ok({
          body: JSON.stringify({
            source: 'cache',
            sessionId: cached.sessionId,
            totalResults: cached.offers.length,
            offers: cached.offers,
          }),
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Live search (parallel Amadeus + Sabre)
      const result = await searchFlightsUnified(params, {
        environment: params.environment || 'production',
        providerTimeoutMs: 12000,
        strategy: 'multi',
      });

      // Apply markup to each ranked offer
      const offersWithMarkup = await Promise.all(
        result.offers.map(async (offer) => {
          try {
            const marked = await applyMarkup(tenantId, offer.totalAmount, {
              productType: 'flight',
              providerName: offer.providerName,
              currency: currency || offer.currency || 'SAR',
              routeKey: offer.routeKey,
            });
            return {
              ...offer,
              markupAmount: marked.markup || marked.markupAmount || 0,
              totalAmount: marked.total || marked.finalPrice || offer.totalAmount,
            };
          } catch (_) {
            return offer;
          }
        })
      );

      // Save cache so identical searches return instantly
      await saveSearchCache('flight', params, result.sessionId, offersWithMarkup);

      return ok({
        body: JSON.stringify({
          source: 'live',
          sessionId: result.sessionId,
          totalResults: offersWithMarkup.length,
          providers: result.providers,
          offers: offersWithMarkup,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── Other product types: legacy fallback path ──
    if (!tenantId) {
      return badRequest({ body: JSON.stringify({ error: 'tenantId required for non-flight search' }) });
    }

    const session = await wixData.insert('SearchSessions', {
      tenantId,
      productType,
      paramsJson: JSON.stringify(params),
      providerStrategy: 'priority_fallback',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const results = await searchWithFallback(tenantId, productType, async (adapter, endpoint, providerName) => {
      const creds = await wixData.query('ProviderCredentials')
        .eq('tenantId', tenantId)
        .eq('providerName', providerName)
        .eq('isActive', true)
        .find();

      const credentials = {};
      for (const c of creds.items) {
        if (c.isSecret && c.secretRefName) {
          const { secrets: secretsMod } = await import('wix-secrets-backend');
          credentials[c.keyName] = await secretsMod.getSecret(c.secretRefName);
        } else {
          credentials[c.keyName] = c.plainValue;
        }
      }

      let searchResults;
      if (productType === 'hotels' && typeof adapter.searchHotels === 'function') {
        searchResults = await adapter.searchHotels(endpoint, credentials, params);
      } else if (productType === 'activities' && typeof adapter.searchActivities === 'function') {
        searchResults = await adapter.searchActivities(endpoint, credentials, params);
      } else {
        throw new Error(`${providerName} does not support ${productType}`);
      }

      return { providerName, offers: searchResults };
    });

    const offersWithMarkup = [];
    for (const offer of (results.offers || [])) {
      const marked = await applyMarkup(tenantId, offer.totalAmount || offer.baseAmount, {
        productType,
        providerName: results.providerName,
        currency: currency || 'SAR',
      });
      offersWithMarkup.push({
        ...offer,
        baseAmount: offer.baseAmount || offer.totalAmount,
        markupAmount: marked.markupAmount || 0,
        totalAmount: marked.finalPrice || offer.totalAmount,
      });
    }

    for (const offer of offersWithMarkup) {
      await wixData.insert('Offers', {
        tenantId,
        searchSessionId: session._id,
        providerName: results.providerName,
        providerOfferId: offer.providerOfferId || '',
        productType,
        totalAmount: offer.totalAmount,
        currency: currency || 'SAR',
        baseAmount: offer.baseAmount,
        taxesAmount: offer.taxesAmount || 0,
        markupAmount: offer.markupAmount || 0,
        refundable: offer.refundable || false,
        baggageSummaryJson: JSON.stringify(offer.baggage || {}),
        deepLinkUrl: offer.deepLinkUrl || '',
        createdAt: new Date(),
      });
    }

    return ok({
      body: JSON.stringify({
        sessionId: session._id,
        provider: results.providerName,
        count: offersWithMarkup.length,
        offers: offersWithMarkup,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return serverError({ body: JSON.stringify({ error: err.message }) });
  }
}

// ════════════════════════════════════════════════════════
// POST /_functions/create-booking
// Creates a booking from a selected offer
// Body: { tenantId, userId, offerId, travelers, contact }
// ════════════════════════════════════════════════════════
export async function post_createBooking(request) {
  try {
    const body = await request.body.json();
    const { tenantId, userId, offerId, travelers, contact } = body;

    if (!tenantId || !userId || !offerId) {
      return badRequest({ body: JSON.stringify({ error: 'tenantId, userId, offerId required' }) });
    }

    // Fetch the offer
    const offer = await wixData.get('Offers', offerId);
    if (!offer) {
      return badRequest({ body: JSON.stringify({ error: 'Offer not found or expired' }) });
    }

    // Verify offer session hasn't expired
    const session = await wixData.get('SearchSessions', offer.searchSessionId);
    if (session && new Date(session.expiresAt) < new Date()) {
      return badRequest({ body: JSON.stringify({ error: 'Search session expired. Please search again.' }) });
    }

    // Create booking
    const booking = await wixData.insert('Bookings', {
      tenantId,
      userId,
      productType: offer.productType,
      providerName: offer.providerName,
      status: 'pending_payment',
      selectedOfferId: offerId,
      travelersJson: JSON.stringify(travelers || []),
      contactJson: JSON.stringify(contact || {}),
      pricingJson: JSON.stringify({
        baseAmount: offer.baseAmount,
        taxesAmount: offer.taxesAmount,
        markupAmount: offer.markupAmount,
        totalAmount: offer.totalAmount,
        currency: offer.currency,
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create invoice
    const invoice = await wixData.insert('Invoices', {
      tenantId,
      bookingId: booking._id,
      amount: offer.totalAmount,
      currency: offer.currency,
      status: 'pending',
      createdAt: new Date(),
    });

    return ok({
      body: JSON.stringify({
        bookingId: booking._id,
        invoiceId: invoice._id,
        amount: offer.totalAmount,
        currency: offer.currency,
        status: booking.status,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return serverError({ body: JSON.stringify({ error: err.message }) });
  }
}