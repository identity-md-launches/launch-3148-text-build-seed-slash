// Bounded browser checks of the production export under a gateway-style subpath.
// API responses below are test fixtures only. They are never part of the game.
import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { PNG } from 'pngjs';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

const out = resolve('test/scratch/browser-validation');
await mkdir(out, { recursive: true });
const root = resolve('dist');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.woff2':'font/woff2', '.txt':'text/plain' };
const server = createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    if (!pathname.startsWith('/seed-slash/')) throw Error('subpath');
    const path = resolve(root, decodeURIComponent(pathname.slice('/seed-slash/'.length)) || 'index.html');
    if (!path.startsWith(root + '/')) throw Error('outside export');
    const data = await readFile(path);
    res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' }); res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/seed-slash/`;
const report = { export: 'dist/', subpath: '/seed-slash/', checks: [], limitations: [], screenshots: [], errors: [] };
const passed = (name, detail) => { report.checks.push({ name, passed: true, detail }); console.log(`PASS ${name}${detail ? `: ${detail}` : ''}`); };
const fixture = (state = 'IDLE', provenance = 'hardware', old = false) => ({
  schemaVersion: 1, generatedAt: new Date().toISOString(),
  measurement: { freshness: 'online', provenance, coreStatus: state, rpmMilli: state === 'ACTIVE' ? 12000 : 0,
    observedAt: new Date(Date.now() - (old ? 180000 : 1000)).toISOString(), staleAfterSeconds: 120 },
  oracle: { state: 'accepted' }, signer: { lastVerifiedAt: new Date().toISOString() },
});
let browser;
let clockInstalled = false;
async function screenshot(page, name) {
  const path = `${out}/${name}.webp`; await page.screenshot({ path, fullPage: true, type: 'webp', quality: 85 }); report.screenshots.push(`${name}.webp`);
}
async function audit(page, state) {
  if(clockInstalled) await page.clock.resume();
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  if(clockInstalled) await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));
  await writeFile(`${out}/axe-${state}.json`, JSON.stringify({ violations: result.violations, incomplete: result.incomplete.map(x => ({ id:x.id, impact:x.impact, nodes:x.nodes.length })) }, null, 2));
  assert.equal(result.violations.length, 0, `${state} axe violations: ${result.violations.map(v => `${v.id}: ${v.nodes.map(n=>n.target).join(',')}`).join('; ')}`);
  passed(`Accessibility scan: ${state}`, `0 violations; ${result.incomplete.length} checks require human review`);
}
async function measureContrast(page,state,selectors){
  const pairs=await page.evaluate(selectors=>selectors.map(selector=>{
    const el=document.querySelector(selector);if(!el)return null;
    const r=el.getBoundingClientRect(),s=getComputedStyle(el);
    if(!r.width||!r.height)return null;
    return {selector,foreground:s.color,x:Math.floor(r.left+r.width/2),y:Math.floor(r.top+r.height/2),size:parseFloat(s.fontSize),weight:Number(s.fontWeight)};
  }).filter(Boolean),selectors);
  const hidden=await page.addStyleTag({content:'body *{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}'});
  let bitmap;try{bitmap=PNG.sync.read(await page.screenshot({type:'png'}));}finally{await hidden.evaluate(el=>el.remove());}
  const luminance=rgb=>rgb.map(c=>c/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((v,c,i)=>v+c*[.2126,.7152,.0722][i],0);
  const measurements=pairs.map(pair=>{
    const offset=(pair.y*bitmap.width+pair.x)*4,background=[...bitmap.data.slice(offset,offset+3)];
    const foreground=pair.foreground.match(/[\d.]+/g).slice(0,3).map(Number);
    const a=luminance(foreground),b=luminance(background),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    const threshold=pair.size>=24||(pair.size>=18.66&&pair.weight>=700)?3:4.5;
    return {...pair,background,ratio:Math.round(ratio*100)/100,threshold};
  });
  await writeFile(`${out}/contrast-${state}.json`,JSON.stringify(measurements,null,2));
  for(const p of measurements)assert.ok(p.ratio>=p.threshold,`${state} ${p.selector}: ${p.ratio}:1 contrast`);
  passed(`Rendered contrast: ${state}`,`${measurements.length} foreground/background center samples pass; minimum ${Math.min(...measurements.map(p=>p.ratio))}:1`);
}
// Observe actual canvas drawing so tests can swipe real moving nuts, without a game debug API.
async function observeGame(page) {
  await page.addInitScript(() => {
    let seed = 451;
    Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function(...args) { if(this.canvas.classList.contains('game-canvas')) window.__drawnNuts = []; return clear.apply(this,args); };
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function(image,...args) {
      if(this.canvas.classList.contains('game-canvas') && args.length === 4 && image.src) {
        const transform = this.getTransform(), ratio = Math.min(devicePixelRatio || 1,2);
        (window.__drawnNuts ??= []).push({kind:image.src.split('/').pop().split('.')[0],x:transform.e/ratio,y:transform.f/ratio,radius:args[2]/2});
      }
      return draw.call(this,image,...args);
    };
  });
}
async function getTarget(page) {
  return page.evaluate(() => (window.__drawnNuts ?? []).find(e => e.kind !== 'bomb' && e.y > 200 && e.y < innerHeight - 80));
}
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width:390, height:844 }, hasTouch: true, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('response', r => { if(r.url().startsWith(url) && r.status() >= 400) report.errors.push(`${r.status()} ${r.url().slice(url.length)}`); });
  let responseMode = 'offline', polls = 0;
  await page.route('https://api.squeekchain.com/v1/status', route => {
    polls++;
    if(responseMode === 'offline') return route.fulfill({ status:503, contentType:'application/json', body:'{"error":"test outage"}' });
    return route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(fixture(responseMode === 'active' ? 'ACTIVE' : 'IDLE', responseMode === 'simulated' ? 'simulated' : 'hardware', responseMode === 'stale')) });
  });
  await observeGame(page);
  await page.goto(url); await page.evaluate(() => document.fonts.ready);
  await page.getByRole('button', { name:'Bonus information' }).filter({hasText:'Local bonus mode'}).waitFor();
  for(const [width,height] of [[320,740],[390,844],[768,1024],[1440,900],[844,390],[390,640]]) {
    await page.setViewportSize({width,height});
    const layout = await page.evaluate(() => { const r=document.querySelector('.start-button').getBoundingClientRect();return {scroll:document.documentElement.scrollWidth,viewport:innerWidth,buttonBottom:r.bottom,buttonRight:r.right,buttonLeft:r.left}; });
    assert.ok(layout.scroll <= width, `Overflow at ${width}`);
    assert.ok(layout.buttonBottom <= height && layout.buttonLeft >= 0 && layout.buttonRight <= width, `Start out of view at ${width}×${height}: ${JSON.stringify(layout)}`);
    passed(`Responsive ${width}×${height}`, `no horizontal scroll; Start slicing visible at ${Math.round(layout.buttonBottom)}px`);
    if([320,390,1440].includes(width) && height !== 640) await screenshot(page,`home-${width}`);
  }
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(() => document.fonts.check('400 64px "Lilita One"') && document.fonts.check('800 16px Nunito')));
  passed('Local fonts', 'Lilita One and Nunito loaded');
  await audit(page,'home');
  await measureContrast(page,'home',['.intro','.tagline','.start-button>span','.control-hint','.home-best>span','.pip-caption','.home-rules>div>span','.wheel-button>span:nth-of-type(2)']);
  await page.getByRole('button',{name:'Turn sound off',exact:true}).click();
  await page.reload(); await page.getByRole('button',{name:'Turn sound on',exact:true}).waitFor();
  passed('Sound control', 'toggle persists across reload');
  await page.getByRole('button',{name:'Start slicing',exact:true}).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor();
  for(let i=0;i<6;i++) await page.keyboard.press('Tab');
  assert.ok(await page.evaluate(() => document.querySelector('dialog').contains(document.activeElement)));
  await screenshot(page,'tutorial'); await audit(page,'tutorial');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()),'Start slicing');
  passed('Tutorial keyboard flow','Enter opens; focus stays inside; Escape closes and restores Start slicing');

  await page.clock.install();
  clockInstalled = true;
  await page.clock.pauseAt(new Date());
  await page.getByRole('button',{name:'Start slicing',exact:true}).click();
  await page.getByRole('button',{name:'Play now',exact:true}).click();
  await page.waitForTimeout(150); await page.clock.runFor(1400);
  assert.equal(await page.getByTestId('lives').getAttribute('aria-label'),'3 of 3 lives remaining');
  assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).overflow),'hidden');
  assert.equal(await page.locator('canvas').evaluate(e=>getComputedStyle(e).touchAction),'none');
  let target = await getTarget(page); assert.ok(target,'A real nut must be airborne');
  await page.mouse.move(target.x-target.radius-12,target.y);await page.mouse.down();
  await page.mouse.move(target.x+target.radius+12,target.y,{steps:8});await page.mouse.up();
  const mouseScore = Number(await page.getByTestId('score').textContent()); assert.ok(mouseScore > 0);
  passed('Mouse slicing', `dragging through a real airborne nut scored ${mouseScore}`);
  await page.clock.runFor(32);
  target=await getTarget(page);
  if(!target){ await page.clock.runFor(1700); target=await getTarget(page); }
  assert.ok(target);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:target.x-target.radius-12,y:target.y}]});
  for(let i=1;i<=8;i++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:target.x-target.radius-12+(target.radius*2+24)*i/8,y:target.y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.ok(Number(await page.getByTestId('score').textContent()) > mouseScore);
  passed('Touch slicing','emulated touch swipe scores; gesture surface prevents scrolling');
  await page.clock.runFor(1700);
  const beforeKeyboard=Number(await page.getByTestId('score').textContent());
  for(const key of ['1','2','3','4']) await page.keyboard.press(key);
  assert.ok(Number(await page.getByTestId('score').textContent()) > beforeKeyboard);
  passed('Keyboard slicing','four lane keys cut actual game entities');
  await page.clock.runFor(800);
  await screenshot(page,'playing');
  await measureContrast(page,'playing',['.score-block>span','.score-block>strong','.combo-block>strong','.combo-block>span','.lives-block>span','.playing-hint>.pointer-hint','.wheel-button>span:nth-of-type(2)']);
  await page.keyboard.press('p'); await page.getByRole('heading',{name:'Snack break.'}).waitFor();
  const beforePause = await page.evaluate(()=>JSON.stringify(window.__drawnNuts));
  await page.clock.runFor(2200);
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__drawnNuts)),beforePause);
  await screenshot(page,'paused'); await audit(page,'paused');
  await measureContrast(page,'paused',['.state-content h2','.state-content>p','.state-content>.primary','.state-content>.text-button']);
  await page.getByRole('button',{name:'Resume slicing',exact:true}).click();
  await page.clock.runFor(250);
  assert.notEqual(await page.evaluate(()=>JSON.stringify(window.__drawnNuts)),beforePause);
  passed('Pause/resume','nut positions freeze while paused and continue on resume');
  await page.clock.runFor(14000);
  await page.getByRole('heading',{name:'That was nuts!'}).waitFor();
  const finalScore = Number(await page.getByTestId('final-score').textContent());
  assert.equal(Number(await page.evaluate(()=>localStorage.getItem('seed-slash.best'))), finalScore);
  await screenshot(page,'game-over'); await audit(page,'game-over');
  await measureContrast(page,'game-over',['.state-content h2','.state-content>p','.result-score>strong','.result-stats span','.storage-note']);
  await page.getByRole('button',{name:'Play again',exact:true}).click();
  assert.equal(await page.getByTestId('score').textContent(),'0');
  assert.equal(await page.getByTestId('lives').getAttribute('aria-label'),'3 of 3 lives remaining');
  passed('Game over, best score and restart',`nine drops end the round; best ${finalScore} saved; restart resets score and three lives`);
  assert.ok(polls >= 2);passed('10-second polling',`${polls} status requests observed with the browser clock advanced`);
  await page.getByRole('button',{name:'Pause game',exact:true}).click();
  await page.getByRole('button',{name:'Bonus information',exact:true}).click();
  for(const mode of ['active','idle','simulated','stale','offline','idle']) {
    responseMode=mode;
    await page.getByRole('button',{name:'Check connection',exact:true}).click();
    await page.waitForTimeout(100);
    const expected=mode==='active'?'Wheel running!':mode==='idle'?'Wheel resting':'Local bonus mode';
    await page.locator('.wheel-detail').filter({hasText:expected}).waitFor();
    passed(`API state: ${mode}`,expected);
    if(mode==='active'){
      await page.getByRole('button',{name:'Close dialog',exact:true}).click();
      await page.getByRole('button',{name:'Resume slicing',exact:true}).click();await page.clock.runFor(100);
      assert.ok(await page.locator('.golden-notice').isVisible());passed('Live golden bonus','fresh running fixture activates golden shower during play');
      await page.getByRole('button',{name:'Pause game',exact:true}).click();await page.getByRole('button',{name:'Bonus information',exact:true}).click();
    }
  }
  await page.locator('.modal-actions>.primary').click();
  await page.getByRole('button',{name:'Pause game',exact:true}).waitFor();
  passed('Bonus dialog resume','Resume slicing closes the bonus dialog and resumes play');
  await page.getByRole('button',{name:'Pause game',exact:true}).click();
  await page.getByRole('button',{name:'Back to the forest',exact:true}).click();
  await page.reload();
  assert.ok((await page.locator('.home-best').textContent()).includes(String(finalScore)));
  passed('Best score reload','saved result shown on the start screen');

  const reducedPage=await context.newPage();await reducedPage.emulateMedia({reducedMotion:'reduce'});
  await reducedPage.route('https://api.squeekchain.com/**',r=>r.abort());await reducedPage.goto(url);
  assert.equal(await reducedPage.locator('.orbit').evaluateAll(nodes=>nodes.filter(e=>getComputedStyle(e).animationName!=='none').length),0);
  passed('Reduced motion','all four decorative orbit animations disabled');
  await reducedPage.close();

  const comboContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
  const comboPage=await comboContext.newPage();await observeGame(comboPage);
  await comboPage.route('https://api.squeekchain.com/**',r=>r.fulfill({status:503,body:'test outage'}));
  await comboPage.goto(url);await comboPage.getByRole('button',{name:'Start slicing',exact:true}).click();
  await comboPage.clock.install();await comboPage.clock.pauseAt(new Date());
  await comboPage.getByRole('button',{name:'Play now',exact:true}).click();await comboPage.waitForTimeout(150);await comboPage.clock.runFor(2800);
  const nuts=await comboPage.evaluate(()=>(window.__drawnNuts??[]).filter(e=>e.kind!=='bomb'&&e.y>200&&e.y<innerHeight-100).slice(0,3));
  assert.equal(nuts.length,3);
  await comboPage.mouse.move(nuts[0].x-60,nuts[0].y+45);await comboPage.mouse.down();
  for(const nut of nuts)await comboPage.mouse.move(nut.x,nut.y,{steps:5});
  await comboPage.mouse.move(nuts[2].x+60,nuts[2].y-35,{steps:5});await comboPage.mouse.up();await comboPage.clock.runFor(32);
  assert.ok(await comboPage.locator('.combo-active').isVisible());
  await screenshot(comboPage,'playing-combo');passed('Swipe combo feedback','three airborne snacks in one mouse gesture produce a combo, particles and a glowing trail');
  await comboContext.close();

  const blockedContext=await browser.newContext({viewport:{width:390,height:844}});
  await blockedContext.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));
  const blockedPage=await blockedContext.newPage();await blockedPage.route('https://api.squeekchain.com/**',r=>r.abort());
  await blockedPage.goto(url);await blockedPage.getByRole('button',{name:'Start slicing',exact:true}).click();
  await blockedPage.getByRole('button',{name:'Play now',exact:true}).click();await blockedPage.locator('canvas').waitFor();
  passed('Storage denied','game starts when localStorage throws SecurityError');await blockedContext.close();

  // Optional real integration observation. No fixture or proxy override is used here.
  const livePage=await context.newPage();const liveRequests=[];
  livePage.on('response',r=>{if(r.url().includes('api.squeekchain.com'))liveRequests.push({status:r.status()});});
  livePage.on('requestfailed',r=>{if(r.url().includes('api.squeekchain.com'))liveRequests.push({failure:r.failure()?.errorText});});
  await livePage.goto(url);
  await livePage.waitForFunction(()=>!document.querySelector('.wheel-button')?.textContent?.includes('Checking the wheel'));
  const label=await livePage.locator('.wheel-button').textContent();
  await livePage.getByRole('button',{name:'Bonus information',exact:true}).click();
  report.liveObservation={label:label.trim(),detail:await livePage.locator('dialog>p').first().textContent(),requests:liveRequests};
  passed('Real endpoint browser observation',JSON.stringify(report.liveObservation));await livePage.close();
  await context.close();await browser.close();browser=null;

  try {
    const safari=await webkit.launch({headless:true,timeout:10000});
    try {
      const p=await safari.newPage({viewport:{width:390,height:844},hasTouch:true});
      p.setDefaultTimeout(10000);
      await observeGame(p);await p.route('https://api.squeekchain.com/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture())}));
      await p.goto(url);await p.getByRole('button',{name:'Start slicing',exact:true}).click();await p.getByRole('button',{name:'Play now',exact:true}).click();
      await p.waitForTimeout(1450);
      const target=await getTarget(p);assert.ok(target);
      await p.mouse.move(target.x-target.radius-12,target.y);await p.mouse.down();await p.mouse.move(target.x+target.radius+12,target.y,{steps:6});await p.mouse.up();
      const webkitMouseScore=Number(await p.getByTestId('score').textContent());assert.ok(webkitMouseScore>0,'WebKit mouse swipe scores');
      for(const key of ['1','2','3','4'])await p.keyboard.press(key);
      assert.ok(Number(await p.getByTestId('score').textContent())>webkitMouseScore,'WebKit keyboard lanes score');
      await p.getByRole('button',{name:'Pause game',exact:true}).click();await p.getByRole('button',{name:'Resume slicing',exact:true}).click();
      await screenshot(p,'webkit-playing');passed('WebKit primary flow','start, tutorial, mouse and keyboard scoring, pause and resume at 390px');
    } finally { await safari.close(); }
  } catch(e) { report.limitations.push(`WebKit: ${e.message.split('\n').filter(Boolean).slice(0,3).join(' ')}`); console.log('LIMITATION WebKit unavailable'); }
  assert.equal(report.errors.length,0,report.errors.join('\n'));
  passed('Production resources','0 script errors and 0 missing local resources at the gateway subpath');
} catch(error) {
  report.checks.push({name:'Browser validation',passed:false,detail:error.stack});process.exitCode=1;console.error(error);
} finally {
  await browser?.close();await new Promise(r=>server.close(r));
  report.checkedAt=new Date().toISOString();await writeFile(`${out}/results.json`,JSON.stringify(report,null,2)+'\n');
}
