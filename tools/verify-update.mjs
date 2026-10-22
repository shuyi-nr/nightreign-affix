// Real-browser regression checks for pairing, sharing, mobile picking and stats.
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';

const live = process.argv.includes('--live');
const origin = live ? 'https://shuyi-nr.github.io/nightreign-affix/' : 'http://127.0.0.1:4176/';
const server = live ? null : createServer((req, res) => {
  try {
    const path = new URL(req.url, origin).pathname;
    const file = join(process.cwd(), 'dist', path === '/' ? 'index.html' : path);
    const type = file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.png') ? 'image/png' : file.endsWith('.webmanifest') ? 'application/manifest+json' : 'text/html';
    res.writeHead(200, { 'Content-Type': type }); res.end(readFileSync(file));
  } catch { res.writeHead(404); res.end(); }
});
if (server) await new Promise((resolve) => server.listen(4176, '127.0.0.1', resolve));
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions',
  '--remote-debugging-port=9237', `--user-data-dir=${join(tmpdir(), `nr-update-${Date.now()}`)}`, 'about:blank',
], { stdio: 'ignore', windowsHide: true });
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
const pending = new Map();
const errors = [];
let statisticRequests = 0;
let sequence = 0;
const assert = (v, name) => { if (!v) throw new Error(name); console.log('PASS ' + name); };
try {
  let target;
  for (let i = 0; i < 40; i++) {
    try { target = (await (await fetch('http://127.0.0.1:9237/json/list')).json()).find((p) => p.type === 'page'); } catch {}
    if (target) break;
    await pause(200);
  }
  if (!target) throw new Error('Chrome did not start');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  ws.addEventListener('message', ({ data }) => {
    const m = JSON.parse(data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(m.error) : p.resolve(m.result); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails);
    if (m.method === 'Network.requestWillBeSent' && m.params.request.url.startsWith('https://busuanzi.ibruce.info/busuanzi?')) statisticRequests++;
    if (m.method === 'Fetch.requestPaused') ws.send(JSON.stringify({ id: ++sequence, method: 'Fetch.failRequest', params: { requestId: m.params.requestId, errorReason: 'BlockedByClient' } }));
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'evaluation failed');
    return r.result.value;
  };
  const waitFor = async (expression, name) => {
    for (let i = 0; i < 80; i++) { if (await evaluate(expression)) return; await pause(200); }
    throw new Error('Timed out: ' + name);
  };
  const go = async (hash) => {
    await send('Page.navigate', { url: origin + hash });
    await waitFor('!!document.querySelector(".verdict-status")', 'React mount');
    await pause(200);
  };
  const click = (text) => evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(text)})?.click()`);
  const fill = (selector, value) => evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false });
  if (live) {
    await go('#/check');
    await waitFor('document.querySelector(".visit-counter strong")?.textContent.match(/^[\\d,]+$/)', 'real public counter');
    assert(await evaluate('document.querySelector(".visit-counter strong").textContent'), 'live counter has a real numeric value');
    assert(await evaluate('!!document.querySelector(".feedback-panel")'), 'live feedback entry');
    console.log('PUBLIC COUNT', await evaluate('document.querySelector(".visit-counter").innerText'));
    await evaluate('document.querySelectorAll(".nav button")[1].click()');
    await pause(200);
    await evaluate('document.querySelectorAll(".nav button")[0].click()');
    await pause(200);
    assert(statisticRequests === 1, 'navigation and StrictMode count only once');
    await send('Fetch.enable', { patterns: [{ urlPattern: '*busuanzi.ibruce.info/*', requestStage: 'Request' }] });
    await send('Page.reload');
    await waitFor('document.querySelector(".visit-counter strong")?.textContent === "暂不可用"', 'counter failure fallback');
    assert(await evaluate('!!document.querySelector(".mode-grid")'), 'blocked statistics do not break the checker');
  } else {
    await go('#/check?mode=CURRENT_NORMAL&ids=6630000,6630100,7000000');
    assert(await evaluate('!!document.querySelector(".maochi") && !document.querySelector(".maochi-launcher")'), 'desktop keeps the original four-character sticker');
    assert(await evaluate('document.querySelectorAll(".slot-invalid").length >= 2'), 'conflicting slots highlighted');
    assert(await evaluate('document.querySelector(".visit-counter").textContent.includes("本地预览不计数")'), 'preview excluded from count');
    const affixes = JSON.parse(readFileSync('src/data/affixes.json', 'utf8')).affixes;
    const pool = affixes.filter((a) => !a.isCurse && a.poolIds.some((p) => [2000000, 2100000, 2200000].includes(p)));
    const a = pool.find((a) => a.requiresCurse);
    const b = pool.find((b) => !b.requiresCurse && b.compatibilityId !== a.compatibilityId);
    const c = pool.find((c) => !c.requiresCurse && c.effectId !== b.effectId && ![a.compatibilityId, b.compatibilityId].includes(c.compatibilityId));
    const n = affixes.find((n) => n.isCurse && ![a.compatibilityId, b.compatibilityId, c.compatibilityId].includes(n.compatibilityId));
    const rows = [{ a, n: n.effectId }, { a: b, n: null }, { a: c, n: null }].sort((x, y) => y.a.sortId - x.a.sortId || y.a.effectId - x.a.effectId);
    const relic = JSON.parse(readFileSync('src/data/deep-relics.json', 'utf8')).relics[0].id;
    await go(`#/check?mode=DEEP_POSITIVE&full=1&relic=${relic}&ids=${rows.map((r) => r.a.effectId)}&curses=${rows.map((r) => r.n ?? '')}`);
    assert(await evaluate('document.querySelector(".verdict-status").textContent === "顺序错误"'), 'deep paired URL restores and detects wrong order');
    await click('一键调整顺序（保留配对）');
    await waitFor('document.querySelector(".verdict-status").textContent === "合法"', 'paired sort verdict');
    assert(await evaluate('document.querySelectorAll(".paired-row").length === 3 && document.querySelectorAll(".slot").length === 6'), 'three positive/negative rows rendered');
    await fill('.build-name input', '浏览器配对测试');
    await click('收藏此组合');
    assert(await evaluate('JSON.parse(localStorage.getItem("nightreign-affix.favorites.v1"))[0].deepFull === true'), 'favorite preserves complete pairing state');
    await send('Page.reload');
    await waitFor('document.querySelector(".verdict-status")?.textContent === "合法"', 'refresh restores pair');
    assert(true, 'refresh reproduces legal result');
    await evaluate('document.querySelectorAll(".nav button")[1].click()');
    await pause(200);
    await evaluate('document.querySelectorAll(".nav button")[0].click()');
    await waitFor('document.querySelector(".verdict-status")?.textContent === "合法"', 'navigation preserves pair');
    assert(true, 'tab switching preserves deep state');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await pause(300);
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'mobile has no horizontal overflow');
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    const tap = async (selector) => {
      const point = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    assert(await evaluate('document.querySelector(".maochi-launcher")?.getBoundingClientRect().height >= 44'), 'mobile cheese launcher visible with touch target');
    await tap('.maochi-launcher');
    await waitFor('!!document.querySelector(".maochi-mobile.is-playing .maochi-panel")', 'touch plays real audio');
    assert(await evaluate('document.querySelectorAll(".maochi-tiles .mc").length === 4'), 'touch opens four-character sound menu');
    for (const width of [320, 768]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
      await pause(100);
      assert(await evaluate('(()=>{const r=document.querySelector(".maochi-panel").getBoundingClientRect();return r.left>=0 && r.right<=innerWidth && r.top>=0})()'), `sound menu stays inside ${width}px viewport`);
    }
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await pause(100);
    await tap('.maochi-tiles');
    await waitFor('!!document.querySelector(".maochi-mobile.is-playing")', 'tap replays audio');
    mkdirSync('tools/shots', { recursive: true });
    const menuShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync('tools/shots/cheese-mobile.png', Buffer.from(menuShot.data, 'base64'));
    await tap('.maochi-close');
    await waitFor('!document.querySelector(".maochi-panel")', 'close cheese menu');
    assert(await evaluate('!document.querySelector(".maochi-mobile.is-playing")'), 'close stops sound');
    await evaluate('document.querySelector(".slot-box").click()');
    await waitFor('!!document.querySelector(".picker-pop")', 'mobile picker');
    const bounds = await evaluate('(()=>{const r=document.querySelector(".picker-pop").getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height,list:document.querySelector(".picker-list")?.clientHeight}})()');
    assert(bounds.x === 0 && bounds.y === 0 && bounds.w === 390 && bounds.list > 50, 'mobile picker fills viewport and list scrolls');
    assert(await evaluate('getComputedStyle(document.querySelector(".maochi-mobile")).visibility === "hidden"'), 'cheese menu stays out of full-screen picker');
    await fill('.picker-search input', '生命');
    await pause(100);
    await click('清空');
    assert(await evaluate('document.querySelector(".picker-search input").value === ""'), 'clear search works');
    await evaluate('document.querySelector(".picker-close").click()');
    await evaluate('document.querySelector(".feedback-panel").open = true; window.open = (url) => {window.feedbackUrl = url};');
    await click('提交问题反馈');
    assert(await evaluate('new URL(window.feedbackUrl).searchParams.get("body").includes("curses")'), 'feedback includes paired reproduction link');
    mkdirSync('tools/shots', { recursive: true });
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync('tools/shots/update-mobile.png', Buffer.from(shot.data, 'base64'));
    // Verify the app still loads from the service-worker cache offline.
    await evaluate('navigator.serviceWorker.ready.then(()=>true)');
    await pause(700);
    await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
    await send('Page.reload');
    await waitFor('document.querySelector(".verdict-status")?.textContent === "合法"', 'offline paired check');
    assert(true, 'offline reload preserves working validation');
    await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  }
  assert(errors.length === 0, 'no JavaScript runtime exceptions');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  ws?.close();
  chrome.kill();
  server?.close();
}
