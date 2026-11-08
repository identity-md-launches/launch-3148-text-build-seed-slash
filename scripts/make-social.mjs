// Generate the share card from the game's original art and locally bundled fonts.
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
const body = async name => (await readFile(new URL(`../public/art/${name}.svg`, import.meta.url), 'utf8')).replace(/^<svg[^>]+>/, '').replace(/<\/svg>$/, '');
const font = (await readFile(new URL('../public/fonts/lilita-latin.woff2', import.meta.url))).toString('base64');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<style>@font-face{font-family:Lilita;src:url(data:font/woff2;base64,${font})}*{box-sizing:border-box}body{margin:0;background:#102e29;color:#fff1ce;font-family:Lilita}svg.bg{position:absolute;inset:0;width:1200px;height:750px;z-index:-1}.pip{position:absolute;left:625px;top:65px;width:500px;height:480px}.title{position:absolute;left:124px;top:95px;transform:rotate(-4deg);font-size:112px;line-height:.92;text-shadow:0 6px #7e552f,0 10px #142f26}.title span{display:block;color:#f8c85a}.line{position:absolute;left:124px;top:340px;font-size:28px}.button{position:absolute;left:124px;top:410px;background:#f8c85a;color:#423018;padding:18px 32px;border-radius:18px;font-size:28px;box-shadow:0 5px #957038}.foot{position:absolute;left:128px;bottom:60px;font-size:20px;color:#c6d0b7}</style><svg class="bg" viewBox="0 0 1600 1000">${await body('forest')}</svg><div class="title">Seed<span>Slash.</span></div><div class="line">A little forest frenzy.</div><div class="button">Play in your browser →</div><div class="foot">Swipe the snacks. Chase the combos.</div><svg class="pip" viewBox="0 0 500 480">${await body('pip')}</svg>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: new URL('../public/art/social.png', import.meta.url).pathname });
  console.log('Generated 1200 × 630 share card from original game artwork.');
} finally { await browser.close(); }
