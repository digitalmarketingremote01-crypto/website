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
