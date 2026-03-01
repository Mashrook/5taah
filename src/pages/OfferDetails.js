/**
 * 5ATTH | خته — Offer Details Dynamic Page (/offer/{id})
 * Shows full offer details with booking CTA
 */
import wixSeo from 'wix-seo';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixData from 'wix-data';

$w.onReady(async function () {

  /* Safe storage helper */
  var _storage = null;
  try { _storage = wixWindow.storage.local; } catch(e) {}
  function safeGet(key, fallback) { try { return _storage ? (_storage.getItem(key) || fallback) : fallback; } catch(e) { return fallback; } }
  function safeSet(key, val) { try { if (_storage) _storage.setItem(key, val); } catch(e) {} }
  function safeRemove(key) { try { if (_storage) _storage.removeItem(key); } catch(e) {} }

 const offerId = wixLocation.path[1]; // /offer/{id}

 if (!offerId) {
 wixLocation.to('/');
 return;
 }

 if ($w('#offerLoading')) $w('#offerLoading').expand();

 try {
 const offer = await wixData.get('Offers', offerId);

 if (!offer) {
 if ($w('#offerNotFound')) $w('#offerNotFound').expand();
 if ($w('#offerLoading')) $w('#offerLoading').collapse();
 return;
 }

 // SEO
 wixSeo.title = `عرض ${offer.productType} | 5ATTH خته`;

 // Product Type Badge
 const typeLabels = { flights: 'رحلة جوية', hotels: 'فندق', cars: 'سيارة', tours: 'جولة'};
 if ($w('#offerType')) {
 $w('#offerType').text = typeLabels[offer.productType] || offer.productType;
 try { $w('#offerType').style.color = '#C9A227'; } catch (e) {}
 }

 // Provider
 if ($w('#offerProvider')) $w('#offerProvider').text = offer.providerName || '';

 // ─── Price Breakdown ─────────────────────────────────
 if ($w('#priceBase')) $w('#priceBase').text = `${offer.baseAmount || 0} ${offer.currency}`;
 if ($w('#priceTaxes')) $w('#priceTaxes').text = `${offer.taxesAmount || 0} ${offer.currency}`;
 if ($w('#priceMarkup')) $w('#priceMarkup').text = `${offer.markupAmount || 0} ${offer.currency}`;
 if ($w('#priceTotal')) {
 $w('#priceTotal').text = `${offer.totalAmount} ${offer.currency}`;
 try { $w('#priceTotal').style.color = '#C9A227'; } catch (e) {}
 }

 // Refundable badge
 if ($w('#refundBadge')) {
 $w('#refundBadge').text = offer.refundable ? 'قابل للاسترداد': 'غير قابل للاسترداد';
 try {
 $w('#refundBadge').style.color = offer.refundable ? '#22C55E': '#EF4444';
 } catch (e) {}
 }

 // ─── Baggage Summary ─────────────────────────────────
 if ($w('#baggageInfo') && offer.baggageSummaryJson) {
 try {
 const baggage = JSON.parse(offer.baggageSummaryJson);
 const parts = [];
 if (baggage.cabin) parts.push(`حقيبة يد: ${baggage.cabin}`);
 if (baggage.checked) parts.push(`حقيبة مسجلة: ${baggage.checked}`);
 $w('#baggageInfo').text = parts.join('| ') || 'لا توجد معلومات عن الحقائب';
 } catch (e) {
 $w('#baggageInfo').text = '';
 }
 }

 // ─── Deep Link (meta-search providers) ───────────────
 if (offer.deepLinkUrl) {
 if ($w('#deepLinkSection')) $w('#deepLinkSection').expand();
 if ($w('#deepLinkBtn')) {
 $w('#deepLinkBtn').onClick(() => {
 wixWindow.openUrl(offer.deepLinkUrl, '_blank');
 });
 }
 }

 // ─── Book Now Button ─────────────────────────────────
 if ($w('#bookNowBtn')) {
 if (offer.deepLinkUrl) {
 // Meta-search → open external
 $w('#bookNowBtn').label = 'احجز عبر الموقع الخارجي';
 $w('#bookNowBtn').onClick(() => {
 wixWindow.openUrl(offer.deepLinkUrl, '_blank');
 });
 } else {
 $w('#bookNowBtn').label = 'احجز الآن';
 $w('#bookNowBtn').onClick(() => {
 safeSet('selectedOffer', JSON.stringify(offer));
 wixLocation.to('/checkout');
 });
 }
 }

 // ─── WhatsApp Inquiry ────────────────────────────────
 if ($w('#whatsappBtn')) {
 $w('#whatsappBtn').onClick(() => {
 const msg = `أريد الاستفسار عن عرض:\nالنوع: ${typeLabels[offer.productType] || offer.productType}\nالسعر: ${offer.totalAmount} ${offer.currency}\nالمزود: ${offer.providerName}`;
 wixWindow.openUrl(`https://wa.me/966XXXXXXXXX?text=${encodeURIComponent(msg)}`);
 });
 }

 // ─── Offer Expiry Notice ─────────────────────────────
 if ($w('#expiryNotice') && offer.searchSessionId) {
 try {
 const session = await wixData.get('SearchSessions', offer.searchSessionId);
 if (session?.expiresAt) {
 const expiresAt = new Date(session.expiresAt);
 const now = new Date();
 if (expiresAt < now) {
 $w('#expiryNotice').text = 'هذا العرض منتهي الصلاحية. يرجى البحث مجدداً.';
 $w('#expiryNotice').expand();
 if ($w('#bookNowBtn')) $w('#bookNowBtn').disable();
 } else {
 const minutesLeft = Math.floor((expiresAt - now) / 60000);
 $w('#expiryNotice').text = ` هذا العرض صالح لمدة ${minutesLeft} دقيقة`;
 $w('#expiryNotice').expand();
 }
 }
 } catch (e) {}
 }

 } catch (e) {
 if ($w('#offerError')) {
 $w('#offerError').text = `خطأ: ${e.message}`;
 $w('#offerError').expand();
 }
 }

 if ($w('#offerLoading')) $w('#offerLoading').collapse();
});
