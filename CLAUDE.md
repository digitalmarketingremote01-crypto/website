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
- Hero section with stats badge, headline, subheading, CTA buttons, hero form
- About section (founder background, 72 projects / 15 countries / €2M revenue)
- Services (Google Ads, Meta Ads, E-Commerce/Lead-Gen/SaaS, SEA, YouTube Ads, Tracking & Analytics)
- Process (4 steps: Erstberatung → Audit & Strategie → Onboarding & Freigabe → Optimierung)
- Case Studies (6 real client results with screenshots)
- Pricing (3 tiers: Starter €499, Growth €899, Scale €1,499 + Auf Anfrage pilot banner)
- FAQs (accordion, Schema.org FAQPage markup in `<head>`)
- Contact / Calendly booking section
- Footer

## Key Numbers (always use these)
- 72 projects total in 15 countries
- 57 projects in 13 countries for German investment partner
- Over €2 million generated revenue for clients
- Since 2022

## Integrations
- Google Tag Manager: GTM-MFXPMZ8W
- Google Analytics 4: G-N6G3MVTEH5
- Facebook Pixel: 957297367335870
- Microsoft Clarity: x4vko0dld9
- Calendly booking: digitalmarketingremote01@gmail.com
- Calendly redirect hash: #danke-termin

## Schema.org
- ProfessionalService schema in `<head>` (line ~28)
- FAQPage schema in `<head>` (line ~29) — always update when FAQs change
