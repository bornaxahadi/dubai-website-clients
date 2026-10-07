# Client demo site tools

Run from a checkout of this repo (Node + Playwright, Python 3).

1. `python3 tools/siteopt.py <slug>`: localises and compresses images (WebP), self-hosts subset fonts, shows the hero at once, minifies CSS. Safe to re-run. Layout stays the same.
2. `node tools/audit.js http://localhost:8799/<slug>/`: throttled iPhone first load. Gives LCP, KB, broken images, JS errors.
3. `node tools/fullcheck.js <url>`: full scroll. Checks broken images, horizontal overflow and errors.
4. `node tools/compare.js <before-url> <after-url>`: mobile and desktop pixel diff. Each view should say OK.

Targets: LCP under 1 s (throttled), 0 broken images, 0 errors, compare OK.
