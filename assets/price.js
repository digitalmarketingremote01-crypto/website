/* Live price figures inside running text (German guides, service page, FAQ answers).
 *
 * The £ list is the real price list. Any [data-gbp] element in the body is rewritten to the
 * converted figure at the CURRENT rate, rounded to the NEAREST number ending in 9
 * (Math.round(v/10)*10-1) — the same rule the pricing toggle uses. £199 = €229 = $269.
 *
 *   <span data-gbp="199">229 €</span>            ->  "229 €"   (default template "{v} €")
 *   <span data-gbp="199" data-t="€{v}">€229</span> -> "€229"
 *   data-c="USD" converts to dollars instead of euros.
 *
 * The text in the HTML is the fallback and must always be a correct figure at the rate of
 * the day it was written — it is what non-JS readers and crawlers see.
 *
 * NOT covered, and still manual: <title>, meta descriptions and JSON-LD schema. Google reads
 * those from the static file, so a script cannot keep them current.
 *
 * Spans with class "cur" are skipped: the two homepages and the partner pages own those
 * through their inline setCur() currency toggle. Shares the localStorage cache key with it,
 * so a page carrying both makes only one rate request per day.
 */
(function () {
  var RATE = { EUR: 1.1642, USD: 1.3531 };   /* fallback = rate on 2026-09-08 */
  var LOC  = { EUR: 'de-DE', USD: 'en-US' };
  var KEY  = 'dmrFxGbp2';

  function n9(v) { return Math.round(v / 10) * 10 - 1; }

  function render() {
    document.querySelectorAll('[data-gbp]').forEach(function (el) {
      if (el.classList.contains('cur')) return;          /* owned by the pricing toggle */
      var g = parseFloat(el.getAttribute('data-gbp'));
      if (!g) return;
      var c = el.getAttribute('data-c') || 'EUR';
      if (!RATE[c]) return;
      var t = el.getAttribute('data-t') || '{v} €';
      el.textContent = t.replace('{v}', n9(g * RATE[c]).toLocaleString(LOC[c]));
    });
  }

  function withRates() {
    var today = new Date().toISOString().slice(0, 10), c;
    try { c = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { c = null; }
    if (c && c.date === today && c.EUR && c.USD) { RATE.EUR = c.EUR; RATE.USD = c.USD; render(); return; }
    fetch('https://api.frankfurter.dev/v1/latest?from=GBP&to=EUR,USD')
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.rates && j.rates.EUR && j.rates.USD) {
          RATE.EUR = j.rates.EUR; RATE.USD = j.rates.USD; render();
          try { localStorage.setItem(KEY, JSON.stringify({ date: today, EUR: j.rates.EUR, USD: j.rates.USD })); } catch (e) {}
        }
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', withRates);
  else withRates();
})();
