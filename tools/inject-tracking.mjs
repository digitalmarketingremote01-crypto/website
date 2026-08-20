/* =============================================================================
   DMR | tracking injector | runs on every Vercel build (see vercel.json)
   -----------------------------------------------------------------------------
   Walks every .html file in the repo and inserts
     <script src="/assets/tracking.js" defer></script>
   right after <head> if the page does not already load it. This is the
   guarantee that NO page can ever ship untracked again — even if a publish
   commit forgets the line (which is exactly what happened on 2026-08-13,
   when a publish commit silently stripped it from 60 pages).

   Also runnable locally:  node tools/inject-tracking.mjs
   Check-only (CI/verify): node tools/inject-tracking.mjs --check
     exits 1 and lists offenders instead of fixing them.
   ========================================================================== */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TAG = '<script src="/assets/tracking.js" defer></script>';
const SKIP_DIRS = new Set(['node_modules', '.git', '.vercel', 'tools']);

function htmlFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) htmlFiles(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

const checkOnly = process.argv.includes('--check');
const missing = [];

for (const file of htmlFiles(ROOT)) {
  const src = readFileSync(file, 'utf8');
  if (src.includes('assets/tracking.js')) continue;
  missing.push(file.slice(ROOT.length));
  if (checkOnly) continue;

  const m = src.match(/<head[^>]*>/i);
  if (!m) {
    console.error(`FAIL no <head> in ${file}`);
    process.exitCode = 1;
    continue;
  }
  const injected = src.replace(m[0], `${m[0]}\n${TAG}`);
  writeFileSync(file, injected, 'utf8');
}

if (checkOnly) {
  if (missing.length) {
    console.error(`FAIL ${missing.length} page(s) without tracking.js:`);
    for (const f of missing) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log('OK all pages load /assets/tracking.js');
} else {
  console.log(missing.length
    ? `Injected tracking.js into ${missing.length} page(s):\n  ${missing.join('\n  ')}`
    : 'OK all pages already load /assets/tracking.js');
}
