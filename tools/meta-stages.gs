/**
 * META LEAD STAGES  —  Google Sheet dropdown  ->  Meta Conversions API for CRM
 *
 * Lives as MetaStages.gs inside "Formspree | Form Script" (owner
 * digitalmarketingremote01). Mirror of the live file.
 *
 * Flow (2026-09-14, Danyal's funnel):
 *   Lead arrives (Make sends the "Lead" stage to Meta itself, module 11)
 *   -> Booked (automatic: Calendly booking whose email matches a lead row)
 *   -> Qualified / Not qualified / Converted   (Danyal's definitions, 2026-09-17)
 *      (Danyal picks the value in column K of the UK or Deutschland sheet;
 *       the installable onEdit trigger sends it to Meta with the lead's Meta ID)
 *
 * Sheet1 columns (both sheets) — L/M/N are Danyal's own, do not touch:
 *   A created_time · B full_name · C email · D phone · E company · F platform
 *   G budget · H website · I campaign · J country · K STATUS (dropdown)
 *   L replied_date · M booked_date · N notes
 *   O META LEAD ID (written by handleMetaLead_) · P META SYNC (log, this script)
 *
 * Meta side: dataset 1033196126360558, token META_CAPI_TOKEN in Script
 * Properties (same one meta-capi.gs uses). Events are CRM events:
 *   action_source "system_generated", custom_data.event_source "crm",
 *   user_data.lead_id = the 15-17 digit Meta lead id from the Instant Form.
 */

var MS_COL_STATUS  = 11; // K
var MS_COL_REPLIED = 12; // L  replied_date (Danyal's)
var MS_COL_BOOKED  = 13; // M  booked_date  (Danyal's)
var MS_COL_LEADID  = 15; // O
var MS_COL_SYNC    = 16; // P
var MS_LEAD_SOURCE = 'Google Sheets';

// Dropdown value -> event name Meta receives. Order = funnel order.
// REDEFINED 2026-09-17 by Danyal (replaces Attended / Access granted / Subscribed / Lost):
//   Converted     = we got the client.
//   Qualified     = we attended the meeting and it is/was a potential client — "we need more like them".
//   Not qualified = not the right fit: never replied, never booked, wrong business, etc.
// New and Booked stay: New = fresh lead (Make already sent "Lead"), Booked is set
// automatically when a Calendly booking matches the lead's email.
var MS_STAGES = [
  ['New',           ''],                 // Make already sent "Lead"
  ['Booked',        'MeetingBooked'],
  ['Qualified',     'Qualified'],
  ['Not qualified', 'NotQualified'],
  ['Converted',     'Converted']
];

// Old values -> new dropdown values (normalisation in setup).
var MS_LEGACY = { 'new': 'New', 'emailed': 'New', 'contacted': 'New',
                  'booked': 'Booked',
                  'attended': 'Qualified', 'access granted': 'Qualified', 'audit delivered': 'Qualified',
                  'subscribed': 'Converted', 'won': 'Converted',
                  'lost': 'Not qualified', 'no_show': 'Not qualified', 'noshow': 'Not qualified', 'no-show': 'Not qualified' };

function msEventFor_(stage) {
  stage = String(stage || '').trim().toLowerCase();
  for (var i = 0; i < MS_STAGES.length; i++) {
    if (MS_STAGES[i][0].toLowerCase() === stage) return MS_STAGES[i][1];
  }
  return '';
}

/**
 * ONE-TIME SETUP — run from the editor once. Restores Danyal's L/M headers,
 * names K/O/P, puts the dropdown on K, normalises old status values, installs
 * the onEdit trigger for both spreadsheets. Safe to re-run.
 */
function setupMetaStages() {
  var ids = [MIF_SHEET_UK, MIF_SHEET_DE];
  var values = MS_STAGES.map(function (s) { return s[0]; });
  ids.forEach(function (id) {
    var sh = SpreadsheetApp.openById(id).getSheetByName(MIF_TAB);
    sh.getRange(1, MS_COL_STATUS).setValue('status');
    sh.getRange(1, MS_COL_REPLIED).setValue('replied_date');
    sh.getRange(1, MS_COL_BOOKED).setValue('booked_date');
    sh.getRange(1, MS_COL_LEADID).setValue('meta_lead_id');
    sh.getRange(1, MS_COL_SYNC).setValue('meta_sync');
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(values, true).setAllowInvalid(true).build();
    // allowInvalid(true): a hard rule aborted the whole run on an old hand-typed
    // value (2026-09-14). Unknown values are simply not sent to Meta.
    sh.getRange(2, MS_COL_STATUS, sh.getMaxRows() - 1, 1).setDataValidation(rule);
    var last = sh.getLastRow();
    if (last > 1) {
      var rng = sh.getRange(2, MS_COL_STATUS, last - 1, 1);
      var v = rng.getValues().map(function (r) {
        var k = String(r[0] || '').trim().toLowerCase();
        return [MS_LEGACY[k] || r[0]];
      });
      rng.setValues(v);
    }
  });

  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onStageEdit') ScriptApp.deleteTrigger(t);
  });
  ids.forEach(function (id) {
    ScriptApp.newTrigger('onStageEdit').forSpreadsheet(id).onEdit().create();
  });
  Logger.log('Meta stages set up on both sheets; 2 onEdit triggers installed.');
}

/** Installable onEdit trigger — fires when Danyal changes column K. */
function onStageEdit(e) {
  try {
    if (!e || !e.range) return;
    var sh = e.range.getSheet();
    if (sh.getName() !== MIF_TAB) return;
    if (e.range.getColumn() !== MS_COL_STATUS || e.range.getRow() < 2) return;
    if (e.range.getNumRows() !== 1) return;
    var row = e.range.getRow();
    var stage = String(e.value || sh.getRange(row, MS_COL_STATUS).getValue() || '').trim();
    var ev = msEventFor_(stage);
    if (!ev) return;                                   // 'New' or blank: nothing to send
    var res = sendStageForRow_(sh, row, stage, ev);
    sh.getRange(row, MS_COL_SYNC).setValue(res);
    // keep Danyal's own date columns in step, but never overwrite a date he typed
    var today = Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyyy-MM-dd');
    if (ev === 'Contacted' && !sh.getRange(row, MS_COL_REPLIED).getValue()) {
      sh.getRange(row, MS_COL_REPLIED).setValue(today);
    }
    if (ev === 'MeetingBooked' && !sh.getRange(row, MS_COL_BOOKED).getValue()) {
      sh.getRange(row, MS_COL_BOOKED).setValue(today);
    }
  } catch (err) {
    try { e.range.getSheet().getRange(e.range.getRow(), MS_COL_SYNC).setValue('ERROR ' + err); } catch (x) {}
  }
}

/**
 * Send one stage for one sheet row. Returns the log text for column P.
 * A row without a Meta Lead ID (website lead, or a lead from before 2026-09-14)
 * is sent with hashed email/phone instead — Meta still accepts it but matches
 * it less reliably, so the log says so.
 */
function sendStageForRow_(sh, row, stage, eventName) {
  var vals   = sh.getRange(row, 1, 1, MS_COL_LEADID).getValues()[0];
  var email  = String(vals[2] || '').trim();
  var phone  = String(vals[3] || '').trim();
  var leadId = String(vals[MS_COL_LEADID - 1] || '').replace(/\D/g, '');
  var code   = sendMetaStage_(leadId, eventName, email, phone);
  var when   = Utilities.formatDate(new Date(), 'Europe/Berlin', 'dd.MM HH:mm');
  return (code === 200 ? 'sent ' : 'FAILED(' + code + ') ') + stage + ' ' + when +
         (leadId ? '' : ' (no lead id)');
}

/** Raw CRM event to Meta. Returns HTTP status; 200 = accepted. */
function sendMetaStage_(leadId, eventName, email, phone) {
  var user = {};
  if (leadId) user.lead_id = Number(leadId) || leadId;
  if (email)  user.em = [sha256(String(email).trim().toLowerCase())];
  if (phone) {
    var digits = String(phone).replace(/[^0-9]/g, '');
    if (digits) user.ph = [sha256(digits)];
  }
  if (!user.lead_id && !user.em && !user.ph) return 0;

  var ev = {
    event_name:    eventName,
    event_time:    Math.floor(Date.now() / 1000),
    action_source: 'system_generated',
    user_data:     user,
    custom_data:   { event_source: 'crm', lead_event_source: MS_LEAD_SOURCE }
  };
  var res = UrlFetchApp.fetch(
    'https://graph.facebook.com/v21.0/' + META_PIXEL_ID + '/events'
      + '?access_token=' + encodeURIComponent(getMetaToken_()),
    { method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ data: [ev] }), muteHttpExceptions: true });
  console.log('Meta stage ' + eventName + ' ' + res.getResponseCode() + ': ' + res.getContentText());
  return res.getResponseCode();
}

/**
 * Called from syncCalendlyBookings (Code.gs) for every NEW booking:
 *   try { markLeadBooked_(inviteeEmail, inviteeName); } catch (err) {}
 * Finds the lead row by email (both sheets), sets K = Booked, fills
 * booked_date (M) if empty, sends MeetingBooked. Rows already past Booked are
 * left alone (a re-booking after a no-show is sent again on purpose — Meta
 * wants every stage change).
 */
function markLeadBooked_(email, name) {
  email = String(email || '').trim().toLowerCase();
  if (!email) return 'no email';
  var ids = [MIF_SHEET_UK, MIF_SHEET_DE];
  for (var i = 0; i < ids.length; i++) {
    var sh = SpreadsheetApp.openById(ids[i]).getSheetByName(MIF_TAB);
    var last = sh.getLastRow();
    if (last < 2) continue;
    var emails = sh.getRange(2, 3, last - 1, 1).getValues();
    for (var r = 0; r < emails.length; r++) {
      if (String(emails[r][0] || '').trim().toLowerCase() !== email) continue;
      var row = r + 2;
      var cur = String(sh.getRange(row, MS_COL_STATUS).getValue() || '').trim().toLowerCase();
      if (['qualified', 'converted'].indexOf(cur) >= 0) {
        return 'already ' + cur;                       // further down the funnel — keep
      }
      sh.getRange(row, MS_COL_STATUS).setValue('Booked');
      if (!sh.getRange(row, MS_COL_BOOKED).getValue()) {
        sh.getRange(row, MS_COL_BOOKED).setValue(
          Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyyy-MM-dd'));
      }
      var res = sendStageForRow_(sh, row, 'Booked', 'MeetingBooked');
      sh.getRange(row, MS_COL_SYNC).setValue(res + ' (auto, Calendly)');
      return res;
    }
  }
  // 2026-09-30 (Danyal): a booking with no Instant Form row is still a real person we already
  // know — we only ever email Calendly links to people who filled a form or booked, never at
  // random. So report it to Meta on the hashed email instead of dropping it. Skips our own
  // addresses so test bookings stay out, which was the reason the 24.08 blind sender was pulled.
  // Live as ONE line in MetaStages.gs line 208 (Apps Script v24); kept readable here.
  if (email.indexOf('digitalmarketingremote') >= 0 || email.indexOf('danyalshahzad') >= 0)
    return 'own address skipped';
  var c = sendMetaStage_('', 'MeetingBooked', email, '');
  return 'no lead row, MeetingBooked sent, code ' + c + ' for ' + email;
}

/** Editor test: sends a marked verification stage (no real lead id). */
function testMetaStage() {
  var code = sendMetaStage_('', 'Qualified', 'support@digitalmarketingremote.com', '');
  Logger.log('HTTP ' + code + ' (200 = Meta accepted)');
}

/**
 * One-off, 2026-09-17: apply Danyal's re-classification of every real lead so far
 * and send each to Meta. Matched by exact full_name; test rows are left alone.
 */
var MS_APPLY_20260917 = {
  'Fraser Frase': 'Converted',
  'Yasir Dhillu': 'Qualified',
  'Aref Popalzai': 'Not qualified', 'Sam Amed': 'Not qualified', 'ulianaBSV': 'Not qualified',
  'Mahmoud Jalloh': 'Not qualified', 'Gemma Palmer': 'Not qualified',
  'Isuf Bunjaku': 'Not qualified', 'Harold Alexandre': 'Not qualified',
  'Wilken W Anne': 'Not qualified', 'Tilman Rillox': 'Not qualified'
};
function applyStages20260917() {
  var out = [];
  [MIF_SHEET_UK, MIF_SHEET_DE].forEach(function (id) {
    var sh = SpreadsheetApp.openById(id).getSheetByName(MIF_TAB);
    var last = sh.getLastRow();
    if (last < 2) return;
    var names = sh.getRange(2, 2, last - 1, 1).getValues();
    for (var r = 0; r < names.length; r++) {
      var name = String(names[r][0] || '').trim();
      var stage = MS_APPLY_20260917[name];
      if (!stage) continue;
      var row = r + 2;
      sh.getRange(row, MS_COL_STATUS).setValue(stage);
      var res = sendStageForRow_(sh, row, stage, msEventFor_(stage));
      sh.getRange(row, MS_COL_SYNC).setValue(res + ' (reclassified 17.09)');
      out.push(name + ': ' + res);
    }
  });
  Logger.log(out.join('\n'));
  return out;
}
