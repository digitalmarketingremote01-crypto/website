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

### Deploy to Production
After making any changes to `index.html`, always deploy with:
```
vercel --prod
```
That's it. Do NOT use `git push` — deploy directly via Vercel CLI.

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

## Integrations
- Google Tag Manager: GTM-MFXPMZ8W (Google Ads Conversion ID constant: 18174154684 — bare number, GTM adds AW- prefix)
- Google Analytics 4: G-N6G3MVTEH5
- Facebook Pixel: 957297367335870
- Microsoft Clarity: x4vko0dld9
- Calendly booking: digitalmarketingremote01@gmail.com
- Calendly redirect hash: #danke-termin
- Form emails: Google Apps Script "Formspree | Form Script" (owner digitalmarketingremote01@gmail.com)

## Email — IMPORTANT
- support@digitalmarketingremote.com is displayed site-wide but has NO mail hosting
  (domain on Vercel DNS, no MX records) — incoming mail to it bounces.
- Until MX is set up, GAS sends lead notifications + uses replyTo
  digitalmarketingremote01@gmail.com (hotfix 2026-06-13, deployment v4).
- After user sets up mail hosting (e.g. Zoho Mail free): add MX via `vercel dns add`,
  then revert GAS recipient/replyTo to support@.

## Schema.org
- ProfessionalService schema in `<head>` (line ~28)
- FAQPage schema in `<head>` (line ~29) — always update when FAQs change
