/**
 * 生成 README 用的设置页截图。
 *
 * 在隔离浏览器里加载**已构建的** client 产物，宿主 API 全部走内存 mock，
 * 不接触任何真实 profile、凭据或用户配置。截图里的项目路径、提供商与模型
 * 全部是合成演示数据，不代表任何实际环境。
 */
import { mkdir, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const viteEntry = require.resolve('vite', { paths: [require.resolve('vitest/package.json')] })
const { createServer } = await import(pathToFileURL(viteEntry).href)
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE)).href
  : 'playwright')

const output = resolve('docs/images')
await mkdir(output, { recursive: true })

const server = await createServer({ root: process.cwd(), configFile: false, server: { middlewareMode: true } })

const fixtureHtml = [
  '<!doctype html><html><head><meta charset="UTF-8"><title>subagent-routes</title></head>',
  '<body><div id="mount"></div>',
  '<script type="module" src="/tests/client/browser-fixture.ts"></script></body></html>',
].join('')

/** 合成演示快照：提供商名称与模型均为公开通用示例，路径为明显的占位符。 */
const DEMO_TABLE = [
  '# 子代理工作区路由表',
  '# 最长前缀匹配优先；未匹配项目回落至全局兜底配置（若有）。',
  '',
  '# 全局兜底配置（未匹配项目时使用）',
  'default:',
  '  provider: openai',
  '  model: gpt-4.1',
  '  reasoningEffort: medium',
  '',
  '# 项目专属路由规则',
  'routes:',
  '  - path: /Users/you/Code/frontend-app',
  '    provider: anthropic',
  '    model: claude-sonnet-4',
  '    reasoningEffort: high',
  '  - path: /Users/you/Code/deep-research',
  '    provider: deepseek',
  '    model: deepseek-reasoner',
  '    reasoningEffort: max',
  '  - path: /Users/you/Code/scratch',
  '    reasoningEffort: low',
  '',
].join('\n')

const DEMO_PARSED = {
  fallback: { provider: 'openai', model: 'gpt-4.1', reasoningEffort: 'medium' },
  routes: [
    { path: '/Users/you/Code/frontend-app', provider: 'anthropic', model: 'claude-sonnet-4', reasoningEffort: 'high' },
    { path: '/Users/you/Code/deep-research', provider: 'deepseek', model: 'deepseek-reasoner', reasoningEffort: 'max' },
    { path: '/Users/you/Code/scratch', reasoningEffort: 'low' },
  ],
}

const DEMO_CATALOG = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      {
        id: 'gpt-4.1',
        name: 'GPT-4.1',
        reasoning: {
          efforts: [
            { id: 'low', name: 'Low', description: '快速响应' },
            { id: 'medium', name: 'Medium', description: '平衡' },
            { id: 'high', name: 'High', description: '深度推理' },
          ],
          defaultEffort: 'medium',
        },
      },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 mini' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: [
      {
        id: 'claude-sonnet-4',
        name: 'Claude Sonnet 4',
        reasoning: {
          efforts: [
            { id: 'low', name: 'Low' },
            { id: 'high', name: 'High' },
            { id: 'max', name: 'Max', description: '极限思考' },
          ],
          defaultEffort: 'high',
        },
      },
      { id: 'claude-haiku', name: 'Claude Haiku' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    models: [
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek Reasoner',
        reasoning: { efforts: [{ id: 'low', name: 'Low' }, { id: 'max', name: 'Max' }], defaultEffort: 'max' },
      },
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
    ],
  },
]

const DEMO_WORKSPACES = [
  { path: '/Users/you/Code/frontend-app', title: 'frontend-app' },
  { path: '/Users/you/Code/deep-research', title: 'deep-research' },
  { path: '/Users/you/Code/scratch', title: 'scratch' },
  { path: '/Users/you/Code/docs-site', title: 'docs-site' },
]

const snapshot = {
  config: { routesFile: '', enabled: true, preflight: true },
  configRevision: 'demo-config',
  canEditConfig: true,
  table: {
    file: '/Users/you/.dsh/subagent-routes.yaml',
    exists: true,
    text: DEMO_TABLE,
    revision: 'demo-table',
    parsed: DEMO_PARSED,
  },
  catalog: DEMO_CATALOG,
  workspaces: DEMO_WORKSPACES,
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1000, height: 1200 },
  deviceScaleFactor: 2,
})

try {
  await context.route('http://settings.test/**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname === '/api/subagent-routes/settings') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(snapshot),
      })
    }
    if (url.pathname === '/fixture') return route.fulfill({ contentType: 'text/html', body: fixtureHtml })
    if (url.pathname === '/lib/client.js') {
      return route.fulfill({ contentType: 'application/javascript', body: await readFile('lib/client.js', 'utf8') })
    }
    const result = await server.transformRequest(url.pathname + url.search)
    if (!result) return route.fulfill({ status: 404, body: 'not found' })
    return route.fulfill({ contentType: 'application/javascript', body: result.code })
  })

  const page = await context.newPage()
  page.on('pageerror', error => { throw new Error(`浏览器运行时错误：${error}`) })

  await page.goto('http://settings.test/fixture')
  await page.getByRole('heading', { name: '子代理工作区路由' }).waitFor()
  await page.addStyleTag({
    content: [
      'body{margin:0;padding:32px;background:#f8fafc;font-family:system-ui}',
      '#mount{max-width:860px;margin:0 auto}',
      '.sr-settings{max-width:100%}',
    ].join(''),
  })

  /** 切换主题并按需裁切：`clip` 用元素外框，保证图片只包含相关区块。 */
  const shot = async (name, mode, selector) => {
    await page.evaluate(next => {
      document.documentElement.toggleAttribute('data-ds-dark-theme', next === 'dark')
      document.body.style.background = next === 'dark' ? '#141a23' : '#f8fafc'
    }, mode)
    const target = selector === undefined ? page : page.locator(selector)
    await target.screenshot({ path: `${output}/${name}.png`, animations: 'disabled' })
    console.log(`captured ${name}.png`)
  }

  const suffix = (mode) => (mode === 'dark' ? 'dark' : 'light')

  for (const mode of ['light', 'dark']) {
    await shot(`settings-overview-${suffix(mode)}`, mode, '.sr-settings')
  }

  // 模型选择器联动特写：全局兜底卡片
  await page.evaluate(() => document.documentElement.removeAttribute('data-ds-dark-theme'))
  const fallbackCard = page.locator('.sr-card').first()
  await fallbackCard.screenshot({ path: `${output}/fallback-card.png`, animations: 'disabled' })
  console.log('captured fallback-card.png')

  // 规则编辑器：工作区下拉 + 模型下拉 + 思考等级联动
  await page.getByRole('button', { name: '+ 新增规则' }).click()
  await page.getByRole('heading', { name: '新建项目专属规则' }).waitFor()
  // 0 = 工作区路径，1 = Provider，2 = Model，3 = 思考等级
  await page.locator('.sr-editor-box select').nth(0).selectOption(DEMO_WORKSPACES[0].path)
  await page.locator('.sr-editor-box select').nth(2).selectOption({ label: 'Claude Sonnet 4 (claude-sonnet-4)' })
  await page.locator('.sr-editor-box').screenshot({ path: `${output}/rule-editor.png`, animations: 'disabled' })
  console.log('captured rule-editor.png')

  // 列表总览：规则数量多时的卡片形态
  await page.locator('.sr-card').last().screenshot({ path: `${output}/rule-list.png`, animations: 'disabled' })
  console.log('captured rule-list.png')
} finally {
  await browser.close()
  await server.close()
}
