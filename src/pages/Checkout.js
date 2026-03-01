/**
 * 5ATTH | خته — Checkout Page (Stepper)
 */
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixUsers from 'wix-users';
import wixSeo from 'wix-seo';
import { createBooking, confirmBooking } from 'backend/bookingService.web';
import { createInvoice, getPublishableKey } from 'backend/paymentMoyasar.web';

const TENANT_ID = 'default';

$w.onReady(async function () {

  /* Safe storage helper */
  var _storage = null;
  try { _storage = wixWindow.storage.local; } catch(e) {}
  function safeGet(key, fallback) { try { return _storage ? (_storage.getItem(key) || fallback) : fallback; } catch(e) { return fallback; } }
  function safeSet(key, val) { try { if (_storage) _storage.setItem(key, val); } catch(e) {} }
  function safeRemove(key) { try { if (_storage) _storage.removeItem(key); } catch(e) {} }

  wixSeo.title = 'إتمام الحجز | 5ATTH خته';

  // Must be logged in
  if (!wixUsers.currentUser.loggedIn) {
    wixLocation.to('/login');
    return;
  }

  const userId = wixUsers.currentUser.id;
  const offerJson = safeGet('selectedOffer', null);

  if (!offerJson) {
    wixLocation.to('/');
    return;
  }

  const offer = JSON.parse(offerJson);

  // ─── Step 1: Price Breakdown ───────────────────────────
  if ($w('#priceBase')) $w('#priceBase').text = `${offer.baseAmount} ${offer.currency}`;
  if ($w('#priceTaxes')) $w('#priceTaxes').text = `${offer.taxesAmount} ${offer.currency}`;
  if ($w('#priceMarkup')) $w('#priceMarkup').text = `${offer.markupAmount} ${offer.currency}`;
  if ($w('#priceTotal')) {
    $w('#priceTotal').text = `${offer.totalAmount} ${offer.currency}`;
    try { $w('#priceTotal').style.color = '#C9A227'; } catch (e) {}
  }

  // Show itinerary
  if (offer.itineraries?.[0] && $w('#itinerarySection')) {
    const itin = offer.itineraries[0];
    if ($w('#itinRoute')) {
      $w('#itinRoute').text = `${itin.segments?.[0]?.fromIata} → ${itin.segments?.[itin.segments.length - 1]?.toIata}`;
    }
    if ($w('#itinDuration')) {
      $w('#itinDuration').text = `${Math.floor(itin.durationMinutes / 60)}س ${itin.durationMinutes % 60}د`;
    }
    if ($w('#itinStops')) {
      $w('#itinStops').text = itin.stopsCount === 0 ? 'مباشر' : `${itin.stopsCount} توقف`;
    }
  }

  // ─── Stepper Navigation ────────────────────────────────
  let currentStep = 1;
  const steps = ['#step1', '#step2', '#step3', '#step4'];

  function showStep(step) {
    steps.forEach((s, i) => {
      if ($w(s)) {
        if (i + 1 === step) $w(s).expand();
        else $w(s).collapse();
      }
    });
    currentStep = step;

    // Update step indicators
    for (let i = 1; i <= 4; i++) {
      if ($w(`#stepIndicator${i}`)) {
        try {
          $w(`#stepIndicator${i}`).style.backgroundColor = i <= step ? '#C9A227' : '#1E1E27';
        } catch (e) {}
      }
    }
  }

  showStep(1);

  if ($w('#nextStep1')) {
    $w('#nextStep1').onClick(() => showStep(2));
  }

  // ─── Step 2: Traveler Details ──────────────────────────
  if ($w('#nextStep2')) {
    $w('#nextStep2').onClick(() => {
      // Validate traveler data
      const firstName = $w('#travelerFirst')?.value;
      const lastName = $w('#travelerLast')?.value;
      if (!firstName || !lastName) {
        if ($w('#travelerError')) $w('#travelerError').text = 'يرجى تعبئة بيانات المسافر';
        return;
      }
      showStep(3);
    });
  }

  // ─── Step 3: Contact & Policy ──────────────────────────
  if ($w('#nextStep3')) {
    $w('#nextStep3').onClick(() => {
      const email = $w('#contactEmail')?.value;
      const phone = $w('#contactPhone')?.value;
      const policyAccepted = $w('#policyCheckbox')?.checked;

      if (!email || !phone) {
        if ($w('#contactError')) $w('#contactError').text = 'يرجى تعبئة بيانات التواصل';
        return;
      }
      if (!policyAccepted) {
        if ($w('#contactError')) $w('#contactError').text = 'يرجى الموافقة على الشروط والأحكام';
        return;
      }
      showStep(4);
    });
  }

  // ─── Step 4: Payment ──────────────────────────────────
  if ($w('#payBtn')) {
    $w('#payBtn').onClick(async () => {
      if ($w('#paymentLoading')) $w('#paymentLoading').expand();
      if ($w('#payBtn')) $w('#payBtn').disable();

      try {
        const travelers = [{
          firstName: $w('#travelerFirst')?.value,
          lastName: $w('#travelerLast')?.value,
          dateOfBirth: $w('#travelerDob')?.value,
          gender: $w('#travelerGender')?.value || 'MALE',
          passport: {
            number: $w('#passportNumber')?.value,
            expiryDate: $w('#passportExpiry')?.value,
            issuanceCountry: $w('#passportCountry')?.value || 'SA',
            nationality: $w('#nationality')?.value || 'SA',
          },
        }];

        const contact = {
          email: $w('#contactEmail')?.value,
          phone: $w('#contactPhone')?.value,
          countryCode: '966',
        };

        // Create booking
        const booking = await createBooking(TENANT_ID, userId, offer.providerOfferId, travelers, contact);

        // Create Moyasar payment
        const baseUrl = wixLocation.baseUrl;
        const payment = await createInvoice(
          TENANT_ID,
          booking.bookingId,
          booking.amount,
          booking.currency,
          `حجز رقم ${booking.bookingId}`,
          `${baseUrl}/_functions/moyasar/webhook`,
          `${baseUrl}/checkout/success?bookingId=${booking.bookingId}`,
          `${baseUrl}/checkout/failure?bookingId=${booking.bookingId}`,
        );

        // Redirect to Moyasar payment page
        if (payment.paymentUrl) {
          wixWindow.openUrl(payment.paymentUrl, '_self');
        }
      } catch (e) {
        if ($w('#paymentError')) $w('#paymentError').text = `خطأ في الدفع: ${e.message}`;
        console.log('Payment error:', e);
      }

      if ($w('#paymentLoading')) $w('#paymentLoading').collapse();
      if ($w('#payBtn')) $w('#payBtn').enable();
    });
  }

  // ─── WhatsApp Alternative ──────────────────────────────
  if ($w('#whatsappBookBtn')) {
    $w('#whatsappBookBtn').onClick(() => {
      const message = `أريد حجز رحلة:\n${offer.itineraries?.[0]?.segments?.[0]?.fromIata || ''} → ${offer.itineraries?.[0]?.segments?.[offer.itineraries[0].segments.length - 1]?.toIata || ''}\nالسعر: ${offer.totalAmount} ${offer.currency}`;
      wixWindow.openUrl(`https://wa.me/966XXXXXXXXX?text=${encodeURIComponent(message)}`);
    });
  }
});
