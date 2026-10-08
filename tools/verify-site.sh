#!/usr/bin/env bash
# Pre-report verification for digitalmarketingremote.com — automated half.
# Usage: tools/verify-site.sh [--full]     (--full also runs Lighthouse, ~3 min)
# The VISUAL half (see CLAUDE.md) is not optional and is not covered here.
set -uo pipefail
BASE="https://www.digitalmarketingremote.com"
TS=$(date +%s)
FAIL=0
pass(){ printf "  \033[32mPASS\033[0m  %s\n" "$1"; }
fail(){ printf "  \033[31mFAIL\033[0m  %s\n" "$1"; FAIL=1; }

echo "== 1. pages reachable (cache-busted) =="
for p in "" "en/partner" "en/imprint" "en/privacy" "en/guides" "ecommerce" "lead-generation" "sample-audits"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -H 'Cache-Control: no-cache' "$BASE/$p?cb=$TS")
  [ "$code" = "200" ] && pass "/$p ($code)" || fail "/$p returned $code"
done

echo "== 2. local files match what is LIVE (catches 'deployed?' mistakes) =="
for f in index.html; do
  url="$BASE/${f%/index.html}?cb=$TS"; [ "$f" = "index.html" ] && url="$BASE/?cb=$TS"
  lh=$(curl -sL -H 'Cache-Control: no-cache' "$url" | tr -d '[:space:]' | shasum | cut -c1-12)
  lo=$(tr -d '[:space:]' < "$f" | shasum | cut -c1-12)
  [ "$lh" = "$lo" ] && pass "$f identical to live" || fail "$f DIFFERS from live (local $lo vs live $lh) — not deployed?"
done

echo "== 3. conversion chain intact (forms + booking + thank-you) =="
home=$(curl -s -H 'Cache-Control: no-cache' "$BASE/?cb=$TS")
# Tracking lives in the shared assets/tracking.js module, not inline — check both
# the page and the module so this doesn't false-positive on that split.
trackjs=$(curl -s -H 'Cache-Control: no-cache' "$BASE/assets/tracking.js?cb=$TS")
grep -qF -- "assets/tracking.js" <<<"$home" && pass "tracking.js referenced on homepage" || fail "tracking.js NOT referenced on homepage"
for m in "danke-termin" "calendly_booking" "_calLoad"; do
  grep -qF -- "$m" <<<"$home" && pass "$m present" || fail "$m MISSING"
done
# the homepage is Calendly-only since the 2026-10 redesign; only check the form event if a form exists
if grep -qF -- "<form" <<<"$home"; then
  grep -qF -- "form_submission" <<<"$home" && pass "form_submission present" || fail "form_submission MISSING"
fi
for m in "GTM-MFXPMZ8W" "G-N6G3MVTEH5"; do
  { grep -qF -- "$m" <<<"$home" || grep -qF -- "$m" <<<"$trackjs"; } && pass "$m present" || fail "$m MISSING (checked home + tracking.js)"
done

echo "== 4. mobile-only UI must NOT leak onto desktop =="
for sel in '#mcta{display:none}'; do
  grep -qF -- "$sel" <<<"$home" && pass "base rule $sel" || fail "base rule $sel missing (mobile UI can leak to desktop)"
done
if grep -qF -- 'class="pcards' <<<"$home"; then
  grep -qF -- '.pcards{display:none}' <<<"$home" && pass "base rule .pcards{display:none}" || fail "base rule .pcards{display:none} missing"
fi

echo "== 4b. one pricing model (final band model, Danyal 2026-10-08) =="
grep -qF -- 'class="bands"' <<<"$home" && pass "homepage shows the ad-spend band table" || fail "homepage band price table missing"
for old in 'half price' '50% more ad budget' '£1,349' '£1,799' '£7,200' 'Dual Starter' 'You risk nothing'; do
  grep -qiF -- "$old" <<<"$home" && fail "old pricing wording back on the homepage: $old" || pass "no '$old'"
done
if grep -qF -- 'class="msw-nav' <<<"$home"; then
  grep -qF -- '.msw-nav{display:none}' <<<"$home" && pass "base rule .msw-nav{display:none}" || fail "base rule .msw-nav{display:none} missing"
fi

echo "== 1b. German site retired 2026-10-06: old URLs must 301 to the English twin =="
for p in "de" "partner" "ratgeber/google-ads-kosten" "impressum" "datenschutz"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/$p?cb=$TS")
  { [ "$code" = "301" ] || [ "$code" = "308" ]; } && pass "/$p redirects ($code)" || fail "/$p returned $code (should redirect)"
done

echo "== 5. EVERY page carries tracking (the 2026-08-13 publish stripped 60 pages) =="
if node tools/inject-tracking.mjs --check >/dev/null 2>&1; then
  pass "all local .html pages load /assets/tracking.js"
else
  fail "pages WITHOUT tracking.js — run: node tools/inject-tracking.mjs"
fi
if python3 tools/apply-site-chrome.py --check >/dev/null 2>&1; then
  pass "all pages carry the shared header, footer and palette (/assets/site.css)"
else
  fail "pages WITHOUT the shared look — run: python3 tools/apply-site-chrome.py"
fi
# spot-check one article LIVE (build-time injection must have run on Vercel)
art=$(curl -s -H 'Cache-Control: no-cache' "$BASE/en/guides/how-much-does-google-ads-cost?cb=$TS")
grep -qF -- "assets/tracking.js" <<<"$art" && pass "live article page loads tracking.js" || fail "live article page has NO tracking.js"
# Clarity must send the EEA/UK consent signal after opt-in (enforced since 2025-10-31)
grep -qF -- "clarity('consent', true)" <<<"$trackjs" && pass "Clarity consent signal present" || fail "Clarity consent signal MISSING — EEA/UK sessions get dropped"

echo "== 6. consent gating =="
{ grep -qF -- "url_passthrough" <<<"$home" || grep -qF -- "url_passthrough" <<<"$trackjs"; } && pass "Consent Mode v2 present" || fail "Consent Mode v2 missing (checked home + tracking.js)"
if grep -qF -- "clarity.ms/tag" <<<"$trackjs"; then
  grep -qF -- "function loadTracking" <<<"$trackjs" && pass "Clarity inside loadTracking (consent-gated)" || fail "Clarity may load before consent"
elif grep -qF -- "clarity.ms/tag" <<<"$home"; then
  grep -qF -- "function loadTracking" <<<"$home" && pass "Clarity inside loadTracking (consent-gated)" || fail "Clarity may load before consent"
else
  fail "Clarity not found in home or tracking.js"
fi

if [ "${1:-}" = "--full" ]; then
  echo "== 7. Lighthouse (mobile + desktop) =="
  for mode in "mobile" "desktop"; do
    if [ "$mode" = "mobile" ]; then FLAGS="--form-factor=mobile --screenEmulation.mobile"; else FLAGS="--preset=desktop"; fi
    npx -y lighthouse@12 "$BASE/" --only-categories=performance,accessibility,best-practices,seo \
      $FLAGS --output=json --output-path="/tmp/lh_$mode.json" \
      --chrome-flags="--headless=new --no-sandbox" --quiet >/dev/null 2>&1
    python3 - "$mode" <<'PY'
import json,sys
m=sys.argv[1]; a=json.load(open(f'/tmp/lh_{m}.json'))
sc={k:round(a['categories'][k]['score']*100) for k in ['performance','accessibility','best-practices','seo']}
cls=a['audits']['cumulative-layout-shift']['displayValue']; lcp=a['audits']['largest-contentful-paint']['displayValue']
bad=[k for k,v in sc.items() if v<90]
print(f"  {'FAIL' if bad else 'PASS'}  {m}: {sc} CLS={cls} LCP={lcp}")
PY
  done
fi

echo
[ "$FAIL" = "0" ] && echo "AUTOMATED CHECKS PASSED — now do the VISUAL SWEEP (CLAUDE.md) before reporting done." \
  || { echo "SOMETHING FAILED — do not report done."; exit 1; }
