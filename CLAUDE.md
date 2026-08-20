# Digital Marketing Remote — Website Project

## Project Overview
Single-page HTML website for Digital Marketing Remote, a DACH-focused performance marketing agency.
- **File**: `index.html` (all HTML, CSS, JS in one file)
- **Language**: German (DACH market)
- **Live URL**: https://www.digitalmarketingremote.com

---

## Deployment — ALWAYS USE THIS FLOW

### Vercel Project (linked)
- **Account**: `digitalmarketingremote01-2315` (logged in via Vercel CLI)
- **Project**: `dmr-website` under `digital-marketing-remote-s-projects`
- **Production URL**: https://dmr-website-two.vercel.app
- **Custom Domain**: https://www.digitalmarketingremote.com
- **Linked**: `.vercel/project.json` exists in this directory

### Deploy to Production (UPDATED 2026-07-21 — user directive: GitHub → Vercel)
Preferred flow is now **git push → GitHub → Vercel auto-deploy**:
```
git add -A && git commit -m "..." && git push github HEAD:main
```
GitHub push access works via SSH key `~/.ssh/id_ed25519_dmr` (added to the account 2026-07-21;
`~/.ssh/config` maps github.com to it). The `github` remote uses the SSH URL.
Pushing to GitHub triggers a Vercel production deploy automatically (verified 2026-07-21).
`vercel --prod` still works as a fallback/hotfix path.
NOTE: the `origin` (GitLab) remote is still unauthenticated — pushes there fail.

### If Vercel CLI is not authenticated
Check auth status with:
```
vercel whoami
```
If not logged in, give the user this URL to authenticate:
```
https://vercel.com/login
```
Then run `vercel login` in the terminal and follow the prompts.
After login, link the project with:
```
vercel link --project dmr-website --yes
```
Then deploy with `vercel --prod`.

### NEVER ask the user to deploy manually. Always:
1. Check `vercel whoami` — if authenticated, proceed
2. If not authenticated, give URL: https://vercel.com/login and run `vercel login`
3. Run `vercel --prod` to deploy

---

## Git Remotes
- `origin` → GitLab (backup only, does NOT trigger Vercel)
- `github` → GitHub (connected to Vercel, but deploy via CLI is preferred)

---

## Website Structure
Section order (reordered 2026-07-23, proof-first for mobile — Clarity showed 57% of mobile visitors drop in the top 25%): Hero → Pilot → Cases/Erfolge (Success stories) → Reviews/Kundenstimmen → Process (So arbeiten wir / How-we-work) → Services → About → Pricing → FAQ → Contact → CTA. Same order DE+EN, one order for both viewports. Logo strip was removed earlier. Reviews used to sit dead-last; Cases+Reviews are now right after the Pilot offer.
- Hero: stats badge, headline, CTA buttons, hero form. Descriptive copy is now a scannable two-path (Projekt-Analyse / Konto-Audit — market/keywords vs. where budget is lost), not the old long paragraph.
- About section (founder background, 72 projects / 15 countries / €1.7M revenue)
- Services (Google Ads, Meta Ads, E-Commerce/Lead-Gen/SaaS, SEA, YouTube Ads, Tracking & Analytics)
- Process (6 steps)
- Case Studies (6, anonymized; only the Loganberry "E-Commerce Brand Launch" case has a screenshot)
- Pricing (UPDATED 2026-08-20, approved by Danyal: 3 single tiers Growth €799 / Pro €1.199 /
  Scale €1.799 + Enterprise; 2 dual tiers Dual Growth €1.299 / Dual Pro €1.899 + Dual
  Enterprise. The €349/€499 Starter tiers are DELIBERATELY gone — cheap clients are
  unprofitable and low fees read as risk. B2B-only § 14 BGB note.)
- OFFER (v2 2026-08-20, same day the €490 Startanalyse was tried and killed — Danyal
  judged an upfront price a lead-repellent): "Ihr kompletter Marketing-Plan" DE / "Your Complete Marketing Plan" EN (v5 — Danyal directive: he gives direction, Claude writes pro copy; simple, benefit-first). Scope is NOT keyword-centric: product/pricing/business model understood, competitor selling analysis, right channels & campaign types, keywords only IF search fits, audit of campaigns & creatives, recommendations & strategy (budget, website, next steps) — his REAL process made public: free 30-min intro call (listen: company, product,
  goals) → we do the work FREE (market+competitor analysis, keyword research with real
  CPCs, account audit if any, budget recommendation, 90-day plan) → written PDF report (NO delivery-time promise on the site — the 3-days/24h figure is internal context only) → client decides, second
  meeting, contract. DE headline: "Ihr kompletter Marketing-Plan. Kostenlos. Bevor Sie einen Cent ausgeben." 4-step line: buchen -> verstehen -> arbeiten -> Plan. Copy deliberately SHORT and simple — Danyal rejected longer/technical versions twice. FUNNEL (2026-08-20): HERO FORM REMOVED -> Calendly booking card; bottom form is the ONLY form, EMAIL-ONLY (no phone field, no WhatsApp/callback chips, kontakt/phone JS validation stripped); callback contact card removed — calls go through Calendly. WhatsApp contact card kept. DESIGN: animated glow orbs (hero + offer card), h1 2.9rem / section h2 2.15rem, scroll-reveal with 3s failsafe (never leave .rv unrevealed).
  Free report is deliberately meeting-gated (no call, no report = the qualification
  filter). NO €99/€490 entry fee — rejected. The pilot guarantee ("Monat 2 ohne
  Managementgebühr") stays REMOVED — never reintroduce result guarantees or free months.
  Funnel direction: Calendly booking is the PRIMARY conversion path; forms secondary.
- FAQs (accordion, Schema.org FAQPage markup in `<head>` — keep in sync, all 10)
- Contact forms (Google Apps Script) / Calendly
- Footer (Impressum/Datenschutz links to standalone pages + Cookie-Einstellungen)
- White-Label partner pages (added 2026-06-21): `/partner` (DE, `partner.html`) +
  `/en/partner` (EN, `en/partner.html`) — B2B agency-outsourcing offering. Linked from the
  homepage nav ("Für Agenturen") + a teaser band before the footer. A SEPARATE campaign
  drives these. hreflang DE/EN/x-default. EN page uses absolute asset paths (`/fonts/…`).
  NO legal bindings advertised here (no NDA/AVV/Kundenschutz); the "your client stays
  yours" promise is kept on purpose. Each page has its own Service + FAQPage schema.
- BILINGUAL (added 2026-06-21): site is fully DE/EN. German = `/`, `/partner`, `/impressum`,
  `/datenschutz`. English mirror = `/en`, `/en/partner`, `/en/impressum`, `/en/datenschutz`
  (files under `en/`, absolute asset paths `/fonts/…` `/case-*.webp`). DE⇄EN switcher in
  nav+footer on every page + hreflang de/en/x-default. EN homepage has a **€/£/$ currency
  toggle** (`setCur()`, `.cur[data-eur]` spans; £/$ approx, invoiced in EUR). EN pages reuse
  the same consent-gated tracking + conversion dataLayer events (form_submission /
  calendly_booking) so PRIMARY conversions fire on EN too — DO NOT alter German conversion
  buttons/text/tracking (user rule). When editing site content, update BOTH languages.
- Images: all case studies + hero are right-sized WebP (`*.webp`, ~88% lighter than the
  PNG/JPEG originals which are KEPT in repo). `og:image` stays `danyal-hero.jpeg` for social.

## Key Numbers (always use these)
- 72 projects total in 15 countries
- 57 projects in 13 countries — done by founder as INDEPENDENT CONSULTANT for a German
  investment company (Craft AEC GmbH). Never present their end-clients as DMR clients.
- Over €1.7 million generated revenue (verifiable) — do NOT claim €2M
- Since 2022
- Own direct clients (safe to name/show): Loganberry Official, PieseFord, Khayos Art

## Legal Constraints (LEARNED — do not violate)
- ALL tracking must stay consent-gated (loadTracking() only after cookie opt-in)
- Never name or show logos/screenshots of Craft AEC's end-clients (no permission)
- Only advertise numbers that are provable (UWG § 5)
- Legal pages are standalone: /impressum, /datenschutz (vercel.json cleanUrls)
- NO PROMISED SIGNED DOCUMENTS anywhere on the site (user directive 2026-08-07). Removed that day:
  the partner pages' "unterzeichnete Kundenschutz-Vereinbarung" / "signed non-solicitation agreement",
  the homepage FAQ's written service agreement + DSGVO-AVV/GDPR-DPA promises (DE+EN), and the EN pilot
  line "set out in writing in the service agreement". Reason he gave: prices are already low, he does not
  want to surrender contractual guarantees on top for trust. Keep describing what we DO (no contact with
  partner clients, client keeps the account, monthly cancellable) — never promise a signed instrument.
  NOTE: the legal AVV/DPA obligation still applies where personal data is processed; it is simply not advertised.
- Minimize self-binding language site-wide (user directive 2026-06-21): no guarantees/
  promises that bind DMR, the agency, or employees unless absolutely necessary (legally
  mandatory) or morally required. REMOVED 2026-08-20 with the pilot: the Performance-Garantie (free
  2nd month = own waived fee, no cash out). REMOVED 2026-06-21: "Vertrag nach deutschem
  Recht" public claim, hard "innerhalb von 24 Stunden" → "in der Regel innerhalb von 24
  Stunden". Keep protective/mandatory text (Impressum disclaimers, Datenschutz) — removing
  it adds exposure. Audit new copy for: Garantie, versprechen, verpflichten, "nach
  deutschem Recht", advertised NDAs/AVV.

## Tracking architecture — BINDING (added 2026-08-20 after 60 pages shipped untracked)
- ALL tracking lives in `/assets/tracking.js` (IDs, GTM/GA4, Meta Pixel, Clarity, consent
  modal). NEVER copy tracking code or a `#ck` banner inline into a page.
- Every page must load it via `<script src="/assets/tracking.js" defer></script>`.
  SAFETY NET: `vercel.json` buildCommand runs `tools/inject-tracking.mjs` on every deploy,
  which injects the line into any .html missing it — so a forgotten page still ships
  tracked. Do not remove that buildCommand. `--check` mode is wired into verify-site.sh.
- History: a 2026-08-13 publish commit silently stripped the include from 60 pages;
  nobody noticed for a week. That is why injection happens at build time, not by hand.
- Clarity: `clarity('consent', true)` MUST be called after the tag loads (done inside
  loadTracking). Clarity enforces consent signals for EEA/UK/CH visits since 2025-10-31 —
  without the call those sessions are dropped/fragmented even after cookie opt-in.
- Consent UI: one centered modal, injected by tracking.js on every page (DE/EN by
  <html lang>), scroll-locked until the visitor picks "Alle akzeptieren" or
  "Nur notwendige". Both are one click (DSGVO). No page ships its own banner markup.

## Integrations
- Google Tag Manager: GTM-MFXPMZ8W (Google Ads Conversion ID constant: 18174154684 — bare number, GTM adds AW- prefix)
- Google Analytics 4: G-N6G3MVTEH5
- Meta Pixel / dataset: 1033196126360558 (swapped 2026-08-11; the old 957297367335870 is retired — never reuse it)
- Microsoft Clarity: x4vko0dld9
- Calendly booking: digitalmarketingremote01@gmail.com
- Calendly redirect hash: #danke-termin
- Form emails: Google Apps Script "Formspree | Form Script" (owner digitalmarketingremote01@gmail.com)
- Meta CAPI server-side (GAS, mirror in `tools/meta-capi.gs`): form leads fire 'Lead' from doPost;
  Calendly bookings fire custom event 'CalendlyBooking' from syncCalendlyBookings (renamed from
  'Schedule' 2026-08-20, deploy v14) for each NEW booking row, event_id `booking.<calendar event id>`.
  SERVER-SIDE ONLY — the browser pixel's booking (Schedule) calls were removed; do not re-add fbq
  booking events. Token = META_CAPI_TOKEN in Script Properties; tracking is try/catch-wrapped,
  never breaks the sync.

## Email — RESOLVED 2026-06-13
- support@digitalmarketingremote.com now works via **forwardemail.net** (free forwarding).
  DNS on Vercel: MX mx1/mx2.forwardemail.net (10/20) + TXT
  `forward-email=support:digitalmarketingremote01@gmail.com`. Mail to support@ forwards
  to the Gmail inbox (verified delivered). Add via `vercel dns add` if ever re-doing.
- GAS deployment v6 (2026-06-13): lead notification recipient + auto-reply replyTo =
  support@digitalmarketingremote.com. Auto-reply "not a bot" line replaced with warm
  personal line ("…und ich, Danyal, schaue sie mir persönlich an…"). To change the email
  templates, edit Code.gs then Deploy → Manage deployments → edit → Version: New version.
- Calendly account/display timezone = **Pakistan Standard Time (Karachi, GMT+5)** — set
  2026-06-14 to MATCH the host's Google Calendar (also PKT). It was on CET, which caused a
  3-hour gap between Calendly notifications (CET) and the Google Calendar event (PKT). Host
  now sees bookings in his real local time; clients still auto-see their own zone. Set at
  Profile → Time Zone. DO NOT set this back to CET. (History: was US-Eastern → CET on
  2026-06-13 → PKT on 2026-06-14.)
- Calendly **Availability schedule** timezone stays **Central European Time** ON PURPOSE
  (Availability → Schedules, bottom) so slots are offered during German business hours
  (9–17 CET). This is separate from the account/display TZ above — do not "align" them.
- To SEND as support@ from Gmail (optional polish): Gmail Settings → Accounts → "Send mail
  as" → add support@, SMTP smtp.forwardemail.net:465, password = a forwardemail.net app pw.

## Schema.org
- ProfessionalService schema in `<head>` (line ~28)
- FAQPage schema in `<head>` (line ~29) — always update when FAQs change

---

## Verification before saying "done" — MANDATORY

Automated checks confirm code shipped. They do NOT confirm the page looks right.
Lighthouse scored 100/100 while the founder photo was cropped headless, the hero copy
was unreadable, and two stray buttons sat under the desktop footer. Never report "done"
on green checks alone.

### Step 1 — automated (fast)
```
tools/verify-site.sh          # pages live, local==live, conversion chain, mobile-UI leak, consent
tools/verify-site.sh --full   # + Lighthouse mobile & desktop (~3 min)
```
Fails loudly. If anything fails, it is not done.

### Step 2 — visual sweep (never skip)
Look at the WHOLE page, top to bottom, at BOTH widths — as a first-time visitor, not as
the person who wrote the change:

- **Mobile (390px):** Chrome cannot resize below display width. Load the site, then
  `document.body.innerHTML='<iframe src="/?v=1" style="width:390px;height:780px">'`
  (same-origin, so `contentDocument` is readable). Step down the page with
  `#main{transform:translateY(-Npx)}` and screenshot every ~700px. Force lazy images
  first (`img.loading='eager'; img.src=img.src`) or they stay blank and you learn nothing.
- **Desktop (full width):** scroll to `document.documentElement.scrollHeight` and screenshot
  the BOTTOM too — the stray-buttons bug lived below the footer and survived a day because
  only the top and middle were ever checked.

### Step 3 — check the opposite state
Every mobile-only change must be verified NOT to affect desktop, and vice versa.
Mobile-only UI needs a base `display:none` outside the media query, or it leaks to desktop.

### Step 4 — read the copy as a visitor
Read new/changed text in the language a visitor reads it. If it needs a second read, rewrite it.

### Known testing gotchas
- Inside a background iframe, scroll events, smooth-scroll and `setInterval` are throttled or
  dead — dispatch `new Event('scroll')` manually; never conclude "broken" from that alone.
- Inline `style=` beats CSS: grep for inline colours when fixing contrast.
- `set -o pipefail` + `grep -q` on a big variable = false FAIL (SIGPIPE). Use `grep -q <<<"$var"`.
- Verify against the LIVE URL with a cache-buster, never local files or a warm tab.

---

# WORKING RULES — set by Danyal, binding (added 2026-08-15)

These are the rules he has actually stated, in his words where it matters. They override
convenience, speed and any default behaviour. Breaking one is a failure even if the output looks fine.

## 1. Dates — check at the moment you use them

The local clock and any earlier answer in the same session are both unreliable; a session stays
open across days. Before stamping a date on anything, check an external server:

```
curl -sI https://www.google.com | grep -i '^date:'
```

- Never write "today" about work done earlier in a long-running session.
- Group output by real calendar day; confirm with `git log --date=format:'%Y-%m-%d %H:%M'`.
- Cost of ignoring this: pages published 15 Aug were stamped 13 Aug, and a "13 articles today"
  report where the true figure for that day was 2.

## 2. Accuracy is the agent's responsibility, not his

His words: "you can upload, but strict rule is you check your written with proper research if any
number and any quote or any description is wrong or outdated thats on claude not doing the proper
check and not doing the proper work not me."

Publishing without asking does NOT mean checking less. It means there is no second pair of eyes.

## 3. The source-verification gate

Run `python3 SEO/verification/verify_quotes.py <file.md>` before anything goes live. 0 FAIL required.

- Quotes are checked against the **LIVE source page**, never against an evidence pack or a
  research summary. Summaries paraphrase — one handed over the invented German word "Korrektionen"
  where Google's page says "Korrekturen".
- The verifier does **NOT** check numbers in tables, headings, answer boxes or our own prose.
  Every figure — prices, durations, percentages, deadlines, thresholds — must be traced by hand to
  the live page, with the source URL cited beside it. If it can't be traced, it doesn't ship.
- Click paths and process descriptions: confirm against the current help page. UIs change.
- A page the fetcher can't read (e.g. Meta's help centre returns 400) = quotes unverifiable =
  the topic is reported back unwritten, not softened. Topic 8 of the 30 is parked for this reason.
- Writing tip that avoids false failures: use `"straight quotes"` only for real source quotes.
  Use `<em>` or `*italics*` for emphasis — German „…“ and stray quote marks break the parser.

## 4. Publishing

Default: **never publish without his explicit approval.** Drafts queue until he says yes.

Scoped exception, this batch only: the 30 approved topics in `SEO/topic-plan-30.md` may be
published without a per-article yes ("i approve here … and upload", then "approve all").
The benchmark stage, the verification gate and the browser preview all still run. Topic 31
needs fresh approval.

## 5. How content is made

1. Benchmark what the top agencies already published on the topic; find the gaps and what is outdated.
2. Write ONE article, published as a DE + EN pair — same structure, same claims, same sources.
   Adapt only for market: DACH specifics on `/ratgeber/…`, global framing on `/en/guides/…`.
3. Never copy competitor text — their copyright, and a duplicate page cannot rank.
4. Keep the pair hreflang-linked and never let the two drift apart in substance.

## 6. Scope — do what he asked, nothing else

"we only need what we need, stop trying to be efficient where i dont even need you to be efficient."

Report a finding in one line and stop. Do not build the fix, and do not dress optional tidying up
as something that needs doing. Rejected examples: hub pages, rerouting nav to new pages,
tidy-up redirects. Homepage nav anchors (`/#services`, `/en#services`) are deliberate — leave them.

## 7. How to report — SHORT AND SIMPLE, ALWAYS

His standing rule: answer short and simple. Every time, not just when asked.

- A few lines. No tables unless he asks for one. No walls of text.
- Lead with the answer. Stop there. He asks if he wants the detail.
- Plain words, no jargon, no showing my working.
- Straight answers, not diplomatic ones.
- Answer in the unit he asked for: articles are articles, pages are pages.
- Verify the count from files or git **before** answering, not after he challenges it.
- Never imply organic progress is faster or bigger than it is. Current honest expectation:
  winnable keywords here run 10–320 searches/month; 30 articles reaching position 3–5 is roughly
  150–250 visits/month **total**, after 3–6 months. External backlinks are 0 and cap everything.
- When he asks about a change of mine, the honest answer is often "nothing is wrong with yours,
  that was mine" — say it immediately instead of explaining the technique.

## 8. Legal / claims

- No promised signed documents anywhere (see the Legal Constraints section above).
- Minimise self-binding language; only provable numbers (UWG § 5).
- Tax topics: state plainly that we are a marketing agency, not tax advisers, report only what the
  platform documents, and send the reader to their own accountant.
