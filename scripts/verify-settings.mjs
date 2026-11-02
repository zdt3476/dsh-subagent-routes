// 隔离验收：加载实际构建的 ModuleLoader client，所有 API 由浏览器 mock，不接触用户 profile。
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const { createServer } = await import(pathToFileURL(require.resolve('vite', { paths: [require.resolve('vitest/package.json')] })).href)
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE)).href
  : 'playwright')
const output = resolve('artifacts/settings')
await mkdir(output, { recursive: true })

const server = await createServer({ root: process.cwd(), configFile: false, server: { middlewareMode: true } })
const fixtureHtml = '<!doctype html><html><head><meta charset="UTF-8"></head><body><div id="mount"></div><script type="module" src="/tests/client/browser-fixture.ts"></script></body></html>'
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1000, height: 1300 } })
let snapshot, rejectTable, rejectLoad, pendingLoad, pendingSave, rejectConfig
let saved = 0
const hold = () => { let release; const promise = new Promise(resolve => { release = resolve }); return { promise, release } }
const contrast = (foreground, background) => {
  const luminance = color => {
    const channels = color.match(/\d+/g).slice(0, 3).map(Number).map(value => { const s = value / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4 })
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
  }
  const a = luminance(foreground), b = luminance(background)
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05)
}
const fresh = () => ({
  config: { routesFile: '', enabled: true, preflight: true }, configRevision: 'config-1', canEditConfig: true,
  table: { file: `/home/example/projects/${'very-long-directory/'.repeat(6)}routes.yaml`, exists: true, revision: 'table-1', text: '# 验收使用合成配置\ndefault:\n  reasoningEffort: high\nroutes:\n  - path: ~/Code/frontend\n    provider: example-provider\n    model: example-model\n' },
})
snapshot = fresh()
const report = { scope: 'isolated-built-client; mocked API; no production profile', checks: [], geometry: [] }
try {
  await context.route('http://settings.test/**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname === '/api/subagent-routes/settings') {
      if (route.request().method() === 'GET') {
        if (pendingLoad) await pendingLoad
        return route.fulfill({ status: rejectLoad ? 503 : 200, contentType: 'application/json', body: JSON.stringify(rejectLoad ? { error: '验收：读取失败' } : snapshot) })
      }
      const data = route.request().postDataJSON()
      if (pendingSave) await pendingSave
      if (data.kind === 'config' && rejectConfig) return route.fulfill({ status: rejectConfig, contentType: 'application/json', body: JSON.stringify({ error: `验收：基础配置保存失败 ${rejectConfig}` }) })
      if (data.kind === 'table') {
        if (rejectTable) return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: '文件已被修改，请重新读取后合并修改再保存' }) })
        snapshot.table = { ...snapshot.table, text: data.text, exists: true, revision: `table-${++saved + 1}` }
        delete snapshot.table.validationError
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snapshot.table) })
      }
      snapshot.config = data.config; snapshot.configRevision = `config-${++saved + 1}`
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ saved: true }) })
    }
    if (url.pathname === '/fixture') return route.fulfill({ contentType: 'text/html', body: fixtureHtml })
    if (url.pathname === '/lib/client.js') return route.fulfill({ contentType: 'application/javascript', body: await readFile('lib/client.js', 'utf8') })
    const result = await server.transformRequest(url.pathname + url.search)
    if (!result) throw new Error(`Unable to transform ${url.pathname}`)
    return route.fulfill({ contentType: 'application/javascript', body: result.code })
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(String(error)))
  const initialLoad = hold(); pendingLoad = initialLoad.promise
  await page.goto('http://settings.test/fixture')
  await page.getByText('正在读取设置…', { exact: true }).waitFor()
  await page.screenshot({ path: `${output}/loading.png`, fullPage: true })
  initialLoad.release(); pendingLoad = null
  await page.getByRole('textbox', { name: '路由表内容（YAML）' }).waitFor()
  report.checks.push('delayed initial load visible')
  assert.deepEqual(await page.evaluate(() => window.__SR_KEYS__()), ['@zdt3476/dsh-subagent-routes', '@zdt3476/dsh-subagent-routes#subagent-routes'])
  await page.addStyleTag({ content: 'body{margin:0;padding:24px;background:#f8fafc;font-family:system-ui}#mount{max-width:840px;margin:0 auto}' })
  for (const mode of ['light', 'dark']) {
    await page.evaluate(mode => {
      document.documentElement.toggleAttribute('data-ds-dark-theme', mode === 'dark')
      document.body.style.background = mode === 'dark' ? '#18212f' : '#f8fafc'
    }, mode)
    for (const width of [1000, 375]) {
      await page.setViewportSize({ width, height: 1300 })
      const geometry = await page.evaluate(() => {
        const root = document.querySelector('.sr-settings')
        const textarea = root.querySelector('textarea')
        const bounds = textarea.getBoundingClientRect()
        const style = getComputedStyle(root)
        const input = root.querySelector('input[type=text]')
        const inputStyle = getComputedStyle(input)
        return { placeholder: getComputedStyle(input, '::placeholder').color, inputBackground: inputStyle.backgroundColor, inputBorder: inputStyle.borderTopColor, viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, rootWidth: root.getBoundingClientRect().width,
          textarea: { left: bounds.left, right: bounds.right, width: bounds.width }, color: style.color, background: style.getPropertyValue('--sr-bg').trim(), font: style.fontSize }
      })
      assert.ok(geometry.documentWidth <= width, `Overflow: ${JSON.stringify(geometry)}`)
      assert.ok(geometry.textarea.left >= 0 && geometry.textarea.right <= width)
      const placeholderContrast = contrast(geometry.placeholder, geometry.inputBackground)
      const borderContrast = contrast(geometry.inputBorder, geometry.inputBackground)
      assert.ok(placeholderContrast >= 4.5, `Placeholder contrast ${placeholderContrast}`)
      assert.ok(borderContrast >= 3, `Input border contrast ${borderContrast}`)
      report.geometry.push({ mode, ...geometry, placeholderContrast, borderContrast })
      await page.screenshot({ path: `${output}/${mode}-${width}.png`, fullPage: true })
    }
  }
  await page.setViewportSize({ width: 1000, height: 1300 })
  const textarea = page.getByRole('textbox', { name: '路由表内容（YAML）' })
  const path = page.getByRole('textbox', { name: '路由表文件路径' })
  const tableButton = page.getByRole('button', { name: '校验并保存路由表', exact: true })
  const configButton = page.getByRole('button', { name: '保存基础设置', exact: true })
  const nextText = snapshot.table.text.replace('high', 'low')
  await textarea.fill(nextText)
  assert.equal(await path.isDisabled(), true)
  const slowSave = hold(); pendingSave = slowSave.promise
  await tableButton.click()
  await page.getByRole('button', { name: '校验并保存中…', exact: true }).waitFor()
  assert.equal(await textarea.isDisabled(), true)
  await page.screenshot({ path: `${output}/saving.png`, fullPage: true })
  slowSave.release(); pendingSave = null
  await page.getByText('路由表已校验并保存，下次新派活立即使用。', { exact: true }).waitFor()
  report.checks.push('delayed save disables duplicate writes')
  assert.equal(snapshot.table.text, nextText)
  report.checks.push('table save and mutual edit guard')
  await path.fill('~/new-routes.yaml')
  assert.equal(await textarea.isDisabled(), true)
  await configButton.click()
  await page.getByText('基础设置已保存并生效，仅影响后续新派活。', { exact: true }).waitFor()
  assert.equal(snapshot.config.routesFile, '~/new-routes.yaml')
  report.checks.push('config save and reload')
  rejectTable = true
  await textarea.fill(nextText + '\n# unsaved')
  await tableButton.click()
  await page.getByRole('alert').filter({ hasText: '文件已被修改' }).waitFor()
  assert.equal(await textarea.inputValue(), nextText + '\n# unsaved')
  assert.equal(await page.getByText('路由表已校验并保存，下次新派活立即使用。', { exact: true }).count(), 0)
  await page.screenshot({ path: `${output}/conflict.png`, fullPage: true })
  report.checks.push('conflict preserves draft and does not show success')
  await page.getByRole('button', { name: '放弃路由修改', exact: true }).click()
  const remount = async () => {
    await page.evaluate(() => window.__SR_MOUNT__())
    await page.getByRole('heading', { name: '基础设置', exact: true }).waitFor()
  }
  snapshot = fresh(); snapshot.table.exists = false; snapshot.table.text = ''
  await remount()
  await page.getByText('尚未创建路由表。', { exact: false }).waitFor()
  await page.screenshot({ path: `${output}/empty.png`, fullPage: true })
  report.checks.push('missing file state')
  snapshot = fresh(); snapshot.table.validationError = 'default 含未知字段 typo'
  await remount()
  await page.getByRole('alert').filter({ hasText: '现有文件校验失败' }).waitFor()
  assert.equal(await textarea.isDisabled(), false)
  await textarea.fill('routes: []\n')
  assert.equal(await textarea.inputValue(), 'routes: []\n')
  report.checks.push('invalid YAML remains editable')
  snapshot = fresh(); snapshot.table = null; snapshot.tableError = '无法读取路由表，请修改基础设置中的路径'
  await remount()
  await page.getByRole('alert').filter({ hasText: '无法读取路由表' }).waitFor()
  assert.equal(await path.isDisabled(), false)
  report.checks.push('file read failure keeps config controls available')
  rejectLoad = true
  await page.evaluate(() => window.__SR_MOUNT__())
  await page.getByRole('alert').filter({ hasText: '验收：读取失败' }).waitFor()
  rejectLoad = false; snapshot = fresh()
  await page.getByRole('button', { name: '重试读取' }).click()
  await textarea.waitFor()
  report.checks.push('load failure and retry')
  for (const status of [409, 500]) {
    rejectConfig = status
    await path.fill(`~/failed-${status}.yaml`)
    await configButton.click()
    await page.getByRole('alert').filter({ hasText: `基础配置保存失败 ${status}` }).waitFor()
    assert.equal(await path.inputValue(), `~/failed-${status}.yaml`)
    assert.equal(await page.getByText('基础设置已保存并生效，仅影响后续新派活。', { exact: true }).count(), 0)
  }
  rejectConfig = null
  rejectLoad = true
  await configButton.click()
  await page.getByRole('alert').filter({ hasText: '基础设置已保存，但重新读取失败' }).waitFor()
  rejectLoad = false
  await page.getByRole('button', { name: '放弃基础修改' }).click()
  await page.getByRole('button', { name: '重新读取设置' }).click()
  await textarea.waitFor()
  report.checks.push('config 409 and 500 preserve draft; saved-but-reload-failed is distinct')
  await page.waitForFunction(() => document.querySelector('.sr-settings')?.getAttribute('aria-busy') === 'false')
  await page.evaluate(() => { document.body.tabIndex = -1; document.body.focus(); window.scrollTo(0, 0) })
  const count = await page.locator('.sr-settings :is(input, textarea, button, summary):not(:disabled)').count()
  const focused = []
  for (let index = 0; index < count; index++) {
    await page.keyboard.press('Tab')
    const focus = await page.evaluate(() => {
      const element = document.activeElement, style = getComputedStyle(element), bounds = element.getBoundingClientRect()
      return { tag: element.tagName, outline: style.outlineStyle, width: style.outlineWidth, top: bounds.top, bottom: bounds.bottom, viewport: innerHeight }
    })
    assert.ok(focus.tag !== 'BODY')
    assert.notEqual(focus.outline, 'none')
    assert.ok(focus.bottom > 0 && focus.top < focus.viewport)
    focused.push(focus.tag)
  }
  report.focusTraversal = focused
  report.checks.push('all enabled controls traversed with visible keyboard focus')
  assert.deepEqual(errors, [])
  report.checks.push('no browser runtime errors')
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally {
  await browser.close()
  await server.close()
}
