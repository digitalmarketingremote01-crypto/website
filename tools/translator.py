"""Header 'Translate' menu: opens the current page through Google Translate (translate.goog).
No script loads on our site, so consent/tracking are unaffected. Shared by the homepage and
tools/apply-site-chrome.py. Danyal 2026-10-06: English site only, visitors translate it themselves."""
LANGS = [('de', 'Deutsch'), ('fr', 'Français'), ('es', 'Español'), ('it', 'Italiano'), ('nl', 'Nederlands'),
         ('pt', 'Português'), ('pl', 'Polski'), ('tr', 'Türkçe'), ('ar', 'العربية'), ('zh-CN', '中文')]
PROXY = 'https://www-digitalmarketingremote-com.translate.goog'
GLOBE = ('<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/>'
         '<path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"/></svg>')


def menu(path):
    items = ''.join(f'<a href="{PROXY}{path}?_x_tr_sl=en&amp;_x_tr_tl={c}&amp;_x_tr_hl={c}" lang="{c}" hreflang="{c}" rel="nofollow">{n}</a>'
                    for c, n in LANGS)
    return (f'<details class="tr" translate="no"><summary aria-label="Translate this page">{GLOBE}<span>Translate</span></summary>'
            f'<div class="tr-m">{items}</div></details>')


CSS = ('.tr{position:relative}'
       '.tr summary{display:flex;align-items:center;gap:.35rem;list-style:none;cursor:pointer;font-size:.76rem;font-weight:700;color:var(--ink);border:1.5px solid var(--line);border-radius:999px;padding:.34rem .7rem;transition:border-color .2s}'
       '.tr summary::-webkit-details-marker{display:none}'
       '.tr summary:hover,.tr[open] summary{border-color:var(--ink)}'
       '.tr svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2}'
       '.tr-m{position:absolute;right:0;top:calc(100% + 8px);z-index:1100;display:grid;min-width:170px;padding:.4rem;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 18px 40px -18px rgb(29 46 69 / .45)}'
       '.tr-m a{padding:.5rem .7rem;border-radius:8px;font-size:.86rem;font-weight:500;color:var(--ink);text-decoration:none}'
       '.tr-m a:hover{background:var(--acc-l);text-decoration:none}'
       '@media(max-width:600px){.tr summary span{display:none}}')

CLOSE = ("<script>document.addEventListener('click',function(e){document.querySelectorAll('details.tr[open]')"
         ".forEach(function(d){if(!d.contains(e.target))d.removeAttribute('open');});});</script>")
