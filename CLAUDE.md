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
Section order: Hero → Logos → Pilot → About → Services → Process → Cases → Reviews → Pricing → FAQ → Contact → CTA
- Hero section with stats badge, headline, subheading, CTA buttons, hero form
- Logo strip: 3 own clients (Loganberry, PieseFord, Khayos Art) + anonymized industry pills
- About section (founder background, 72 projects / 15 countries / €1.7M revenue)
- Services (Google Ads, Meta Ads, E-Commerce/Lead-Gen/SaaS, SEA, YouTube Ads, Tracking & Analytics)
- Process (6 steps)
- Case Studies (6, anonymized; only the Loganberry "E-Commerce Brand Launch" case has a screenshot)
- Pricing (4 single tiers €499–€1,799 + 3 dual tiers + Enterprise; B2B-only § 14 BGB note)
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
- Minimize self-binding language site-wide (user directive 2026-06-21): no guarantees/
  promises that bind DMR, the agency, or employees unless absolutely necessary (legally
  mandatory) or morally required. KEPT by user choice: homepage Performance-Garantie (free
  2nd month = own waived fee, no cash out). REMOVED 2026-06-21: "Vertrag nach deutschem
  Recht" public claim, hard "innerhalb von 24 Stunden" → "in der Regel innerhalb von 24
  Stunden". Keep protective/mandatory text (Impressum disclaimers, Datenschutz) — removing
  it adds exposure. Audit new copy for: Garantie, versprechen, verpflichten, "nach
  deutschem Recht", advertised NDAs/AVV.

## Integrations
- Google Tag Manager: GTM-MFXPMZ8W (Google Ads Conversion ID constant: 18174154684 — bare number, GTM adds AW- prefix)
- Google Analytics 4: G-N6G3MVTEH5
- Facebook Pixel: 957297367335870
- Microsoft Clarity: x4vko0dld9
- Calendly booking: digitalmarketingremote01@gmail.com
- Calendly redirect hash: #danke-termin
- Form emails: Google Apps Script "Formspree | Form Script" (owner digitalmarketingremote01@gmail.com)

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
