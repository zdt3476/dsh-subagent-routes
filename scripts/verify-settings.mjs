// Exercise the built Client with isolated Host responses; never touch a profile.
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const { createServer } = await import(pathToFileURL(require.resolve('vite', { paths: [require.resolve('vitest/package.json')] })).href)
const playwright = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE)).href
  : 'playwright')
const { chromium } = playwright.default ?? playwright
const output = resolve('artifacts/settings')
await mkdir(output, { recursive: true })
const server = await createServer({ root: process.cwd(), configFile: false, server: { middlewareMode: true } })
const html = '<!doctype html><html><head><meta charset="UTF-8"></head><body><div id="mount"></div><script type="module" src="/tests/client/browser-fixture.ts"></script></body></html>'
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
const context = await browser.newContext({ viewport: { width: 1000, height: 1300 } })
const hold = () => { let release; const promise = new Promise(resolve => { release = resolve }); return { promise, release } }
const originalText = '# Keep this comment\ndefault:\n  reasoningEffort: high\nroutes:\n  - path: "/work/archive # 2025" # existing directory\n    provider: example\n    model: "m # variant" # existing model\n'
const fresh = () => ({
  config: { routesFile: '', enabled: true, preflight: true, fallbackPolicy: 'rules' },
  configRevision: 'config-1', canEditConfig: true,
  table: { file: '/work/routes.yaml', exists: true, revision: 'table-1', text: originalText },
})
let snapshot = fresh(), rejectLoad = false, rejectTable = false, rejectConfig = false, failReload = false
let pendingSave = null, saved = 1
const requests = [], errors = []
const report = { scope: 'isolated-built-client; mocked API; no production profile', checks: [], geometry: [] }
try {
  await context.route('http://settings.test/**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname === '/api/subagent-routes/settings') {
      if (route.request().method() === 'GET') return route.fulfill({ status: rejectLoad ? 503 : 200, contentType: 'application/json', body: JSON.stringify(rejectLoad ? { error: '验收：读取失败' } : snapshot) })
      const data = route.request().postDataJSON()
      requests.push(data)
      if (pendingSave) await pendingSave
      if (data.kind === 'table') {
        if (rejectTable) return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: '文件已被修改，请重新读取后合并修改再保存' }) })
        snapshot.table = { ...snapshot.table, text: data.text, exists: true, revision: `table-${++saved}` }
        delete snapshot.table.validationError
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snapshot.table) })
      }
      if (rejectConfig) return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: '配置已被修改' }) })
      if (data.config.routesFile !== snapshot.config.routesFile) snapshot.table = {
        file: data.config.routesFile, exists: true, revision: `new-file-${++saved}`, text: '# Independent new file\nroutes: []\n',
      }
      snapshot.config = data.config
      snapshot.configRevision = `config-${++saved}`
      if (failReload) rejectLoad = true
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ saved: true }) })
    }
    if (url.pathname === '/api/subagent-routes/session') return route.fulfill({
      contentType: 'application/json', body: JSON.stringify({
        sessionId: 'session-demo', directory: '/work/project', tableAvailable: true, enabled: true,
        defaultPolicy: 'inherit', mode: 'custom', session: { mode: 'custom', provider: 'example', model: 'example-model' },
        effective: { source: 'session', spec: { provider: 'example', model: 'example-model' } },
      }),
    })
    if (url.pathname === '/fixture') return route.fulfill({ contentType: 'text/html', body: html })
    if (url.pathname === '/lib/client.js') return route.fulfill({ contentType: 'application/javascript', body: await readFile('lib/client.js', 'utf8') })
    const transformed = await server.transformRequest(url.pathname + url.search)
    if (!transformed) throw new Error(`Unable to transform ${url.pathname}`)
    return route.fulfill({ contentType: 'application/javascript', body: transformed.code })
  })
  const page = await context.newPage()
  page.setDefaultTimeout(7000)
  page.on('pageerror', error => errors.push(String(error)))
  page.on('dialog', dialog => dialog.accept())
  await page.goto('http://settings.test/fixture')
  await page.waitForFunction(() => typeof window.__SR_MOUNT_SETTINGS__ === 'function')
  const remount = async () => {
    await page.evaluate(() => { window.__SR_RESET__(); window.__SR_MOUNT_SETTINGS__('mount') })
    await page.getByRole('heading', { name: '子代理工作区路由', exact: true }).waitFor()
  }
  await remount()
  await page.getByText('全局默认策略', { exact: true }).waitFor()
  report.checks.push('built ModuleLoader Client mounts with bundled YAML parser')
  await page.getByText('高级选项（预检校验与存储路径）', { exact: true }).click()
  const path = page.getByRole('textbox', { name: '自定义路由表存储路径', exact: true })
  const textarea = page.getByRole('textbox', { name: '路由表内容（YAML）', exact: true })
  const toYaml = () => page.getByRole('button', { name: '原始 YAML 模式', exact: true }).click()
  const toVisual = () => page.getByRole('button', { name: '规则设置', exact: true }).click()
  const save = () => page.getByRole('button', { name: '保存所有更改', exact: true }).click()

  // Editing one rule must leave an unrelated quoted # and comments intact.
  await page.getByRole('button', { name: '+ 新增规则', exact: true }).click()
  assert.equal(await path.isDisabled(), true)
  await page.getByRole('textbox', { name: '项目根目录绝对路径 *', exact: true }).fill('/work/new # project')
  const editor = page.locator('.sr-editor-box')
  await editor.getByRole('textbox', { name: 'Provider（提供商）', exact: true }).fill('example')
  await editor.getByRole('textbox', { name: '模型名称 (Model)', exact: true }).fill('new # model')
  await page.getByRole('button', { name: '确认保存规则', exact: true }).click()
  await toYaml()
  const draft = await textarea.inputValue()
  for (const value of ['# Keep this comment', '/work/archive # 2025', 'm # variant', '# existing model', '/work/new # project', 'new # model']) assert.ok(draft.includes(value), value)
  report.checks.push('visual edit preserves unrelated quoted values and comments')

  // Both directions of path/table mutual exclusion, with draft discard.
  assert.equal(await path.isDisabled(), true)
  await page.getByRole('button', { name: '放弃修改', exact: true }).click()
  await path.fill('/work/new-file.yaml')
  assert.equal(await textarea.isDisabled(), true)
  await save()
  await page.getByText('基础设置已保存。', { exact: true }).waitFor()
  assert.equal(await textarea.inputValue(), '# Independent new file\nroutes: []\n')
  assert.equal(requests.filter(r => r.kind === 'table').length, 0)
  report.checks.push('switching paths loads new file without copying old draft')

  // Malformed/unsupported YAML cannot silently become an empty Visual form.
  for (const invalid of ['routes: [', 'unexpected: true\nroutes: []\n']) {
    await textarea.fill(invalid)
    await toVisual()
    await page.getByRole('alert').filter({ hasText: '无法切换到规则设置' }).waitFor()
    assert.equal(await textarea.inputValue(), invalid)
  }
  await textarea.fill('routes: []\n')
  await toVisual()
  await page.getByText('全局默认策略', { exact: true }).waitFor()
  report.checks.push('invalid YAML stays editable and cannot overwrite through Visual mode')

  // Manual fallback can be half-filled without writing that invalid pair into YAML.
  await page.getByRole('button', { name: '放弃修改', exact: true }).click()
  const fallback = page.locator('.sr-card').filter({ has: page.getByRole('heading', { name: '全局默认模型（未匹配项目时使用）', exact: true }) })
  await fallback.getByRole('textbox', { name: 'Provider（提供商）', exact: true }).fill('manual-provider')
  assert.equal(await page.getByRole('button', { name: '保存所有更改', exact: true }).isDisabled(), true)
  assert.equal(await path.isDisabled(), true)
  await fallback.getByRole('textbox', { name: '模型名称 (Model)', exact: true }).fill('manual-model')
  await toYaml()
  assert.ok((await textarea.inputValue()).includes('manual-provider'))
  report.checks.push('incomplete fallback remains a protected form draft')

  // A failed second write leaves an accurate baseline and a retryable config draft.
  await page.getByRole('checkbox', { name: '派活前进行模型可用性预检', exact: true }).uncheck()
  rejectConfig = true
  const gate = hold(); pendingSave = gate.promise
  await save()
  await page.getByRole('button', { name: '正在保存…', exact: true }).waitFor()
  assert.equal(await textarea.isDisabled(), true)
  gate.release(); pendingSave = null
  await page.getByRole('alert').filter({ hasText: '路由表已保存；基础设置未保存' }).waitFor()
  assert.ok((await textarea.inputValue()).includes('manual-provider'))
  const writes = requests.filter(r => r.kind === 'table').length
  rejectConfig = false
  await save()
  await page.getByText('基础设置已保存。', { exact: true }).waitFor()
  assert.equal(requests.filter(r => r.kind === 'table').length, writes)
  report.checks.push('partial save reports both outcomes; retry does not resubmit saved table')

  rejectTable = true
  const conflicted = (await textarea.inputValue()) + '\n# unsaved conflict\n'
  await textarea.fill(conflicted)
  await save()
  await page.getByRole('alert').filter({ hasText: '路由表未保存' }).waitFor()
  assert.equal(await textarea.inputValue(), conflicted)
  rejectTable = false
  await page.getByRole('button', { name: '放弃修改', exact: true }).click()
  report.checks.push('revision conflict preserves the entire YAML draft')

  // Changing file succeeded, but the read failed: no editable old-file draft survives.
  failReload = true
  await path.fill('/work/third-file.yaml')
  await save()
  await page.getByRole('alert').filter({ hasText: '基础设置已保存，但重新读取失败' }).waitFor()
  assert.equal(await textarea.isDisabled(), true)
  assert.equal(await page.getByRole('button', { name: '请先重新读取', exact: true }).isDisabled(), true)
  rejectLoad = false; failReload = false
  await page.getByRole('button', { name: '重新读取', exact: true }).click()
  await page.waitForFunction(() => !document.querySelector('.sr-textarea')?.disabled)
  assert.equal(await textarea.inputValue(), '# Independent new file\nroutes: []\n')
  report.checks.push('saved-but-reload-failed locks stale revisions until explicit retry')

  // Existing-file parse/read errors and initial load recovery.
  snapshot = fresh(); snapshot.table.text = 'routes: ['; snapshot.table.validationError = '路由表不是合法 YAML'
  await remount()
  await page.getByRole('alert').filter({ hasText: '现有文件校验失败' }).waitFor()
  assert.equal(await textarea.isDisabled(), false)
  snapshot = fresh(); snapshot.table = null; snapshot.tableError = '路由表必须是普通文件'
  await remount()
  await page.getByRole('alert').filter({ hasText: '路由表必须是普通文件' }).waitFor()
  await page.getByText('高级选项（预检校验与存储路径）', { exact: true }).click()
  assert.equal(await path.isDisabled(), false)
  rejectLoad = true
  await remount()
  await page.getByRole('alert').filter({ hasText: '验收：读取失败' }).waitFor()
  rejectLoad = false; snapshot = fresh()
  await page.getByRole('button', { name: '重新读取设置', exact: true }).click()
  await page.getByText('全局默认策略', { exact: true }).waitFor()
  report.checks.push('invalid file remains editable; read and initial-load errors recover')

  await toYaml()
  await page.addStyleTag({ content: 'body{margin:0;padding:24px;background:#f8fafc;font-family:system-ui}#mount{max-width:840px;margin:0 auto}' })
  for (const mode of ['light', 'dark']) {
    await page.evaluate(mode => {
      document.documentElement.toggleAttribute('data-ds-dark-theme', mode === 'dark')
      document.body.style.background = mode === 'dark' ? '#18212f' : '#f8fafc'
    }, mode)
    for (const width of [1000, 375]) {
      await page.setViewportSize({ width, height: 1300 })
      for (const view of ['yaml', 'visual']) {
        if (view === 'visual') await toVisual()
        else await toYaml()
        const geometry = await page.evaluate(() => {
          const root = document.querySelector('.sr-settings').getBoundingClientRect()
          const textarea = document.querySelector('.sr-textarea')?.getBoundingClientRect()
          return {
            viewport: innerWidth, documentWidth: document.documentElement.scrollWidth,
            root: { left: root.left, right: root.right },
            ...(textarea ? { textarea: { left: textarea.left, right: textarea.right } } : {}),
          }
        })
        assert.ok(geometry.documentWidth <= width, JSON.stringify(geometry))
        assert.ok(geometry.root.left >= 0 && geometry.root.right <= width)
        if (geometry.textarea) assert.ok(geometry.textarea.left >= 0 && geometry.textarea.right <= width)
        report.geometry.push({ mode, view, ...geometry })
        await page.screenshot({ path: `${output}/settings-${view}-${mode}-${width}.png`, fullPage: true })
      }
    }
  }
  await page.evaluate(() => { window.__SR_RESET__(); window.__SR_MOUNT_PANEL__('mount') })
  const freeze = page.getByRole('button', { name: '固化为项目规则', exact: true })
  await freeze.waitFor()
  assert.equal(await freeze.isDisabled(), true)
  await page.getByText('全局策略为继承主代理，请先在设置页改为「使用路由规则」再固化。', { exact: true }).waitFor()
  report.checks.push('sidebar freeze is disabled with a visible explanation under global inherit')
  assert.deepEqual(errors, [])
  report.checks.push('no browser runtime errors; light/dark 375px and 1000px fit')
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally {
  await browser.close()
  await server.close()
}
