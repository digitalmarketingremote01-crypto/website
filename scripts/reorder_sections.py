#!/usr/bin/env python3
"""Reorder homepage sections to the new hierarchy. Content-preserving:
splits the file by section comment markers and reassembles in the new order.
A length assertion guarantees bytes are only rearranged, never changed."""

MARKERS = ['<!-- Pilot -->', '<!-- About -->', '<!-- Services -->', '<!-- Process -->',
           '<!-- Cases -->', '<!-- Pricing -->', '<!-- FAQ -->', '<!-- Contact -->',
           '<!-- CTA -->', '<!-- Reviews -->']
END = '</main>'
# hero > pilot > success(cases) > reviews > how-we-work(process) > services > about > pricing > faq > contact > cta
NEW_ORDER = ['<!-- Pilot -->', '<!-- Cases -->', '<!-- Reviews -->', '<!-- Process -->',
             '<!-- Services -->', '<!-- About -->', '<!-- Pricing -->', '<!-- FAQ -->',
             '<!-- Contact -->', '<!-- CTA -->']


def reorder(path):
    with open(path, 'r', encoding='utf-8') as f:
        s = f.read()
    idx = {}
    for m in MARKERS:
        assert s.count(m) == 1, f"{path}: marker {m} not unique (count={s.count(m)})"
        idx[m] = s.index(m)
    positions = [idx[m] for m in MARKERS]
    assert positions == sorted(positions), f"{path}: markers out of expected order"
    end = s.index(END, idx['<!-- Reviews -->'])
    head = s[:idx['<!-- Pilot -->']]
    tail = s[end:]
    seg = {}
    for i, m in enumerate(MARKERS):
        stop = idx[MARKERS[i + 1]] if i + 1 < len(MARKERS) else end
        seg[m] = s[idx[m]:stop]
    region = ''.join(seg[m] for m in NEW_ORDER)
    out = head + region + tail
    assert len(out) == len(s), f"{path}: length changed {len(s)} -> {len(out)} (ABORT)"
    with open(path, 'w', encoding='utf-8') as f:
        f.write(out)
    print(f"OK  {path}  ({len(s)} bytes, reordered)")


for p in ['index.html', 'en/index.html']:
    reorder(p)
