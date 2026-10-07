// Make homepage thumbnails: run "python3 -m http.server 8765" in the repo root, then "node tools/thumb.js <folder> [<folder>...]". Saves thumbs/<folder>.jpg
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  for (const slug of process.argv.slice(2)) {
    await p.goto(`http://localhost:8765/${slug}/`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(3500);
    await p.screenshot({ path: `thumbs/${slug}.jpg`, type: 'jpeg', quality: 75 });
  }
  await b.close();
})();
