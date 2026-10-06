#!/usr/bin/env python3
"""Swap the old Ember (terracotta/brown) and old red colours for the Harbour palette.
Run on any page that still shows them:  python3 tools/legacy-colours.py file.html ..."""
import re, sys
HEX = {'#241c14': '#1d2e45', '#1e1812': '#17263a', '#2b1f14': '#17263a', '#3a2c1e': '#22344d', '#1f160e': '#111b2a',
       '#2e2116': '#1b2a3f', '#c9702f': '#355f8c', '#d97f3e': '#4a76a6', '#d97b3a': '#4a76a6', '#9c4a1a': '#2a4d75',
       '#7a3410': '#213f62', '#fbead9': '#e7eef7', '#f0ac78': '#a9c5e4', '#faf8f4': '#f2f5f9', '#faf7f2': '#f5f8fc',
       '#fdf1e6': '#e9f0f8', '#e8e3d8': '#dbe2eb', '#374151': '#3d4858', '#6b7280': '#5c6777', '#1a1a2e': '#1d2e45',
       '#c8102e': '#355f8c', '#9e0b22': '#2a4d75', '#fbe7ea': '#e7eef7', '#f8f9fa': '#f2f5f9', '#e5e7eb': '#dbe2eb',
       '#ff6b81': '#a9c5e4', '#15803d': '#2c6476', '#16a34a': '#2c6476'}
RGB = {'201,112,47': '53,95,140', '251,234,217': '231,238,247', '30,24,18': '29,46,69', '20,16,12': '17,27,42',
       '36,28,20': '29,46,69', '200,16,46': '53,95,140'}
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    t = re.sub(r'#[0-9a-fA-F]{6}\b', lambda m: HEX.get(m.group(0).lower(), m.group(0)), s)
    t = re.sub(r'rgba\((\d+,\d+,\d+),', lambda m: 'rgba(' + RGB.get(m.group(1), m.group(1)) + ',', t)
    t = t.replace('rgba(250,248,244,.85)', 'rgba(255,255,255,.88)')
    if t != s:
        open(p, 'w', encoding='utf-8').write(t)
        print('updated', p)
