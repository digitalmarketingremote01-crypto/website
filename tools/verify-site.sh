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
for p in "" "en" "partner" "en/partner" "impressum" "datenschutz" "en/impressum" "en/datenschutz"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -H 'Cache-Control: no-cache' "$BASE/$p?cb=$TS")
  [ "$code" = "200" ] && pass "/$p ($code)" || fail "/$p returned $code"
done

echo "== 2. local files match what is LIVE (catches 'deployed?' mistakes) =="
for f in index.html en/index.html; do
  url="$BASE/${f%index.html}?cb=$TS"; [ "$f" = "index.html" ] && url="$BASE/?cb=$TS"
  lh=$(curl -sL -H 'Cache-Control: no-cache' "$url" | tr -d '[:space:]' | shasum | cut -c1-12)
  lo=$(tr -d '[:space:]' < "$f" | shasum | cut -c1-12)
  [ "$lh" = "$lo" ] && pass "$f identical to live" || fail "$f DIFFERS from live (local $lo vs live $lh) — not deployed?"
done

echo "== 3. conversion chain intact (forms + booking + thank-you) =="
home=$(curl -s -H 'Cache-Control: no-cache' "$BASE/?cb=$TS")
for m in "danke-termin" "form_submission" "calendly_booking" "_calLoad" "GTM-MFXPMZ8W" "G-N6G3MVTEH5"; do
  grep -qF -- "$m" <<<"$home" && pass "$m present" || fail "$m MISSING"
done

echo "== 4. mobile-only UI must NOT leak onto desktop =="
for sel in '#mcta{display:none}' '.msw-nav{display:none}'; do
  grep -qF -- "$sel" <<<"$home" && pass "base rule $sel" || fail "base rule $sel missing (mobile UI can leak to desktop)"
done

echo "== 5. consent gating =="
grep -qF -- "url_passthrough" <<<"$home" && pass "Consent Mode v2 present" || fail "Consent Mode v2 missing"
grep -qF -- "clarity.ms/tag" <<<"$home" && { grep -qF -- "function loadTracking" <<<"$home" && pass "Clarity inside loadTracking (consent-gated)" || fail "Clarity may load before consent"; }

if [ "${1:-}" = "--full" ]; then
  echo "== 6. Lighthouse (mobile + desktop) =="
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
