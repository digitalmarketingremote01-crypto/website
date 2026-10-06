#!/usr/bin/env python3
"""Give every non-homepage page the homepage's header, footer and palette.

    python3 tools/apply-site-chrome.py          # apply to all pages (idempotent)
    python3 tools/apply-site-chrome.py --check  # exit 1 if any page lacks the shared chrome

Rule (Danyal, 2026-10-06): all pages always use the same colour scheme, branding and layout.
The header/footer markup lives HERE, once; the styles live in /assets/site.css. A new page gets
both by running this script. Each page keeps its own tracking labels (calClick) where it had them.
"""
import glob, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAL = 'https://calendly.com/digitalmarketingremote01/30min'
SITE = 'https://www.digitalmarketingremote.com'
SKIP = {'index.html', 'de/index.html'}

T = {
 'en': dict(home='/', nav=[('/#about', 'About'), ('/#services', 'Services'), ('/#pricing', 'Pricing'), ('/#cases', 'Results'), ('/#contact', 'Contact'), ('/en/partner', 'For Agencies')],
            cta='Book a free call', other='DE', other_lang='de', other_home='/de', menu='Menu', navlabel='Main navigation',
            about='Performance marketing for growing businesses in the US, Canada, the UK and Europe. Data-driven, transparent, results-focused.',
            cols=[('Services', [('/#services', 'Google Ads'), ('/#services', 'Meta Ads'), ('/ecommerce', 'E-Commerce'), ('/lead-generation', 'Lead Generation'), ('/#services', 'Tracking &amp; Analytics')]),
                  ('Company', [('/#about', 'About'), ('/#cases', 'Success stories'), ('/#pricing', 'Pricing'), ('/#pilot', 'Free marketing plan'), ('/en/partner', 'For agencies'), ('/en/guides', 'Guides')])],
            contact='Contact', lang_name='Deutsch', imprint=('/en/imprint', 'Imprint'), privacy=('/en/privacy', 'Privacy', 'Privacy Policy'), cookies='Cookie settings',
            partner_cta='Book a partner call'),
 'de': dict(home='/de', nav=[('/de#about', 'Über uns'), ('/de#services', 'Leistungen'), ('/de#pricing', 'Preise'), ('/de#cases', 'Erfolge'), ('/de#contact', 'Kontakt'), ('/partner', 'Für Agenturen')],
            cta='Kostenlose Erstberatung buchen', other='EN', other_lang='en', other_home='/', menu='Menü', navlabel='Hauptnavigation',
            about='Performance-Marketing für den DACH-Markt. Datengetrieben, transparent, ergebnisorientiert.',
            cols=[('Leistungen', [('/de#services', 'Google Ads'), ('/de#services', 'Meta Ads'), ('/de/ecommerce', 'E-Commerce'), ('/de/lead-generation', 'Lead-Generierung'), ('/de#services', 'Tracking &amp; Analytics')]),
                  ('Unternehmen', [('/de#about', 'Über uns'), ('/de#cases', 'Erfolgsgeschichten'), ('/de#pricing', 'Preise'), ('/de#pilot', 'Kostenloser Marketing-Plan'), ('/partner', 'Für Agenturen'), ('/ratgeber', 'Ratgeber')])],
            contact='Kontakt', lang_name='English', imprint=('/impressum', 'Impressum'), privacy=('/datenschutz', 'Datenschutz', 'Datenschutzerklärung'), cookies='Cookie-Einstellungen',
            partner_cta='Partner-Gespräch buchen'),
}
SOC = ('<div class="sf-soc"><a href="https://www.facebook.com/digitalmarketingremote/" target="_blank" rel="noopener" aria-label="Facebook">fb</a>'
       '<a href="https://www.instagram.com/digitalmarketing.remote/" target="_blank" rel="noopener" aria-label="Instagram">ig</a>'
       '<a href="https://www.linkedin.com/company/121143999/" target="_blank" rel="noopener" aria-label="LinkedIn company page">in</a>'
       '<a href="https://www.linkedin.com/in/mdanyalshahzad/" target="_blank" rel="noopener" aria-label="LinkedIn personal">in↗</a></div>')


def cal(label):
    return f"window.calClick&amp;&amp;calClick('{label}')"


def header(t, other_href, cta_text, nav_label):
    links = ''.join(f'<a href="{h}">{n}</a>' for h, n in t['nav'])
    return (f'<header class="sn"><div class="sn-in">'
            f'<a href="{t["home"]}" class="sn-logo">Digital<span>Marketing</span>Remote</a>'
            f'<nav aria-label="{t["navlabel"]}">{links}</nav>'
            f'<div class="sn-cta"><a href="{other_href}" class="sn-lang" hreflang="{t["other_lang"]}" lang="{t["other_lang"]}">{t["other"]}</a>'
            f'<a href="{CAL}" onclick="{cal(nav_label)}" class="sn-btn">{cta_text}</a>'
            f'<button class="sn-hb" type="button" aria-label="{t["menu"]}" aria-expanded="false" '
            f'onclick="var h=this.closest(\'.sn\');this.setAttribute(\'aria-expanded\',h.classList.toggle(\'open\'))"><span></span><span></span><span></span></button></div></div>'
            f'<div class="sn-mm">{links}<a href="{other_href}" hreflang="{t["other_lang"]}" lang="{t["other_lang"]}">{t["other"]}</a>'
            f'<a href="{CAL}" onclick="{cal("mobile_menu")}" class="sn-btn">{cta_text} →</a></div></header>')


def footer(t, other_href):
    cols = ''.join(f'<div class="sf-col"><h3>{h}</h3><ul>' + ''.join(f'<li><a href="{u}">{n}</a></li>' for u, n in items) + '</ul></div>' for h, items in t['cols'])
    ck = f'<a href="#" onclick="window.ckSettings&amp;&amp;ckSettings();return false;">{t["cookies"]}</a>'
    contact = (f'<div class="sf-col"><h3>{t["contact"]}</h3><ul><li><a href="{CAL}" onclick="{cal("footer_termin")}">{t["cta"]}</a></li>'
               f'<li><a href="{other_href}">{t["lang_name"]}</a></li><li><a href="{t["imprint"][0]}">{t["imprint"][1]}</a></li>'
               f'<li><a href="{t["privacy"][0]}">{t["privacy"][1]}</a></li><li>{ck}</li></ul></div>')
    return (f'<footer class="sf"><div class="sf-in"><div class="sf-grid">'
            f'<div><div class="sf-logo">Digital<span>Marketing</span>Remote</div><p>{t["about"]}</p>{SOC}</div>{cols}{contact}</div>'
            f'<div class="sf-bot"><span>© 2024–2026 Digital Marketing Remote · Mohammad Danyal Shahzad</span>'
            f'<nav><a href="{t["imprint"][0]}">{t["imprint"][1]}</a><a href="{t["privacy"][0]}">{t["privacy"][2]}</a>{ck}</nav></div></div></footer>')


def pages():
    for f in sorted(glob.glob(os.path.join(ROOT, '**', '*.html'), recursive=True)):
        rel = os.path.relpath(f, ROOT)
        if rel in SKIP or rel.startswith(('client-documents', 'node_modules')):
            continue
        yield f, rel


def apply(path, rel):
    s = open(path, encoding='utf-8').read()
    lang = 'de' if re.search(r'<html[^>]*lang="de', s) else 'en'
    t = T[lang]
    alt = re.search(rf'<link rel="alternate" hreflang="{t["other_lang"]}" href="([^"]+)"', s)
    other = alt.group(1).replace(SITE, '') or '/' if alt else t['other_home']
    body_i = s.index('<body')
    head, body = s[:body_i], s[body_i:]
    # remove whatever header this page had (old shared chrome included, so the script is idempotent)
    m = re.search(r'<header class="sn">.*?</header>|<header class="gh">.*?</header>|<nav\b[^>]*>.*?</nav>', body, re.S)
    old_nav = m.group(0) if m else ''
    lbl = re.search(r"calClick\('([^']+)'\)", old_nav)
    nav_label = lbl.group(1) if lbl and 'mobile' not in lbl.group(1) else 'nav_termin'
    cta = t['partner_cta'] if 'partner' in rel else t['cta']
    new_h = header(t, other, cta, nav_label)
    if m:
        body = body[:m.start()] + new_h + body[m.end():]
    else:
        bt = re.match(r'<body[^>]*>', body)
        body = body[:bt.end()] + '\n' + new_h + body[bt.end():]
    body = re.sub(r'<div class="mm" id="mmenu">.*?</div>\s*', '', body, flags=re.S)
    f_all = list(re.finditer(r'<footer\b.*?</footer>', body, re.S))
    new_f = footer(t, other)
    if f_all:
        fm = f_all[-1]
        body = body[:fm.start()] + new_f + body[fm.end():]
    else:
        i = body.rindex('</body>')
        body = body[:i] + new_f + '\n' + body[i:]
    if '/assets/site.css' not in head:
        head = head.replace('</head>', '<link rel="stylesheet" href="/assets/site.css">\n</head>')
    out = head + body
    # Calendly widget accent follows the palette
    out = out.replace('primary_color=c9702f', 'primary_color=355f8c')
    if out != s:
        open(path, 'w', encoding='utf-8').write(out)
        return True
    return False


if __name__ == '__main__':
    if '--check' in sys.argv:
        bad = [r for f, r in pages() if 'class="sn"' not in open(f, encoding='utf-8').read() or '/assets/site.css' not in open(f, encoding='utf-8').read()]
        print('pages without shared chrome:', bad or 'none')
        sys.exit(1 if bad else 0)
    n = sum(apply(f, r) for f, r in pages())
    print('pages updated:', n)
