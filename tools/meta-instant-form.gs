/**
 * META INSTANT FORM LEADS  —  Make.com  ->  Apps Script  ->  Sheet + 2 emails
 * =========================================================================
 * Added 2026-08-29.
 *
 * WHY THIS EXISTS (do not "simplify" it back into Make):
 * Make's Google Sheets module needs Google's RESTRICTED Drive scope. Google
 * blocks that scope for third-party OAuth clients on personal Gmail accounts
 * ("This app is blocked. This app tried to access sensitive info..."). The
 * documented workaround is a custom Google Cloud OAuth client, but a project
 * left in Testing forces re-authorisation EVERY 7 DAYS — the automation would
 * die silently once a week. So Make does no Google work at all: it just POSTs
 * the lead here, and this script (which already owns Sheets + Gmail rights)
 * does the writing and the sending.
 *
 * FLOW
 *   Meta Instant Form -> Make (Facebook Lead Ads, instant trigger)
 *     -> HTTP POST to this web app  (?meta_lead=1)
 *       -> row appended to the UK or Deutschland sheet
 *       -> notification email to Danyal
 *       -> confirmation email to the lead, sent AS support@
 *
 * ROUTING: form/campaign name containing "UK" -> UK sheet, else Deutschland.
 * Add a third country and this rule must be revisited.
 *
 * The two sheets live in danyalshahzad980@gmail.com's Drive and are shared
 * with digitalmarketingremote01@gmail.com (Editor) so this script can write.
 */

var MIF_SHEET_UK = '1FWt8s7pstr3089EGpiyXDxNo6l-r4Cj55uYWlyJ2_rI';
var MIF_SHEET_DE = '1-BG688mARRF9sYMcD78EWEZAxYu_WnPTpi1fnkHE8sE';
var MIF_TAB      = 'Sheet1';
var MIF_NOTIFY   = 'digitalmarketingremote01@gmail.com';
var MIF_FROM     = 'support@digitalmarketingremote.com';
var MIF_CALENDLY = 'https://calendly.com/digitalmarketingremote01/30min';

/**
 * Called from doPost when the request carries meta_lead=1.
 * Everything is wrapped by the caller — a failure here must never 500 back to
 * Make, or Make will retry and duplicate the lead.
 */
function handleMetaLead_(p) {
  // Meta names a custom question's field after the QUESTION TEXT, not after a
  // tidy key like "budget". Mapping field-by-field in Make therefore silently
  // returns empty for every custom question — that is how the 30-08 UK lead
  // (Fraser Frase) reached the sheet with nothing but a name, and routed to
  // Germany because the campaign field was empty too.
  //
  // So Make now also posts the whole answer set as `fields_json`, and we read
  // it here by matching the question wording. Adding a new question to the
  // form needs no change in Make, and only a keyword here if we want it in its
  // own column.
  var ans = parseMetaFields_(p.fields_json);

  var pick = function (named, keywords) {
    var direct = String(named || '').trim();
    if (direct) return direct;
    return matchAnswer_(ans, keywords);
  };

  var full     = pick(p.full_name || p.name, ['full name', 'name', 'vollständiger name']);
  var email    = pick(p.email, ['email', 'e-mail', 'mail']);
  var phone    = pick(p.phone || p.phone_number, ['phone', 'telefon', 'mobile']);
  var company  = pick(p.company || p.company_name, ['company', 'unternehmen', 'firma']);
  var platform = pick(p.platform, ['platform', 'plattform', 'interested in']);
  var budget   = pick(p.budget, ['budget', 'werbebudget', 'monthly advertising']);
  var website  = pick(p.website, ['website', 'webseite', 'site']);
  var startWhn = pick(p.start_when, ['start', 'beginnen', 'when do you']);
  var created  = String(p.created_time || '').trim();

  // Campaign/form name decides the country, so fall back hard if it is missing:
  // an empty value used to silently mean "Germany".
  var campaign = String(p.campaign || p.form_name || p.ad_name || '').trim();

  // ---- route ---------------------------------------------------------------
  // Prefer the form/campaign name. If that is empty, fall back to signals in the
  // lead itself (+44 number, .co.uk / .uk address, GBP budget) rather than
  // defaulting a UK lead into the German sheet.
  var hay = (campaign + ' ' + phone + ' ' + email + ' ' + website + ' ' + budget);
  var isUK = /\bUK\b|United Kingdom|\+44|\.co\.uk|\.uk\b|£|GBP/i.test(hay);
  var sheetId = isUK ? MIF_SHEET_UK : MIF_SHEET_DE;
  var country = isUK ? 'UK' : 'DE';

  var stamp = created || Utilities.formatDate(
    new Date(), 'Europe/Berlin', 'yyyy-MM-dd HH:mm');

  // ---- 1. append the row ---------------------------------------------------
  var note = 'Auto-logged from Meta Instant Form.';
  if (startWhn) note += ' Wants to start: ' + startWhn + '.';
  if (!campaign) note += ' No campaign name from Meta — country inferred from the lead.';

  SpreadsheetApp.openById(sheetId).getSheetByName(MIF_TAB).appendRow([
    stamp, full, email, phone, company, platform, budget, website,
    campaign, country, 'new', '', '', note
  ]);

  // ---- 2. tell Danyal ------------------------------------------------------
  var rows = [
    ['Name', full], ['Email', email], ['Phone', phone],
    ['Company', company], ['Platform', platform], ['Budget', budget],
    ['Website', website], ['Campaign', campaign], ['Country', country]
  ].map(function (r) {
    return '<tr><td style="padding:6px 12px;color:#666">' + r[0] +
           '</td><td style="padding:6px 12px;font-weight:600">' +
           (r[1] || '—') + '</td></tr>';
  }).join('');

  GmailApp.sendEmail(MIF_NOTIFY,
    'New Meta Lead: ' + (full || email) + ' · ' + country,
    'New Meta Instant Form lead: ' + full + ' / ' + email + ' / ' + phone,
    {
      from: MIF_FROM,
      name: 'Digital Marketing Remote',
      replyTo: email || MIF_FROM,
      htmlBody:
        '<div style="font-family:Arial,sans-serif;max-width:560px">' +
        '<h2 style="color:#c1633b;margin:0 0 4px">New Meta Lead</h2>' +
        '<p style="color:#666;margin:0 0 16px">' + stamp + ' (Berlin)</p>' +
        '<table style="border-collapse:collapse;width:100%">' + rows + '</table>' +
        '</div>'
    });

  // ---- 3. confirm to the lead ---------------------------------------------
  // Only if they actually gave an email. German by default; English for UK.
  if (email) {
    var subject = isUK
      ? 'Your free Marketing Plan — ' + (company || 'your business')
      : 'Ihr kostenloser Marketing-Plan — ' + (company || 'Ihr Unternehmen');

    GmailApp.sendEmail(email, subject, metaLeadPlainBody_(isUK, full, company), {
      from: MIF_FROM,
      name: 'Digital Marketing Remote',
      replyTo: MIF_FROM,
      htmlBody: metaLeadHtmlBody_(isUK, full, company)
    });
  }

  return { sheet: country, emailed: !!email };
}

/**
 * Turn Make's `fields_json` into [{q, a}, ...].
 * Meta's shape is [{name:'question text', values:['answer']}, ...] but Make can
 * hand it over in a few forms depending on how it stringifies, so be lenient —
 * a parse failure must never cost us the lead.
 */
function parseMetaFields_(raw) {
  if (!raw) return [];
  var data = raw;
  if (typeof raw === 'string') {
    try { data = JSON.parse(raw); }
    catch (e) { return parseLooseFields_(raw); }
  }
  if (!data) return [];
  if (!Array.isArray(data)) {
    // A plain object of question -> answer.
    return Object.keys(data).map(function (k) {
      return { q: String(k), a: flattenValue_(data[k]) };
    });
  }
  return data.map(function (f) {
    if (!f) return null;
    return {
      q: String(f.name || f.key || f.question || ''),
      a: flattenValue_(f.values !== undefined ? f.values : f.value)
    };
  }).filter(Boolean);
}

/** Last resort: "question: answer" lines when the payload is not valid JSON. */
function parseLooseFields_(raw) {
  return String(raw).split(/[\n;]+/).map(function (line) {
    var i = line.indexOf(':');
    if (i < 1) return null;
    return { q: line.slice(0, i).trim(), a: line.slice(i + 1).trim() };
  }).filter(function (x) { return x && x.a; });
}

function flattenValue_(v) {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.join(', ').trim();
  return String(v).trim();
}

/** First answer whose question contains any of the keywords. */
function matchAnswer_(ans, keywords) {
  for (var k = 0; k < keywords.length; k++) {
    var needle = keywords[k].toLowerCase();
    for (var i = 0; i < ans.length; i++) {
      if (ans[i].q.toLowerCase().indexOf(needle) > -1 && ans[i].a) return ans[i].a;
    }
  }
  return '';
}

/** Salutation that degrades gracefully when Meta gives us no name. */
function metaLeadHello_(isUK, full) {
  if (!full) return isUK ? 'Hello,' : 'Hallo,';
  var first = full.split(/\s+/)[0];
  return isUK ? 'Hello ' + first + ',' : 'Hallo ' + first + ',';
}

function metaLeadPlainBody_(isUK, full, company) {
  var who = company || (isUK ? 'your business' : 'Ihr Unternehmen');
  if (isUK) {
    return metaLeadHello_(isUK, full) + '\n\n' +
      'thank you for your enquiry via Facebook. We are Digital Marketing Remote — an agency for Google and Meta Ads.\n\n' +
      'The next step is a 30-minute video call. You tell me about ' + who + ' — your service, your pricing, what you want to achieve. After that I build your plan and send it to you as a PDF:\n\n' +
      '- Your competitors, and what makes you better\n' +
      '- The right channels and campaign types for you\n' +
      '- Keywords and real click prices, if search fits you\n' +
      '- An analysis of campaigns and ads already running\n' +
      '- Clear recommendations, budget and next steps\n\n' +
      "It's free, and you decide only after you've read it. No contract, no cost.\n\n" +
      'Choose a time here: ' + MIF_CALENDLY + '\n\n' +
      'Best regards\nDanyal Shahzad\nDigital Marketing Remote\n' + MIF_FROM;
  }
  return metaLeadHello_(isUK, full) + '\n\n' +
    'vielen Dank für Ihre Anfrage über Facebook. Wir sind Digital Marketing Remote — eine Agentur für Google und Meta Ads.\n\n' +
    'Der nächste Schritt ist ein 30-minütiges Video-Gespräch. Sie erzählen mir von ' + who + ' — Ihre Leistung, Ihre Preise, was Sie erreichen wollen. Danach erstelle ich Ihren Plan und schicke ihn Ihnen als PDF:\n\n' +
    '- Ihre Wettbewerber, und was Sie besser macht\n' +
    '- Die richtigen Kanäle und Kampagnentypen für Sie\n' +
    '- Keywords und echte Klickpreise, falls Suche zu Ihnen passt\n' +
    '- Eine Analyse bereits laufender Kampagnen und Anzeigen\n' +
    '- Klare Empfehlungen, Budget und nächste Schritte\n\n' +
    'Das ist kostenlos, und Sie entscheiden erst, nachdem Sie ihn gelesen haben. Kein Vertrag, keine Kosten.\n\n' +
    'Termin hier wählen: ' + MIF_CALENDLY + '\n\n' +
    'Viele Grüße\nDanyal Shahzad\nDigital Marketing Remote\n' + MIF_FROM;
}

function metaLeadHtmlBody_(isUK, full, company) {
  var who = company || (isUK ? 'your business' : 'Ihr Unternehmen');
  var bullets = isUK ? [
    'Your competitors, and what makes you better',
    'The right channels and campaign types for you',
    'Keywords and real click prices, if search fits you',
    'An analysis of campaigns and ads already running',
    'Clear recommendations, budget and next steps'
  ] : [
    'Ihre Wettbewerber, und was Sie besser macht',
    'Die richtigen Kanäle und Kampagnentypen für Sie',
    'Keywords und echte Klickpreise, falls Suche zu Ihnen passt',
    'Eine Analyse bereits laufender Kampagnen und Anzeigen',
    'Klare Empfehlungen, Budget und nächste Schritte'
  ];

  var intro = isUK
    ? 'thank you for your enquiry via Facebook. We are Digital Marketing Remote — an agency for Google and Meta Ads.'
    : 'vielen Dank für Ihre Anfrage über Facebook. Wir sind Digital Marketing Remote — eine Agentur für Google und Meta Ads.';

  var step = isUK
    ? 'The next step is a 30-minute video call. You tell me about <strong>' + who + '</strong> — your service, your pricing, what you want to achieve. After that I build your plan and send it to you as a PDF:'
    : 'Der nächste Schritt ist ein 30-minütiges Video-Gespräch. Sie erzählen mir von <strong>' + who + '</strong> — Ihre Leistung, Ihre Preise, was Sie erreichen wollen. Danach erstelle ich Ihren Plan und schicke ihn Ihnen als PDF:';

  var free = isUK
    ? "It's free, and you decide only after you've read it. No contract, no cost."
    : 'Das ist kostenlos, und Sie entscheiden erst, nachdem Sie ihn gelesen haben. Kein Vertrag, keine Kosten.';

  var cta      = isUK ? 'Choose a time'   : 'Termin wählen';
  var bye = isUK ? 'Best regards' : 'Viele Grüße';

  return '' +
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222;max-width:560px">' +
      '<p>' + metaLeadHello_(isUK, full) + '</p>' +
      '<p>' + intro + '</p>' +
      '<p>' + step + '</p>' +
      '<ul style="padding-left:20px">' +
        bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('') +
      '</ul>' +
      '<p>' + free + '</p>' +
      '<p style="margin:24px 0">' +
        '<a href="' + MIF_CALENDLY + '" style="background:#c1633b;color:#fff;' +
        'padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;' +
        'display:inline-block">' + cta + ' →</a>' +
      '</p>' +
      '<p style="margin-top:24px">' + bye + '<br>Danyal Shahzad<br>' +
        'Digital Marketing Remote<br>' +
        '<a href="mailto:' + MIF_FROM + '" style="color:#c1633b">' + MIF_FROM + '</a>' +
      '</p>' +
    '</div>';
}

/** Editor test — writes a clearly-marked row and sends both emails to us. */
/**
 * Replays the real 30-08 UK lead the way Meta actually sends it: ONLY
 * fields_json, with the question wording as the field names, and no campaign.
 * Before the parser existed this produced a name-only row in the German sheet.
 * It must now land in the UK sheet with every column filled.
 */
function testMetaLeadRealShape() {
  var r = handleMetaLead_({
    fields_json: JSON.stringify([
      { name: 'Which platform are you interested in?', values: ['Meta Ads (Facebook/Instagram)'] },
      { name: 'What is your monthly advertising budget?', values: ['\u00a31,000 \u2013 \u00a32,000'] },
      { name: 'Your website?', values: ['fraserpt.com'] },
      { name: 'Email', values: ['digitalmarketingremote01+shapetest@gmail.com'] },
      { name: 'Full name', values: ['ZZTEST Shape Please Ignore'] },
      { name: 'Phone number', values: ['+447962883000'] },
      { name: 'Company name', values: ['ZZTEST Ltd'] }
    ])
  });
  Logger.log(JSON.stringify(r));   // expect {"sheet":"UK","emailed":true}
}

function testMetaLeadDE() {
  var r = handleMetaLead_({
    full_name: 'ZZTEST Meta Bitte Ignorieren',
    email: 'digitalmarketingremote01+metatest@gmail.com',
    phone: '+490000000000',
    company: 'TEST GmbH',
    platform: 'Google Ads',
    budget: 'unter 1000 EUR',
    website: 'www.example.de',
    campaign: 'DMR | Instant Form | Germany | TEST'
  });
  Logger.log(JSON.stringify(r));
}

function testMetaLeadUK() {
  var r = handleMetaLead_({
    full_name: 'ZZTEST Meta Please Ignore',
    email: 'digitalmarketingremote01+metatestuk@gmail.com',
    phone: '+440000000000',
    company: 'TEST Ltd',
    platform: 'Meta Ads',
    budget: 'under 1000 GBP',
    website: 'www.example.co.uk',
    campaign: 'DMR | Instant Form | UK | TEST'
  });
  Logger.log(JSON.stringify(r));
}
