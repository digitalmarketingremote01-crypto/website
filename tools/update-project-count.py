#!/usr/bin/env python3
"""Set the founder's project count everywhere on the site.

    python3 tools/update-project-count.py          # show the current count and what it should be
    python3 tools/update-project-count.py 78       # change every page to 78

The count = 72 (track record up to mid-2026, incl. the 57 Craft AEC projects)
          + every client folder in "DMR Clients" that holds an Audit & Marketing Plan
          + 1 (DMR's own marketing). Rule set by Danyal 2026-10-06: every audit counts.
Only the "N projects / N Projekte / N Projekten" phrases and the partner-page stat change;
other numbers (CPCs, hours, CSS) are never touched.
"""
import glob, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIENTS = os.path.join(os.path.dirname(ROOT), 'DMR Clients')
BASE, OWN = 72, 1


def expected():
    audits = [d for d in sorted(os.listdir(CLIENTS)) if os.path.isdir(os.path.join(CLIENTS, d))
              and any('Audit' in f and f.endswith('.pdf') for f in os.listdir(os.path.join(CLIENTS, d)))]
    return BASE + len(audits) + OWN, audits


def pages():
    for f in glob.glob(os.path.join(ROOT, '**', '*.html'), recursive=True):
        rel = os.path.relpath(f, ROOT)
        if not rel.startswith(('client-documents', 'node_modules')):
            yield f


def current():
    s = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    return int(re.search(r'\b(\d+) projects\b', s).group(1))


def main():
    cur = current()
    want, audits = expected()
    if len(sys.argv) < 2:
        print(f'site says {cur}; folders say {want} = {BASE} + {len(audits)} audits + {OWN} own')
        for a in audits:
            print('  -', a)
        return
    new = int(sys.argv[1])
    pat = re.compile(rf'\b{cur}(\s|&nbsp;)(projects|project|Projekte|Projekten)\b')
    stat = re.compile(rf'<b>{cur}</b>(<small>(?:Gründer-Projekte|founder-led))')
    changed = 0
    for f in pages():
        s = open(f, encoding='utf-8').read()
        t = stat.sub(rf'<b>{new}</b>\1', pat.sub(rf'{new}\1\2', s))
        if t != s:
            open(f, 'w', encoding='utf-8').write(t)
            changed += 1
    print(f'{cur} -> {new} on {changed} pages')


if __name__ == '__main__':
    main()
