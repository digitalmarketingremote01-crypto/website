#!/usr/bin/env python3
"""Build the public sample audits from COPIES of real client audits (the sent PDFs are only read).

    python3 tools/make-sample-audits.py            # writes /audits/<slug>.pdf + /audits/<slug>-<n>.webp
    python3 tools/make-sample-audits.py --kept     # also prints every readable text run, for review

Rules (Danyal, 2026-10-06):
- new navy branding (old orange/brown recoloured to the Harbour blue)
- client name, website, account IDs, phones: blurred hard (identifier terms below)
- "we don't give details so they can do it themselves": all body text, figures, tables and pictures
  are blurred. Readable: section headings, table headers and the opening bold line of each block.
- the PDF is built from images only, so no text can be copied out of it.
New audit: add an entry to AUDITS (and its identifier terms), run, then check the --kept output.
"""
import os, re, sys
import fitz, numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIENTS = os.path.join(os.path.dirname(ROOT), 'DMR Clients')
OUT = os.path.join(ROOT, 'audits')
Z = 2.2

AUDITS = [
    ('facilities', 'UK|crystalservices.uk.com|Facilities Management/Crystal Facilities Management Audit & Marketing Plan 19-09-2026.pdf',
     ['crystalservices.uk.com', 'Crystal Facilities Management', 'Crystal', '391-318-0021', '020 8038 9109', '020 8993 3831', 'Saudi', 'Sparkle', 'Lyra']),
    ('physio', 'UK|fraserpt.com|Physical Therapy/Fraser Physical Therapy Audit & Marketing Plan.pdf',
     ['fraserpt.com', 'Fraser Physical Therapy', 'FraserPT', 'Fraser', 'FPT', 'Oxford Circus']),
    ('food-shop', 'PK|homenom.pk|Homemade Food & Condiments/HomeNom Audit & Marketing Plan 28-09-2026.pdf',
     ['homenom.pk', 'HomeNom', 'Home Nom']),
    ('tiktok-agency', 'PK|socialstag.com|TikTok Agency/Social Stag Audit & Marketing Plan.pdf',
     ['socialstag.com', 'Social Stag', 'SocialStag', 'Stag']),
]


def keep_size(sz):
    # section titles (12.8), sub-headings (9.8), cover title/logo (16.5+). Not the client line (10.5)
    # and not price boxes (15).
    return 9.7 <= sz <= 10.0 or 12.5 <= sz <= 13.0 or sz >= 16


def hide(im, box, hard=False):
    x0, y0, x1, y1 = [int(v) for v in box]
    x0, y0 = max(0, x0), max(0, y0)
    x1, y1 = min(im.width, x1), min(im.height, y1)
    if x1 - x0 < 2 or y1 - y0 < 2:
        return
    c = im.crop((x0, y0, x1, y1))
    w, h = c.size
    k = 12 if hard else 5
    c = c.resize((max(1, w // k), max(1, h // k)), Image.BILINEAR).resize((w, h), Image.BILINEAR)
    c = c.filter(ImageFilter.GaussianBlur(7 if hard else 3))
    im.paste(c, (x0, y0))


def recolour(im):
    """Old Ember palette (orange #c9702f, brown #241c14, peach #fbead9) -> Harbour navy/blue."""
    hsv = np.array(im.convert('HSV')).astype(np.int16)
    h, s = hsv[..., 0], hsv[..., 1]
    warm = (h >= 7) & (h <= 32) & (s >= 28)          # PIL hue is 0-255; 7-32 ~ 10-45 degrees
    hsv[..., 0] = np.where(warm, 150, h)               # ~212 degrees
    hsv[..., 1] = np.where(warm, (s * 0.85).astype(np.int16), s)
    return Image.fromarray(hsv.astype(np.uint8), mode='HSV').convert('RGB')


def page_image(page, terms, kept_log):
    pix = page.get_pixmap(matrix=fitz.Matrix(Z, Z))
    im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    sc = lambda r, pad=1.5: ((r[0] - pad) * Z, (r[1] - pad) * Z, (r[2] + pad) * Z, (r[3] + pad) * Z)
    for info in page.get_image_info():
        hide(im, sc(info['bbox'], 0), hard=True)
    # The audit PDFs use Type3 fonts, so "bold" is not recorded: it is measured as ink per word
    # (bold words are clearly darker than the page's body text).
    g = np.asarray(im.convert('L'), dtype=float)

    def ink(bb):
        x0, y0, x1, y1 = [int(v * Z) for v in bb]
        a = g[max(0, y0):y1, max(0, x0):x1]
        if a.size == 0:
            return 0, 255
        bg = np.percentile(a, 95)
        return float(((bg - a) / max(bg, 1)).clip(0).mean()), bg

    lines = []
    for b in page.get_text('dict')['blocks']:
        if b.get('type') != 0:
            continue
        for line in b['lines']:
            words = [sp for sp in line['spans'] if sp['text'].strip()]
            if words:
                lines.append([(sp, *ink(sp['bbox'])) for sp in words])
    body = [w[1] for ln in lines for w in ln if len(w[0]['text'].strip()) >= 3 and w[2] > 200 and not keep_size(w[0]['size'])]
    med = float(np.median(body)) if body else 1
    carry = False
    for ln in lines:
        small = [w[0]['size'] <= 9.5 for w in ln]          # body text; bigger = headings or price boxes
        bold = [s and w[1] > 1.28 * med and w[2] > 200 for s, w in zip(small, ln)]
        short = [len(w[0]['text'].strip()) < 3 for w in ln]
        i = 0
        # opening bold run: from the first word of a line (or carried on from the line above)
        if bold[0] or (carry and (short[0] or bold[0])):
            while i < len(ln) and (bold[i] or (short[i] and i + 1 < len(ln) and bold[i + 1])):
                i += 1
        if i < 3 and not carry:   # 1-2 bold words = a table cell or a name, not a finding
            i = 0
        carry = i == len(ln) and i > 0
        for j, (sp, _, bg) in enumerate(ln):
            t = sp['text'].strip()
            figure = bool(re.search(r'\d', t)) and not re.fullmatch(r'\d{1,2}\.', t)
            # bg < 120: white text on a dark table header
            if keep_size(sp['size']) or (small[j] and (j < i or bg < 120) and not figure):
                kept_log.append(sp['text'])
            else:
                hide(im, sc(sp['bbox']))
    for t in terms:
        for r in page.search_for(t):
            hide(im, sc(r, 3), hard=True)
    return recolour(im)


def build(slug, rel, terms, show_kept=False):
    d = fitz.open(os.path.join(CLIENTS, rel))
    pages, kept = [], []
    for p in d:
        pages.append(page_image(p, terms, kept))
    pdf = os.path.join(OUT, f'{slug}.pdf')
    pages[0].save(pdf, save_all=True, append_images=pages[1:], resolution=72 * Z,
                  title='Sample Audit & Marketing Plan — Digital Marketing Remote', author='Digital Marketing Remote')
    for n, im in enumerate(pages, 1):
        t = im.resize((520, int(im.height * 520 / im.width)), Image.LANCZOS)
        t.save(os.path.join(OUT, f'{slug}-{n}.webp'), quality=78)
    if show_kept:
        print(f'--- {slug}: readable text runs')
        print(' | '.join(k.strip() for k in kept))
    leaks = [t for t in terms if any(t.lower() in k.lower() for k in kept)]
    print(slug, len(pages), 'pages', os.path.getsize(pdf) // 1024, 'KB', 'identifier in readable text (blurred anyway):' if leaks else '', leaks or '')
    return len(pages)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for slug, rel, terms in AUDITS:
        build(slug, rel, terms, '--kept' in sys.argv)
