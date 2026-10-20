// Headless-Chrome smoke test for the built site (PWA + interactions).
// Online run:  node tools/drive.mjs
// Offline run: node tools/drive.mjs --offline  (expects the preview server to be DOWN)
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DEBUG_PORT = 9222;
const APP = 'http://localhost:4173/';
const SHOTS = join(ROOT, 'tools', 'shots');
const PROFILE = join(os.tmpdir(), 'nr-chrome-profile');
const OFFLINE = process.argv.includes('--offline');

mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const checks = [];
function check(name, ok, extra = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '   (' + extra + ')' : ''}`);
}

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.handlers = new Map();
    this.exceptions = [];
    this.consoleErrors = [];
    this.ready = new Promise((res, rej) => {
      this.ws.addEventListener('open', res);
      this.ws.addEventListener('error', () => rej(new Error('ws error')));
    });
    this.ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id) {
        const p = this.pending.get(m.id);
        if (p) {
          this.pending.delete(m.id);
          m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
        }
      } else if (m.method) {
        if (m.method === 'Runtime.exceptionThrown') this.exceptions.push(m.params.exceptionDetails);
        if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') this.consoleErrors.push(m.params);
        const hs = this.handlers.get(m.method);
        if (hs) hs.forEach((f) => f(m.params));
      }
    });
  }
  async send(method, params = {}) {
    await this.ready;
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(fn);
  }
}

async function evaluate(cdp, expr) {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) {
    throw new Error('evaluate threw: ' + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)));
  }
  return r.result.value;
}

async function waitFor(cdp, expr, desc, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evaluate(cdp, expr)) return true;
    await sleep(200);
  }
  throw new Error('timeout waiting for: ' + desc);
}

async function shot(cdp, name) {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(SHOTS, name), Buffer.from(data, 'base64'));
  console.log('  [shot]', name);
}

async function fill(cdp, selector, value) {
  return evaluate(
    cdp,
    `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)});
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`,
  );
}

function chromeArgs() {
  return [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--no-default-browser-check',
    '--disable-dev-shm-usage', '--disable-background-networking', '--disable-extensions',
    `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${PROFILE}`, '--window-size=1280,900', 'about:blank',
  ];
}

async function launch() {
  const chrome = spawn(CHROME, chromeArgs(), { stdio: 'ignore' });
  let wsUrl;
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch {}
    await sleep(200);
  }
  if (!wsUrl) throw new Error('no page target from chrome');
  return { chrome, cdp: new CDP(wsUrl) };
}

async function main() {
  const { chrome, cdp } = await launch();
  try {
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');
    const netLog = [];
    cdp.on('Network.loadingFailed', (p) => netLog.push({ ev: 'loadingFailed', err: p.errorText, blocked: p.blockedReason, type: p.type, cors: p.corsErrorStatus }));
    cdp.on('Network.responseReceived', (p) => netLog.push({ ev: 'response', url: p.response.url, status: p.response.status, mime: p.response.mimeType, fromSW: p.response.fromServiceWorker }));
    cdp.on('Log.entryAdded', (p) => netLog.push({ ev: 'log', level: p.entry.level, text: p.entry.text }));
    await cdp.send('Log.enable');

    if (OFFLINE) {
      await cdp.send('Page.navigate', { url: APP + '#/check' });
      try {
        await waitFor(cdp, `document.querySelector('.mode-card') !== null`, 'offline render', 12000);
        check('离线访问（SW 从缓存渲染整站）', true);
      } catch {
        check('离线访问（SW 从缓存渲染整站）', false);
        const diag = await evaluate(
          cdp,
          `(async()=>{
            const keys=await caches.keys();
            const cache={};
            for(const k of keys){const c=await caches.open(k);cache[k]=(await c.keys()).map(r=>r.url.replace(location.origin,''));}
            const jsMatch = await caches.match('./assets/index-DrkdeFP0.js');
            const jsFetch = await fetch('./assets/index-DrkdeFP0.js').then(r=>({status:r.status,type:r.type,ok:r.ok,ct:r.headers.get('content-type'),acao:r.headers.get('access-control-allow-origin')})).catch(e=>({err:String(e)}));
            const jsText = jsMatch ? (await jsMatch.clone().text()).slice(0,40) : null;
            const dynImport = await import('./assets/index-DrkdeFP0.js').then(()=>'ok').catch(e=>'ERR:'+e.message);
            const matchProbe = {};
            for (const [label, init] of [
              ['string', null],
              ['default', {}],
              ['cors', {mode:'cors'}],
              ['cors+script', {mode:'cors',destination:'script'}],
              ['cors+script+creds', {mode:'cors',destination:'script',credentials:'same-origin'}],
              ['no-cors', {mode:'no-cors'}],
            ]) {
              const r = init ? new Request('./assets/index-DrkdeFP0.js', init) : './assets/index-DrkdeFP0.js';
              const m = await caches.match(r).catch(()=>null);
              matchProbe[label] = m ? {type:m.type,status:m.status} : null;
            }
            return {
              href: location.href,
              title: document.title,
              body: (document.body?document.body.innerText:'NO BODY').slice(0,300),
              hasModeCard: !!document.querySelector('.mode-card'),
              controller: !!navigator.serviceWorker.controller,
              jsMatch: jsMatch ? {ok:jsMatch.ok,status:jsMatch.status,type:jsMatch.type,ct:jsMatch.headers.get('content-type')} : null,
              jsText,
              jsFetch,
              dynImport,
              matchProbe,
              cachedHtml: (await (await caches.match('./')).text()).includes('crossorigin') ? 'HAS-crossorigin' : 'no-crossorigin',
              cachedJsHeaders: [...(await caches.match('./assets/index-DrkdeFP0.js')).headers].map(h=>h[0]+':'+h[1]),
              cachedJsReqMode: await (async()=>{const ks=await caches.keys();const c=await caches.open(ks[0]);const rs=await c.keys();return rs.filter(r=>r.url.includes('.js')).map(r=>({mode:r.mode,dest:r.destination,cred:r.credentials}));})(),
              blobImport: await (async()=>{try{const t=await (await caches.match('./assets/index-DrkdeFP0.js')).text();const b=new Blob([t],{type:'text/javascript'});const u=URL.createObjectURL(b);const r=await import(u).then(()=>'ok').catch(e=>'ERR:'+e.message);URL.revokeObjectURL(u);return r;}catch(e){return 'ERR2:'+e.message}})(),
              scripts: [...document.scripts].map(s=>s.src),
              cache,
            };
          })()`,
        ).catch((e) => ({ err: String(e) }));
        console.log('  [offline 诊断]:', JSON.stringify(diag, null, 2));
        console.log('  [offline 异常]:', JSON.stringify(cdp.exceptions.map((e) => e.exception?.description || e.text).slice(0, 5)));
        console.log('  [offline console.error]:', JSON.stringify(cdp.consoleErrors.slice(0, 5)));
        console.log('  [offline 网络日志]:', JSON.stringify(netLog.filter((e) => e.ev !== 'response' || /assets|manifest/.test(e.url || '')), null, 2));
        await shot(cdp, '06-offline.png');
      }
      const sw = await evaluate(
        cdp,
        `(async()=>{const r=await navigator.serviceWorker.getRegistration();return r?{scope:r.scope,active:!!r.active,controller:!!navigator.serviceWorker.controller}:null})()`,
      );
      console.log('  SW 离线状态:', JSON.stringify(sw));
      return;
    }

    // ---- 在线流程 ----
    await cdp.send('Page.navigate', { url: APP + '#/check' });
    await waitFor(cdp, `document.querySelector('.boot-splash') === null && document.querySelector('.mode-card') !== null`, 'checker mount');
    check('首页渲染（加载占位已被 React 替换）', true);

    const h1 = await evaluate(cdp, `document.querySelector('.brand-text h1')?.innerText`);
    check('标题正确', !!h1 && h1.includes('黑夜君临'), h1);
    check('导航三项', (await evaluate(cdp, `document.querySelectorAll('.nav button').length`)) === 3);
    check('四种检测口径', (await evaluate(cdp, `document.querySelectorAll('.mode-card').length`)) === 4);
    check('三个槽位', (await evaluate(cdp, `document.querySelectorAll('.slot').length`)) === 3);
    const v0 = await evaluate(cdp, `document.querySelector('.verdict-status')?.innerText`);
    check('初始判定为“待补全”', v0 === '待补全', v0);
    await shot(cdp, '01-checker.png');

    // 打开选择器
    await evaluate(cdp, `document.querySelector('.slot .slot-box').click()`);
    await waitFor(cdp, `document.querySelector('.picker-pop') !== null`, 'picker open');
    check('点击槽位打开选择器', true);
    await shot(cdp, '02-picker.png');

    // 命中空状态
    await fill(cdp, '.picker-search input', 'zzzzzzzzzz');
    await waitFor(cdp, `document.querySelector('.empty-state') !== null`, 'picker empty state');
    const emptyTitle = await evaluate(cdp, `document.querySelector('.empty-state-title')?.innerText`);
    check('选择器空状态展示', emptyTitle === '无匹配词条', emptyTitle);
    await shot(cdp, '03-picker-empty.png');

    // 清空搜索并选中第一个词条
    await fill(cdp, '.picker-search input', '');
    await waitFor(cdp, `document.querySelector('.picker-item') !== null`, 'picker items restored');
    const firstId = await evaluate(cdp, `document.querySelector('.picker-item')?.innerText`);
    await evaluate(cdp, `document.querySelector('.picker-item').click()`);
    await waitFor(cdp, `document.querySelector('.slot .slot-box.filled') !== null`, 'slot filled');
    check('选中词条回填槽位', true, (firstId || '').slice(0, 40).replace(/\n/g, ' '));
    const sub = await evaluate(cdp, `document.querySelector('.verdict-sub')?.innerText`);
    check('选中 1 个后显示进度 1/3', !!sub && sub.includes('1 / 3'), sub);
    await shot(cdp, '04-filled.png');

    // 词条查询页
    await evaluate(cdp, `document.querySelectorAll('.nav button')[1].click()`);
    await waitFor(cdp, `document.querySelector('.catalog-count') !== null`, 'catalog mount');
    const cat = await evaluate(cdp, `document.querySelector('.catalog-count')?.innerText`);
    check('词条查询页渲染', !!cat, cat);
    await shot(cdp, '05-catalog.png');

    // 规则说明页
    await evaluate(cdp, `document.querySelectorAll('.nav button')[2].click()`);
    await waitFor(cdp, `document.querySelector('.rule-section') !== null`, 'rules mount');
    check('规则说明页渲染（4 节）', (await evaluate(cdp, `document.querySelectorAll('.rule-section').length`)) === 4);

    // ---- PWA ----
    const manifestHref = await evaluate(cdp, `document.querySelector('link[rel="manifest"]')?.getAttribute('href')`);
    check('manifest 链接存在', !!manifestHref, manifestHref);
    const sw = await evaluate(
      cdp,
      `(async()=>{try{await navigator.serviceWorker.ready;const r=await navigator.serviceWorker.getRegistration();return {registered:!!r,scope:r&&r.scope,active:!!(r&&r.active)};}catch(e){return {error:String(e)}}})()`,
    );
    check('Service Worker 注册并激活', !!(sw && sw.registered && sw.active), JSON.stringify(sw));

    const manifestStatus = await evaluate(cdp, `fetch('./manifest.webmanifest').then(r=>r.status).catch(()=>-1)`);
    check('manifest.webmanifest 可访问(200)', manifestStatus === 200, String(manifestStatus));
    const iconStatus = await evaluate(cdp, `fetch('./icons/icon-192.png').then(r=>r.status).catch(()=>-1)`);
    check('icon-192.png 可访问(200)', iconStatus === 200, String(iconStatus));
    const ogStatus = await evaluate(cdp, `fetch('./og-image.png').then(r=>r.status).catch(()=>-1)`);
    check('og-image.png 可访问(200)', ogStatus === 200, String(ogStatus));

    // 预缓存内容
    const cacheInfo = await evaluate(
      cdp,
      `(async()=>{const keys=await caches.keys();const out={};for(const k of keys){const c=await caches.open(k);const rs=await c.keys();out[k]=rs.map(r=>r.url.replace(location.origin,''));}return out;})()`,
    );
    const flat = JSON.stringify(cacheInfo);
    const hasShell = flat.includes('/') || flat.includes('index');
    const hasJs = /index-.*\.js/.test(flat);
    const hasCss = /index-.*\.css/.test(flat);
    check('SW 预缓存了应用壳/JS/CSS', hasJs && hasCss, `js=${hasJs} css=${hasCss}`);
    console.log('  SW 缓存清单:', JSON.stringify(cacheInfo, null, 2));

    await sleep(500);
    const errs = [...cdp.exceptions, ...cdp.consoleErrors];
    check('无控制台报错', errs.length === 0, errs.length ? JSON.stringify(errs.slice(0, 3)) : '');
  } finally {
    try {
      await cdp.send('Browser.close');
    } catch {}
    await sleep(600);
    if (chrome.exitCode == null) chrome.kill();
  }

  const failed = checks.filter((c) => !c.ok);
  console.log(`\n===== 在线测试 ${checks.length - failed.length}/${checks.length} 通过 =====`);
  if (failed.length) console.log('失败项:', failed.map((f) => f.name).join('；'));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error('DRIVER ERROR:', e);
  process.exit(2);
});
