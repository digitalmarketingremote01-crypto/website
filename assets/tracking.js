/* =============================================================================
   DMR | Site Tracking | single source of truth
   -----------------------------------------------------------------------------
   Loaded by EVERY page via:  <script src="/assets/tracking.js" defer></script>

   Add that one line to any new page (article, landing page, anything) and it
   inherits the full stack automatically. Do NOT copy tracking code inline into
   pages — that is what caused 36 of 40 pages to end up untracked and the
   remaining 4 to drift into 3 different versions.

   DSGVO / TDDDG behaviour (unchanged from the original homepage implementation):
     - Google (GTM + GA4) uses Consent Mode v2 "advanced": loads always, but
       sends cookieless pings until the visitor opts in.
     - Meta Pixel + Microsoft Clarity have no consent-mode support, so they load
       ONLY after explicit opt-in.
     - GTM/GA4 injection is deferred to first interaction or 3s so tag JS never
       blocks the mobile LCP paint. Do not make these eager.
   ========================================================================== */
(function () {
  'use strict';

  /* --- IDs: change here, nowhere else ------------------------------------- */
  var META_PIXEL_ID = '1033196126360558';
  var GTM_ID        = 'GTM-MFXPMZ8W';
  var GA4_ID        = 'G-N6G3MVTEH5';
  var CLARITY_ID    = 'x4vko0dld9';

  /* --- idempotence: never initialise twice on one page -------------------- */
  if (window._dmrTracking) return;
  window._dmrTracking = true;

  var CONSENT_KEY = 'dc';
  var granted = function () {
    try { return localStorage.getItem(CONSENT_KEY) === 'y'; } catch (e) { return false; }
  };

  /* --- Vercel Web Analytics: the ONLY consent-free counter ------------------
     Deliberately loads for every visitor, before and regardless of the consent
     choice. It sets no cookies and stores/reads nothing on the device — Vercel
     identifies a visit by a hash of the incoming request, discarded after 24h,
     and keeps aggregates only. No device storage means TDDDG § 25 and PECR
     reg. 6 are not engaged, so no consent is required.
     This is what shows total real traffic while GA4/Pixel/Clarity only ever see
     the visitors who accepted. Requires Web Analytics to be ENABLED on the
     Vercel project — without that the script 404s harmlessly. */
  (function () {
    var va = document.createElement('script');
    va.defer = true;
    va.src = '/_vercel/insights/script.js';
    document.head.appendChild(va);
  })();

  /* --- Consent Mode v2 defaults (must run before GTM) --------------------- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });
  gtag('set', 'url_passthrough', true);

  if (granted()) {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
  }

  /* --- Meta Pixel + Clarity: opt-in only ---------------------------------- */
  var _trkLoaded = false;
  function loadTracking() {
    if (_trkLoaded) return;
    _trkLoaded = true;

    gtag('consent', 'update', {
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });

    /* Meta Pixel */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');

    /* Microsoft Clarity */
    (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script",CLARITY_ID);
    /* Clarity enforces an explicit consent signal for EEA/UK/CH visits since
       2025-10-31 (default state: denied). Without this call, sessions from
       those regions are fragmented or dropped even after the tag loads. */
    window.clarity('consent', true);
  }
  window.loadTracking = loadTracking;

  /* --- GTM + GA4: deferred to first interaction or 3s (LCP protection) ----- */
  var _gtmDone = false;
  function loadGTM() {
    if (_gtmDone) return;
    _gtmDone = true;

    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',GTM_ID);

    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(ga);
    gtag('js', new Date());
    gtag('config', GA4_ID);

    if (granted()) loadTracking();
  }
  window.loadGTM = loadGTM;

  var _gtmEv = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
  function _gtmTrig() {
    _gtmEv.forEach(function (e) { window.removeEventListener(e, _gtmTrig); });
    setTimeout(loadGTM, 0);
  }
  _gtmEv.forEach(function (e) { window.addEventListener(e, _gtmTrig, { passive: true }); });
  setTimeout(loadGTM, 3000);

  /* --- Consent modal -------------------------------------------------------
     Injected by JS so no page needs the markup — this is the ONLY banner
     definition on the site; pages must NOT ship their own #ck markup.
     NON-BLOCKING bottom banner: the page stays readable and scrollable, and
     Impressum/Datenschutz stay reachable, because DSK OH Telemedien (119)+(122)
     require exactly that — a banner must not obstruct those pages or make
     content inaccessible, including on small displays. Do not turn this back
     into a full-screen overlay and do not lock scrolling. Both options are
     one click — "only necessary" is a stored decision, not a dismissal.
     --------------------------------------------------------------------- */
  var COPY = {
    de: {
      title: '🍪 Dürfen wir messen, was funktioniert?',
      body: 'Mit Ihrem Okay nutzen wir Cookies für Google Analytics &amp; Ads, Meta Pixel und Microsoft Clarity. Ohne Okay sendet Google nur cookielose, anonyme Signale (Consent Mode v2) — Meta Pixel &amp; Clarity bleiben aus. Änderbar jederzeit über „Cookie-Einstellungen" im Footer.',
      link: 'Datenschutzerklärung',
      href: '/datenschutz',
      deny: 'Nur notwendige',
      accept: 'Alle akzeptieren'
    },
    en: {
      title: '🍪 May we measure what works?',
      body: 'With your consent we use cookies for Google Analytics &amp; Ads, Meta Pixel and Microsoft Clarity. Without it, Google sends only cookieless, anonymous signals (Consent Mode v2) — Meta Pixel &amp; Clarity stay off. Changeable any time via "Cookie settings" in the footer.',
      link: 'Privacy Policy',
      href: '/en/datenschutz',
      deny: 'Only necessary',
      accept: 'Accept all'
    }
  };

  function lang() {
    var l = (document.documentElement.getAttribute('lang') || 'de').toLowerCase();
    if (l.indexOf('en') === 0) return 'en';
    if (location.pathname.indexOf('/en/') === 0 || location.pathname === '/en') return 'en';
    return 'de';
  }

  function injectBanner() {
    if (document.getElementById('ck')) return;    /* already open */
    if (granted()) return;                        /* already accepted */
    try { if (localStorage.getItem(CONSENT_KEY) === 'n') return; } catch (e) {}

    var t = COPY[lang()];

    if (!document.getElementById('ck-css')) {
      var css = document.createElement('style');
      css.id = 'ck-css';
      css.textContent =
        '#ck{position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);' +
        'width:min(680px,calc(100% - 1.6rem));z-index:9999;box-sizing:border-box}' +
        '#ck .ckc{background:#241c14;color:#fff;padding:1.15rem 1.3rem;border-radius:14px;' +
        'box-shadow:0 12px 44px rgba(0,0,0,.45);' +
        "font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" +
        'font-size:.8rem;line-height:1.5;box-sizing:border-box;max-height:60vh;overflow-y:auto}' +
        '#ck p{margin:0 0 .95rem}' +
        '#ck a{color:#f0ac78;text-decoration:underline}' +
        '#ck .ckr{display:flex;gap:.7rem;flex-wrap:wrap}' +
        /* Both buttons are deliberately identical in size, weight and solidity —
           DSK OH Telemedien (133) requires the refusal option to be an equivalent
           alternative in size, colour, contrast and typeface. Do not restyle one
           of them into a ghost/outline button. */
        '#ck .ckb{flex:1 1 150px;padding:.7rem 1.2rem;border-radius:8px;font-size:.85rem;' +
        'cursor:pointer;font-weight:600;border:none;font-family:inherit;line-height:1.2}' +
        '#ck .cka{background:#15803d;color:#fff}' +
        '#ck .ckd{background:#5b5048;color:#fff}' +
        '@media(prefers-reduced-motion:no-preference){#ck{animation:ckin .3s ease-out}' +
        '@keyframes ckin{from{opacity:0;transform:translate(-50%,12px)}' +
        'to{opacity:1;transform:translate(-50%,0)}}}';
      document.head.appendChild(css);
    }

    var d = document.createElement('div');
    d.id = 'ck';
    d.setAttribute('role', 'region');
    d.setAttribute('aria-label', t.title);
    d.innerHTML =
      '<div class="ckc"><p><strong>' + t.title + '</strong> ' + t.body +
      ' <a href="' + t.href + '" target="_blank" rel="noopener">' + t.link + '</a></p>' +
      '<div class="ckr">' +
      '<button class="ckb ckd" type="button" data-ck="deny">' + t.deny + '</button>' +
      '<button class="ckb cka" type="button" data-ck="accept">' + t.accept + '</button>' +
      '</div></div>';
    document.body.appendChild(d);

    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ck]');
      if (!b) return;
      if (b.getAttribute('data-ck') === 'accept') akC(); else dkC();
    });
  }

  function closeBanner() {
    var el = document.getElementById('ck');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  /* --- consent handlers (global: footer links use them) -------------------- */
  function akC() {
    try { localStorage.setItem(CONSENT_KEY, 'y'); } catch (e) {}
    closeBanner();
    loadGTM();
    loadTracking();
  }
  function dkC() {
    var was = _trkLoaded;
    try { localStorage.setItem(CONSENT_KEY, 'n'); } catch (e) {}
    closeBanner();
    gtag('consent', 'update', {
      ad_storage: 'denied',
      analytics_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    if (was) location.reload();
  }
  window.akC = akC;
  window.dkC = dkC;

  /* footer "Cookie-Einstellungen" link re-opens the choice
     (Art. 7 Abs. 3 DSGVO withdrawal) */
  function openCookieSettings() {
    try { localStorage.removeItem(CONSENT_KEY); } catch (e) {}
    closeBanner();
    injectBanner();
  }
  window.openCookieSettings = openCookieSettings;
  window.ckSettings = openCookieSettings;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBanner);
  } else {
    injectBanner();
  }
})();
