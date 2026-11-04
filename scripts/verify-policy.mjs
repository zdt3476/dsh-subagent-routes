import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
// 与 verify-popover.mjs 同一套约定：从工作目录解析 vite，playwright 走 PLAYWRIGHT_MODULE 或全局安装。
const require = createRequire(resolve('package.json'))
const { createServer } = await import(pathToFileURL(require.resolve('vite', { paths: [require.resolve('vitest/package.json')] })).href)
const playwrightModule = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE)).href
  : 'playwright')
const { chromium } = playwrightModule.default ?? playwrightModule
const out = resolve('artifacts/settings')
await mkdir(out, { recursive: true })
const server = await createServer({ root: process.cwd(), configFile: false, server: { middlewareMode: true } })
const html = '<!doctype html><html><head><meta charset="UTF-8"></head><body><div id="mount"></div><script type="module" src="/tests/client/browser-fixture.ts"></script></body></html>'
const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1000, height: 1400 } })
let policy = 'rules'
const makeSnap = () => ({
  config: { routesFile: '', enabled: true, preflight: true, fallbackPolicy: policy },
  configRevision: 'c1', canEditConfig: true,
  table: { file: '/Users/you/.dsh/subagent-routes.yaml', exists: true, revision: 't1',
    text: 'default:\n  provider: acme-frontend\n  model: acme-coder-2\nrules: []\n',
    parsed: { fallback: { provider: 'acme-frontend', model: 'acme-coder-2' }, routes: [] } },
  catalog: [{ id: 'acme-frontend', name: 'Acme Frontend', models: [
    { id: 'acme-coder-2', name: 'Acme Coder 2', reasoning: { efforts: [{ id: 'low', name: '低' }, { id: 'high', name: '高' }], defaultEffort: 'high' } },
    { id: 'acme-mini', name: 'Acme Mini' }] }],
  workspaces: [{ path: '/Users/you/Code/frontend-app', title: 'frontend-app' }],
})
await ctx.route('http://s.test/**', async r => {
  const u = new URL(r.request().url())
  if (u.pathname === '/api/subagent-routes/settings') {
    if (r.request().method() === 'GET') return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(makeSnap())})
    const d = r.request().postDataJSON()
    if (d.kind === 'config') { policy = d.config.fallbackPolicy; return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({saved:true})}) }
    return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(makeSnap().table)})
  }
  if (u.pathname === '/fixture') return r.fulfill({contentType:'text/html',body:html})
  if (u.pathname === '/lib/client.js') return r.fulfill({contentType:'application/javascript',body:await readFile('lib/client.js','utf8')})
  const t = await server.transformRequest(u.pathname+u.search); return r.fulfill({contentType:'application/javascript',body:t.code})
})
const page = await ctx.newPage()
const errors=[]; page.on('pageerror',e=>errors.push(String(e)))
await page.goto('http://s.test/fixture')
await page.addStyleTag({content:'body{margin:0;padding:24px;background:#f8fafc;font-family:system-ui}#mount{max-width:860px;margin:0 auto}'})
await page.evaluate(()=>window.__SR_MOUNT_SETTINGS__('mount'))
await page.getByText('全局默认策略', { exact: true }).waitFor()
const report = { checks: [] }
const radios = page.getByRole('radio')
console.log('radio count:', await radios.count())
console.log('checked:', await page.evaluate(()=>[...document.querySelectorAll('[role=radio]')].map(n=>({label:n.querySelector('.sr-policy-name')?.textContent, checked:n.getAttribute('aria-checked')}))))
// 断言：默认 rules 选中，且不显示失效提示
if (await page.getByText('下列配置已保存但暂不生效', {exact:false}).count() !== 0) throw new Error('默认 rules 下不应出现失效提示')
report.checks.push('默认 rules 时无失效提示')
await page.screenshot({path:`${out}/policy-rules.png`, fullPage:true})
// 切到 inherit：应出现失效提示，且保存按钮变脏
await page.getByRole('radio', {name:/继承主代理模型/}).click()
await page.waitForTimeout(120)
const warn = page.getByText('下列配置已保存但暂不生效', {exact:false})
await warn.first().waitFor()
const warnCount = await warn.count()
console.log('warn count (expect 2 cards):', warnCount)
if (warnCount < 2) throw new Error('兜底模型卡与规则卡都应提示失效')
report.checks.push(`策略=继承时两张卡片都提示失效（实测 ${warnCount} 处）`)
const dirty = await page.evaluate(()=>[...document.querySelectorAll('button')].some(b=>b.textContent?.includes('保存所有更改')))
if (!dirty) throw new Error('切换策略后应出现「保存所有更改」')
report.checks.push('切换策略后进入未保存态')
await page.screenshot({path:`${out}/policy-inherit.png`, fullPage:true})
// 保存并验证 payload
await page.getByRole('button',{name:'保存所有更改'}).click()
await page.waitForTimeout(500)
console.log('saved policy:', policy)
if (policy !== 'inherit') throw new Error('保存后宿主应收到 fallbackPolicy=inherit')
report.checks.push('保存后宿主收到 fallbackPolicy=inherit')
if (errors.length) throw new Error('页面错误: '+errors.join(';'))
report.checks.push('无页面错误')
await writeFile(`${out}/policy-report.json`, JSON.stringify(report,null,2))
console.log('OK', JSON.stringify(report.checks,null,2))
await browser.close(); await server.close()
