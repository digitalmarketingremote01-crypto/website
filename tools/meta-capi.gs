/**
 * Meta Conversions API — server-side Lead reporting
 * Paste this at the BOTTOM of Code.gs in "Formspree | Form Script".
 * Then add ONE line inside your existing doPost(e), before it returns:
 *
 *     try { sendMetaLead(e); } catch (err) { console.error('CAPI: ' + err); }
 *
 * The try/catch matters: if Meta is down or the token expires, your form
 * still delivers the lead. Tracking must never break lead capture.
 */

var META_PIXEL_ID = '1033196126360558';

/**
 * The token is NOT stored in this file — it lives in Script Properties, so it
 * never ends up in source control or in a chat log.
 *
 * Add it once:  Project Settings (gear icon) -> Script Properties -> Add
 *   Property: META_CAPI_TOKEN
 *   Value:    <your Conversions API token>
 */
function getMetaToken_() {
  var t = PropertiesService.getScriptProperties().getProperty('META_CAPI_TOKEN');
  if (!t) throw new Error('META_CAPI_TOKEN missing — add it in Project Settings > Script Properties');
  return t;
}

function sendMetaLead(e) {
  // Editor runs pass no event — use a marked verification payload (doPost always passes e)
  if (!e) e = { parameter: { email: 'support@digitalmarketingremote.com', vorname: 'Capi', nachname: 'Verify', event_id: 'manual.verify.' + Date.now() } };
  var p = (e && e.parameter) ? e.parameter : {};

  // ---- identity (hashed, per Meta requirement) -----------------------------
  var user = {};
  var em = p.email || p._replyto || '';
  if (em) user.em = [sha256(String(em).trim().toLowerCase())];
  if (p.telefon || p.phone) {
    var digits = String(p.telefon || p.phone).replace(/[^0-9]/g, '');
    if (digits) user.ph = [sha256(digits)];
  }
  // matches the real field names used by doPost in Code.gs
  if (p.vorname)  user.fn = [sha256(String(p.vorname).trim().toLowerCase())];
  if (p.nachname) user.ln = [sha256(String(p.nachname).trim().toLowerCase())];
  user.country = [sha256('de')];

  // fbc = the click ID Meta needs to match this lead back to the exact ad click
  if (p.fbclid) user.fbc = 'fb.1.' + Date.now() + '.' + p.fbclid;
  if (p.fbp)    user.fbp = p.fbp;

  // ---- event ---------------------------------------------------------------
  var ev = {
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: p.landing_page
      ? 'https://www.digitalmarketingremote.com' + p.landing_page
      : 'https://www.digitalmarketingremote.com/',
    user_data: user,
    custom_data: {
      channel:      p.channel      || '',
      utm_source:   p.utm_source   || '',
      utm_campaign: p.utm_campaign || '',
      utm_content:  p.utm_content  || ''
    }
  };
  // same id the browser pixel used -> Meta deduplicates instead of double counting
  if (p.event_id) ev.event_id = p.event_id;

  var res = UrlFetchApp.fetch(
    'https://graph.facebook.com/v21.0/' + META_PIXEL_ID + '/events'
      + '?access_token=' + encodeURIComponent(getMetaToken_()),
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ data: [ev] }),
      muteHttpExceptions: true
    }
  );
  console.log('Meta CAPI ' + res.getResponseCode() + ': ' + res.getContentText());
  return res.getResponseCode();
}

function sha256(str) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    return ('0' + (b & 0xFF).toString(16)).slice(-2);
  }).join('');
}

/**
 * Server-side 'Schedule' event for Calendly bookings (called from syncCalendlyBookings).
 * Same dedupe idea as sendMetaLead: a stable event_id ('booking.<calendar event id>')
 * lets Meta drop the duplicate if the browser pixel also fired Schedule.
 *
 * Hooked into Code.gs's syncCalendlyBookings, right after a NEW booking row is appended:
 *
 *     try {
 *       var np = String(inviteeName || '').trim().split(/\s+/);
 *       sendMetaSchedule(invitee, np[0] || '', np.slice(1).join(' '), 'booking.' + id);
 *     } catch (err) { console.error('CAPI Schedule: ' + err); }
 */
/* 2026-08-24: no longer called from Code.gs (syncCalendlyBookings). The blind
   calendar-scan sender could not distinguish a real ad-driven booking from a
   test, an organic booking, or a manually-added calendar entry. The
   CalendlyBooking event now fires ONLY from the browser, on the real
   thank-you page (index.html / en/index.html, at the two calendly_booking
   dataLayer push sites), which only fires for a real completed booking. This
   function is kept for reference / possible future CAPI-redundancy use. */
function sendMetaSchedule(email, firstName, lastName, eventId) {
  // Editor runs pass no args — use a marked verification payload (syncCalendlyBookings always passes them)
  if (!email) { email = 'support@digitalmarketingremote.com'; firstName = 'Capi'; lastName = 'Verify'; eventId = 'booking.verify.' + Date.now(); }
  // ---- identity (hashed, per Meta requirement) -----------------------------
  var user = {};
  if (email)     user.em = [sha256(String(email).trim().toLowerCase())];
  if (firstName) user.fn = [sha256(String(firstName).trim().toLowerCase())];
  if (lastName)  user.ln = [sha256(String(lastName).trim().toLowerCase())];
  user.country = [sha256('de')];

  // ---- event ---------------------------------------------------------------
  var ev = {
    event_name: 'CalendlyBooking',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: 'https://www.digitalmarketingremote.com/',
    user_data: user
  };
  if (eventId) ev.event_id = eventId;

  var res = UrlFetchApp.fetch(
    'https://graph.facebook.com/v21.0/' + META_PIXEL_ID + '/events'
      + '?access_token=' + encodeURIComponent(getMetaToken_()),
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ data: [ev] }),
      muteHttpExceptions: true
    }
  );
  console.log('Meta CAPI ' + res.getResponseCode() + ': ' + res.getContentText());
  return res.getResponseCode();
}

/* ==========================================================================
   DMRConversion — the single optimization event (added 2026-08-28)
   ==========================================================================

   WHY THIS EXISTS
   'Lead' and 'CalendlyBooking' stay exactly as they are: they are the
   REPORTING events, so Events Manager keeps showing forms and bookings
   separately. Neither of them is what the campaign optimizes on.

   'DMRConversion' is the OPTIMIZATION event. It fires once per person and
   carries a value:
       booking      -> 100
       form only    ->  50
   Meta then learns a booker is worth double a form filler.

   THE 48-HOUR HOLD
   Meta can never rewrite a conversion it has already counted, so a form
   cannot be "upgraded" to a booking after the fact. Instead the form's
   DMRConversion is HELD for 48 hours:
     - books within 48h  -> booking fires at 100, the held form is dropped
     - no booking        -> form fires at 50, backdated to the submission time
   One person, one conversion, correct value.

   Beyond 48 hours both count. Raising HOLD_HOURS closes that gap but delays
   the signal by the same amount; 48 is the compromise.

   WIRING (three hooks in Code.gs)
     1. doPost(e), next to the existing sendMetaLead call:
            try { queueMetaConversion(e); } catch (err) { console.error('CAPI queue: ' + err); }

     2. syncCalendlyBookings, right after a NEW booking row is appended
        (same place the old sendMetaSchedule call was documented above):
            try { bookingMetaConversion(invitee, inviteeName, id); } catch (err) { console.error('CAPI booking: ' + err); }

     3. A time-driven trigger, every hour:
            Triggers -> Add Trigger -> flushMetaConversions -> Time-driven -> Hour timer -> Every hour

   The pending queue lives in Script Properties, keyed by hashed email, so it
   needs no sheet and no schema. Volume here is a few leads a day.
   ========================================================================== */

var CONV_EVENT      = 'DMRConversion';
var CONV_VAL_BOOK   = 100;
var CONV_VAL_FORM   = 50;
var CONV_CURRENCY   = 'USD';   // matches the ad account currency
var HOLD_HOURS      = 48;
var CONV_KEY_PREFIX = 'mc.';

function convKey_(email) {
  return CONV_KEY_PREFIX + sha256(String(email).trim().toLowerCase()).slice(0, 24);
}

/**
 * Form submitted -> park the conversion for HOLD_HOURS instead of sending it.
 * Called from doPost. Does NOT replace sendMetaLead — 'Lead' still fires for reporting.
 */
function queueMetaConversion(e) {
  var p = (e && e.parameter) ? e.parameter : {};
  var em = p.email || p._replyto || '';
  if (!em) return;  // no email = nothing to match a later booking against

  PropertiesService.getScriptProperties().setProperty(convKey_(em), JSON.stringify({
    em: String(em).trim().toLowerCase(),
    fn: p.vorname   || '',
    ln: p.nachname  || '',
    fbp: p.fbp      || '',
    fbclid: p.fbclid || '',
    url: p.landing_page ? 'https://www.digitalmarketingremote.com' + p.landing_page
                        : 'https://www.digitalmarketingremote.com/',
    t: Math.floor(Date.now() / 1000)
  }));
}

/**
 * Booking made -> send the conversion at the booking value straight away and
 * drop any held form for the same person, so they are never counted twice.
 * Called from syncCalendlyBookings.
 */
function bookingMetaConversion(email, fullName, calId) {
  var held = null;
  if (email) {
    var props = PropertiesService.getScriptProperties();
    var key = convKey_(email);
    var raw = props.getProperty(key);
    if (raw) {
      try { held = JSON.parse(raw); } catch (err) { held = null; }
      props.deleteProperty(key);   // superseded by the booking
    }
  }

  var np = String(fullName || '').trim().split(/\s+/);
  sendMetaConversion_({
    em: email,
    fn: np[0] || (held && held.fn) || '',
    ln: np.slice(1).join(' ') || (held && held.ln) || '',
    // reuse the browser identifiers from the form if we have them — better match quality
    fbp: held && held.fbp,
    fbclid: held && held.fbclid,
    url: (held && held.url) || 'https://www.digitalmarketingremote.com/',
    value: CONV_VAL_BOOK,
    eventId: 'conv.booking.' + (calId || Date.now()),
    time: Math.floor(Date.now() / 1000)
  });
}

/**
 * Hourly trigger. Sends every held form that is now older than HOLD_HOURS and
 * never turned into a booking, backdated to the original submission time so it
 * still attributes to the original ad click.
 */
function flushMetaConversions() {
  var props = PropertiesService.getScriptProperties();
  var all = props.getProperties();
  var cutoff = Math.floor(Date.now() / 1000) - (HOLD_HOURS * 3600);
  var sent = 0;

  for (var key in all) {
    if (key.indexOf(CONV_KEY_PREFIX) !== 0) continue;

    var d;
    try { d = JSON.parse(all[key]); } catch (err) { props.deleteProperty(key); continue; }
    if (!d || !d.t || d.t > cutoff) continue;   // still inside the hold window

    sendMetaConversion_({
      em: d.em, fn: d.fn, ln: d.ln, fbp: d.fbp, fbclid: d.fbclid, url: d.url,
      value: CONV_VAL_FORM,
      eventId: 'conv.form.' + key,
      time: d.t
    });
    props.deleteProperty(key);
    sent++;
  }
  console.log('flushMetaConversions: sent ' + sent);
  return sent;
}

/** Shared sender for DMRConversion. */
function sendMetaConversion_(o) {
  var user = {};
  if (o.em) user.em = [sha256(String(o.em).trim().toLowerCase())];
  if (o.fn) user.fn = [sha256(String(o.fn).trim().toLowerCase())];
  if (o.ln) user.ln = [sha256(String(o.ln).trim().toLowerCase())];
  // country is deliberately NOT set: campaigns run in both UK and Germany, and
  // asserting the wrong one hurts match quality more than leaving it out.
  if (o.fbclid) user.fbc = 'fb.1.' + (o.time * 1000) + '.' + o.fbclid;
  if (o.fbp)    user.fbp = o.fbp;

  var ev = {
    event_name: CONV_EVENT,
    event_time: o.time,
    action_source: 'website',
    event_source_url: o.url || 'https://www.digitalmarketingremote.com/',
    event_id: o.eventId,
    user_data: user,
    custom_data: { value: o.value, currency: CONV_CURRENCY }
  };

  var res = UrlFetchApp.fetch(
    'https://graph.facebook.com/v21.0/' + META_PIXEL_ID + '/events'
      + '?access_token=' + encodeURIComponent(getMetaToken_()),
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ data: [ev] }),
      muteHttpExceptions: true
    }
  );
  console.log('Meta CAPI ' + CONV_EVENT + ' ' + o.value + ' -> '
    + res.getResponseCode() + ': ' + res.getContentText());
  return res.getResponseCode();
}

/**
 * Run once from the editor to create DMRConversion in the dataset, so it can be
 * picked when building the custom conversions in Events Manager.
 */
function testMetaConversion() {
  var code = sendMetaConversion_({
    em: 'support@digitalmarketingremote.com',
    fn: 'Test', ln: 'Conversion',
    url: 'https://www.digitalmarketingremote.com/',
    value: CONV_VAL_BOOK,
    eventId: 'conv.test.' + Date.now(),
    time: Math.floor(Date.now() / 1000)
  });
  Logger.log('HTTP ' + code + ' (200 = success)');
}

/** Shows what is currently held and how much longer each has to wait. */
function peekMetaConversions() {
  var all = PropertiesService.getScriptProperties().getProperties();
  var now = Math.floor(Date.now() / 1000), n = 0;
  for (var key in all) {
    if (key.indexOf(CONV_KEY_PREFIX) !== 0) continue;
    var d = JSON.parse(all[key]);
    Logger.log(d.em + '  held ' + Math.round((now - d.t) / 3600) + 'h of ' + HOLD_HOURS + 'h');
    n++;
  }
  Logger.log(n + ' held');
}

/** Run this once from the editor to confirm the token works. */
function testMetaLead() {
  var code = sendMetaLead({ parameter: {
    email: 'support@digitalmarketingremote.com',
    vorname: 'Test',
    nachname: 'Lead',
    channel: 'ads_meta',
    landing_page: '/',
    event_id: 'manual.test.' + Date.now()
  }});
  Logger.log('HTTP ' + code + ' (200 = success)');
}
