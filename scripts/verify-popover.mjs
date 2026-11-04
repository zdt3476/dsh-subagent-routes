// 隔离验收：加载实际构建的 lib/client.js，宿主 API 全部由浏览器 mock 提供。
// 不接触真实 profile；验证输入区浮层（portal + 点即生效）的几何、对比度、
// 状态机与键盘可达性。
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const { createServer } = await import(pathToFileURL(require.resolve('vite', { paths: [require.resolve('vitest/package.json')] })).href)
const playwrightModule = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE)).href
  : 'playwright')
const { chromium } = playwrightModule.default ?? playwrightModule

const output = resolve('artifacts/popover')
await mkdir(output, { recursive: true })

const server = await createServer({ root: process.cwd(), configFile: false, server: { middlewareMode: true } })

// 模拟真实 composer：贴视口底部、带 data-composer-card（浮层按它对齐宽度与位置）
const fixtureHtml = `<!doctype html><html><head><meta charset="UTF-8"></head><body>
  <div id="composer" data-composer-card>
    <div id="chip-mount"></div>
    <div id="overlay-mount"></div>
  </div>
  <script type="module" src="/tests/client/browser-fixture.ts"></script>
</body></html>`

const composerCss = `
  body { margin: 0; background: #f7f7f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  #composer { position: absolute; left: 0; right: 0; bottom: 0; max-width: 820px; margin: 0 auto;
    padding: 8px 10px 10px; background: #ffffff; border: 1px solid #e5e4e0; border-radius: 12px; min-height: 96px; }
  #overlay-mount { position: absolute; inset: 0 0 auto; height: 0; }
  #chip-mount { display: flex; justify-content: flex-end; align-items: center; min-height: 28px; }
`
const darkCss = `body { background: #16181c; } #composer { background: #1b1b18; border-color: #35342f; }`

/*
 * composer 位于视口中部（首页空会话、短对话时的真实布局）。
 * 这种位置上方空间有限，是「先盖住输入框、过几秒才跳上去」的触发条件；
 * 贴底布局永远测不到该缺陷。
 */
const centeredComposerCss = `
  body { margin: 0; background: #f7f7f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  #composer { position: absolute; left: 0; right: 0; top: 180px; max-width: 820px; margin: 0 auto;
    padding: 8px 10px 10px; background: #ffffff; border: 1px solid #e5e4e0; border-radius: 12px; min-height: 120px; }
  #overlay-mount { position: absolute; inset: 0 0 auto; height: 0; }
  #chip-mount { display: flex; justify-content: flex-end; align-items: center; min-height: 28px; }
`

const contrast = (foreground, background) => {
  const luminance = color => {
    const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
      const s = value / 255
      return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4
    })
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
  }
  const a = luminance(foreground)
  const b = luminance(background)
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05)
}

const baseSnapshot = (overrides = {}) => ({
  sessionId: 'session-demo',
  directory: '/Users/you/Code/frontend-app',
  tableAvailable: true,
  enabled: true,
  mode: 'follow',
  defaultPolicy: 'rules',
  workspace: { spec: { provider: 'acme-frontend', model: 'acme-coder-2' }, path: '/Users/you/Code/frontend-app' },
  effective: {
    source: 'workspace',
    spec: { provider: 'acme-frontend', model: 'acme-coder-2' },
    workspacePath: '/Users/you/Code/frontend-app',
  },
  catalog: [
    {
      id: 'acme-frontend', name: 'Acme Frontend',
      models: [
        {
          id: 'acme-coder-2', name: 'Acme Coder 2',
          reasoning: {
            efforts: [{ id: 'low', name: '低' }, { id: 'medium', name: '中' }, { id: 'high', name: '高' }],
            defaultEffort: 'medium',
          },
        },
        { id: 'acme-coder-mini', name: 'Acme Coder Mini' },
      ],
    },
    { id: 'acme-research', name: 'Acme Research', models: [{ id: 'acme-deep', name: 'Acme Deep Think' }] },
  ],
  ...overrides,
})

let snapshot = baseSnapshot()
const savedPayloads = []
let rejectSave = false

const report = { scope: 'isolated built lib/client.js; mocked host API; no production profile', checks: [], geometry: [], screenshots: [] }

const browser = await chromium.launch({ headless: true })
let context
let freshContext

try {
  context = await browser.newContext({ viewport: { width: 900, height: 760 } })
  await context.route('http://popover.test/**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname === '/api/subagent-routes/session') {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snapshot) })
      }
      const data = route.request().postDataJSON()
      savedPayloads.push(data)
      if (rejectSave) {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: '验收：宿主拒绝了这次保存，请稍后重试' }),
        })
      }
      const next = baseSnapshot()
      next.mode = data.mode ?? 'follow'
      if (data.mode === 'inherit') {
        next.session = { mode: 'inherit' }
        delete next.effective
        delete next.workspace
      } else if (data.mode === 'custom') {
        next.session = { mode: 'custom', ...data.override }
        next.effective = { source: 'session', spec: { ...data.override } }
        delete next.workspace
      }
      snapshot = next
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snapshot) })
    }
    if (url.pathname === '/fixture') return route.fulfill({ contentType: 'text/html', body: fixtureHtml })
    if (url.pathname === '/lib/client.js') {
      return route.fulfill({ contentType: 'application/javascript', body: await readFile('lib/client.js', 'utf8') })
    }
    const result = await server.transformRequest(url.pathname + url.search)
    if (!result) throw new Error(`Unable to transform ${url.pathname}`)
    return route.fulfill({ contentType: 'application/javascript', body: result.code })
  })

  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(String(error)))
  await page.goto('http://popover.test/fixture')
  await page.addStyleTag({ content: composerCss })

  // 注册的 seat 必须齐全：设置页两个入口、侧栏 tab、药丸、浮层
  const keys = await page.evaluate(() => window.__SR_KEYS__())
  for (const expected of ['-overlay', '-chip', '/route']) {
    assert.ok(keys.some(key => key.includes(expected)), `缺少 seat: ${expected}（现有 ${keys.join(', ')}）`)
  }
  report.checks.push(`注册 seat: ${keys.join(' | ')}`)

  await page.evaluate(() => {
    window.__SR_MOUNT_CHIP__('chip-mount')
    window.__SR_MOUNT_OVERLAY__('overlay-mount')
  })
  const chip = page.locator('#chip-mount button.sr-chip')
  await chip.waitFor()
  assert.equal(await chip.getAttribute('aria-expanded'), 'false')
  assert.equal(await page.locator('.sr-popover-portal').count(), 0, '未点击时不应渲染浮层')
  report.checks.push('浮层关闭态不渲染 DOM，药丸 aria-expanded=false')

  await chip.click()
  await page.locator('.sr-popover-portal').waitFor()
  await page.waitForTimeout(320)
  assert.equal(await chip.getAttribute('aria-expanded'), 'true')

  /*
   * 关键回归：浮层必须挂在 body 上（portal）。
   * 旧实现挂在 composer 内 0 高的 overlay 锚点上，真实宿主里被压到 181px、内容全裁。
   */
  const portal = await page.evaluate(() => {
    const node = document.querySelector('.sr-popover-portal')
    const rect = node.getBoundingClientRect()
    const composer = document.querySelector('#composer').getBoundingClientRect()
    return {
      parentTag: node.parentElement?.tagName ?? '',
      position: getComputedStyle(node).position,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      top: Math.round(rect.top),
      bottom: Math.round(rect.bottom),
      composerWidth: Math.round(composer.width),
      composerTop: Math.round(composer.top),
    }
  })
  assert.equal(portal.parentTag, 'BODY', `浮层应 portal 到 body，实际父节点 ${portal.parentTag}`)
  assert.equal(portal.position, 'fixed', `浮层应为 fixed 定位，实际 ${portal.position}`)
  /*
   * 「不被压扁」的正确判据不是绝对高度，而是内容是否装得下：
   * 旧实现把浮层塞进 composer 内 0 高的锚点，高度被外部上下文锁死在 181px，
   * 与内容无关。这里改为断言浮层高度由内容决定（body 不被裁切）。
   */
  const fits = await page.evaluate(() => {
    const bodyNode = document.querySelector('.srpop-body')
    return { scrollable: bodyNode.scrollHeight > bodyNode.clientHeight + 1, contentHeight: bodyNode.scrollHeight }
  })
  assert.equal(fits.scrollable, false, `浮层内容被裁切需要滚动: ${JSON.stringify(fits)}`)
  assert.ok(portal.height >= fits.contentHeight, `浮层高度小于内容高度: ${portal.height} < ${fits.contentHeight}`)
  // 浮层宽度最大 360px 且贴合锚点，不强制与全宽 composer 相同
  assert.ok(portal.width <= 360, `浮层宽度不应超过 360px：popover=${portal.width}`)
  assert.ok(portal.width >= 280, `浮层宽度不应小于 280px：popover=${portal.width}`)
  assert.ok(portal.bottom <= portal.composerTop + 1,
    `浮层应在输入框上方：bottom=${portal.bottom} composerTop=${portal.composerTop}`)
  report.checks.push(`portal 到 body、fixed、宽 ${portal.width}px、高 ${portal.height}px（固定紧凑宽度）`)
  report.checks.push('浮层贴在输入框上方')



  // 首页展示 3 种配置方式：跟随全局策略、继承主代理、指定模型…
  const modeLabels = await page.locator('.srpop-mode-title').allTextContents()
  assert.deepEqual(modeLabels, ['跟随全局策略', '继承主代理', '指定模型…'],
    `模式按钮标签应为跟随全局/继承/指定模型，实际：${JSON.stringify(modeLabels)}`)
  report.checks.push('首页提供「跟随全局策略 / 继承主代理 / 指定模型…」三种操作')

  for (const mode of ['light', 'dark']) {
    await page.evaluate(({ mode, darkCss }) => {
      // 用显式设置而非 toggleAttribute：多轮循环里 toggle 会与上轮状态耦合
      if (mode === 'dark') document.documentElement.setAttribute('data-ds-dark-theme', '')
      else document.documentElement.removeAttribute('data-ds-dark-theme')
      const existing = document.getElementById('theme-override')
      if (existing !== null) existing.remove()
      if (mode === 'dark') {
        const style = document.createElement('style')
        style.id = 'theme-override'
        style.textContent = darkCss
        document.head.append(style)
      }
    }, { mode, darkCss: darkCss })

    for (const width of [900, 420, 320]) {
      await page.setViewportSize({ width, height: 760 })
      await page.waitForTimeout(180)
      const geometry = await page.evaluate(() => {
        const node = document.querySelector('.sr-popover-portal')
        const box = node.getBoundingClientRect()
        const bodyNode = document.querySelector('.srpop-body')
        const modes = [...document.querySelectorAll('.srpop-mode')].map(el => {
          const r = el.getBoundingClientRect()
          return { width: Math.round(r.width), height: Math.round(r.height) }
        })
        const items = [...document.querySelectorAll('.srpop-item')].map(el => {
          const r = el.getBoundingClientRect()
          return { width: Math.round(r.width), height: Math.round(r.height) }
        })
        return {
          viewport: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          popover: {
            left: Math.round(box.left),
            right: Math.round(box.right),
            top: Math.round(box.top),
            bottom: Math.round(box.bottom),
            width: Math.round(box.width),
            height: Math.round(box.height),
            background: getComputedStyle(node).backgroundColor,
          },
          bodyScrollable: bodyNode === null ? null : bodyNode.scrollHeight > bodyNode.clientHeight + 1,
          modes,
          items,
        }
      })

      const luminance = color => {
        const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
          const s = value / 255
          return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4
        })
        return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
      }
      const backgroundLuma = luminance(geometry.popover.background)
      if (mode === 'dark') {
        assert.ok(backgroundLuma < 0.25, `深色下浮层底板仍是浅色: ${geometry.popover.background}`)
      } else {
        assert.ok(backgroundLuma > 0.6, `浅色下浮层底板异常偏暗: ${geometry.popover.background}`)
      }

      assert.ok(geometry.documentWidth <= width, `横向溢出: ${JSON.stringify(geometry)}`)
      assert.ok(geometry.popover.left >= 0 && geometry.popover.right <= width,
        `浮层横向出屏: ${geometry.popover.left}~${geometry.popover.right} / ${width}`)
      assert.ok(geometry.popover.top >= 0, `浮层顶部出屏: ${geometry.popover.top}`)

      for (const [index, modeButton] of geometry.modes.entries()) {
        assert.ok(modeButton.height >= 26 && modeButton.width >= 40,
          `模式按钮 ${index} 热区过小: ${JSON.stringify(modeButton)}`)
      }

      const samples = await page.evaluate(() => {
        const read = selector => {
          const el = document.querySelector(selector)
          if (el === null) return null
          const style = getComputedStyle(el)
          const parseColor = value => {
            const numbers = (value.match(/[\d.]+/g) ?? []).map(Number)
            if (value.startsWith('color(')) {
              return {
                r: (numbers[0] ?? 0) * 255,
                g: (numbers[1] ?? 0) * 255,
                b: (numbers[2] ?? 0) * 255,
                a: numbers.length > 3 ? numbers[3] : 1,
              }
            }
            return { r: numbers[0] ?? 0, g: numbers[1] ?? 0, b: numbers[2] ?? 0, a: numbers.length > 3 ? numbers[3] : 1 }
          }
          const layers = []
          let node = el
          while (node !== null) {
            const bg = getComputedStyle(node).backgroundColor
            if (bg !== '' && bg !== 'transparent') {
              const parsed = parseColor(bg)
              if (parsed.a > 0) layers.push(bg)
              if (parsed.a >= 0.999) break
            }
            node = node.parentElement
          }
          let blended = { r: 255, g: 255, b: 255, a: 1 }
          for (const layer of layers.reverse()) {
            const { r, g, b, a } = parseColor(layer)
            blended = {
              r: r * a + blended.r * (1 - a),
              g: g * a + blended.g * (1 - a),
              b: b * a + blended.b * (1 - a),
              a: 1,
            }
          }
          const background = `rgb(${Math.round(blended.r)}, ${Math.round(blended.g)}, ${Math.round(blended.b)})`
          return { color: style.color, background, size: style.fontSize, weight: style.fontWeight }
        }
        return {
          title: read('.srpop-title'),
          currentLabel: read('.srpop-current-label'),
          currentVal: read('.srpop-current-val'),
          modeTitle: read('.srpop-mode-title'),
          modeDesc: read('.srpop-mode-desc'),
        }
      })
      for (const [name, sample] of Object.entries(samples)) {
        if (sample === null) continue
        const value = contrast(sample.color, sample.background)
        const large = parseFloat(sample.size) >= 18.66 || (parseFloat(sample.size) >= 14 && Number(sample.weight) >= 700)
        const need = large ? 3 : 4.5
        assert.ok(value >= need,
          `${mode}/${width} ${name} 对比度不足: ${value.toFixed(2)} < ${need}（fg=${sample.color} bg=${sample.background}）`)
      }

      report.geometry.push({ mode, width, ...geometry })
      const file = `${output}/${mode}-${width}.png`
      await page.screenshot({ path: file })
      report.screenshots.push(file)
    }
  }

  await page.setViewportSize({ width: 900, height: 760 })
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-ds-dark-theme')
    document.getElementById('theme-override')?.remove()
  })
  await page.waitForTimeout(140)

  // 点击「指定模型…」：进入二级选择页，绝不触发保存
  savedPayloads.length = 0
  await page.locator('.srpop-mode', { hasText: '指定模型…' }).click()
  await page.waitForTimeout(150)
  assert.equal(savedPayloads.length, 0, '点击「指定模型…」只应展开二级页，绝不应保存')
  assert.ok(await page.locator('.srpop-back').isVisible(), '二级页应显示返回按钮')
  assert.ok(await page.locator('.srpop-item').count() >= 2, '二级页应列出可用模型')
  report.checks.push('点击「指定模型…」仅进入二级选择页，无自动保存')

  // 二级选择页中点模型即生效：提交 custom + 该模型的默认思考档位
  savedPayloads.length = 0
  await page.locator('.srpop-item', { hasText: 'Acme Deep Think' }).click()
  await page.getByText('已保存：acme-research / acme-deep', { exact: false }).waitFor()
  const picked = savedPayloads.at(-1)
  assert.equal(picked.mode, 'custom')
  assert.equal(picked.override.provider, 'acme-research')
  assert.equal(picked.override.model, 'acme-deep')
  report.checks.push(`点模型即生效：${JSON.stringify(picked.override)}`)

  /*
   * 思考档位只在「当前选中的模型声明了多个档位」时出现。
   * 上一步选的 Acme Deep Think 没有 reasoning 元数据，因此先切回有档位的模型。
   */
  savedPayloads.length = 0
  await page.locator('.srpop-item', { hasText: 'Acme Coder 2' }).click()
  await page.waitForTimeout(400)
  assert.ok(await page.locator('.srpop-effort').count() >= 2, '选中带推理档位的模型后应出现思考档位')
  savedPayloads.length = 0
  await page.locator('.srpop-effort', { hasText: '高' }).click()
  await page.waitForTimeout(380)
  assert.equal(savedPayloads.at(-1).override.reasoningEffort, 'high')
  report.checks.push('思考档位点击即提交')

  /*
   * 验证手动输入模型：
   * 需点击 "+ 手动输入模型"，填写 Provider 与 Model，提交后保存为 custom
   */
  await page.locator('.srpop-link', { hasText: '手动输入模型' }).click()
  await page.waitForTimeout(150)
  assert.equal(await page.locator('.srpop-input').count(), 3, '搜索框 + 两个输入字段，共 3 个 input')
  await page.locator('#srpop-manual-provider-input').fill('my-gateway')
  await page.locator('#srpop-manual-model-input').fill('my-model-x')
  savedPayloads.length = 0
  await page.getByRole('button', { name: '保存并应用' }).click()
  await page.getByText('已保存手动输入模型 my-gateway / my-model-x', { exact: false }).waitFor()
  assert.equal(savedPayloads.at(-1).mode, 'custom')
  assert.equal(savedPayloads.at(-1).override.provider, 'my-gateway')
  assert.equal(savedPayloads.at(-1).override.model, 'my-model-x')
  // 目录里没有这条时，仍需单独显示当前值
  assert.ok((await page.locator('.srpop-manual-current').textContent()).includes('my-gateway'))
  report.checks.push('手动输入模型：填 provider / model 并正确提交')

  // 返回首页
  await page.locator('.srpop-back').click()
  await page.waitForTimeout(150)

  // 选项：跟随全局策略
  savedPayloads.length = 0
  await page.locator('.srpop-mode', { hasText: '跟随全局策略' }).click()
  await page.getByText('已切换为跟随全局策略', { exact: false }).waitFor()
  assert.equal(savedPayloads.at(-1).mode, 'follow')
  assert.equal(savedPayloads.at(-1).override, null)
  report.checks.push('跟随全局策略提交 { mode: "follow", override: null }')

  // 选项：继承主代理
  savedPayloads.length = 0
  await page.locator('.srpop-mode', { hasText: '继承主代理' }).click()
  await page.getByText('已设置为强制继承主代理模型', { exact: false }).waitFor()
  assert.equal(savedPayloads.at(-1).mode, 'inherit')
  assert.equal(savedPayloads.at(-1).override, null)
  report.checks.push('继承主代理提交 { mode: "inherit", override: null }')

  // 保存被拒绝：显示错误、不显示成功
  rejectSave = true
  await page.locator('.srpop-mode', { hasText: '指定模型…' }).click()
  await page.waitForTimeout(150)
  await page.locator('.srpop-item').first().click()
  await page.getByRole('alert').filter({ hasText: '宿主拒绝了这次保存' }).waitFor()
  assert.equal(await page.getByText('已保存：', { exact: false }).count(), 0, '失败时不应显示成功提示')
  report.checks.push('保存失败显示错误且不显示成功')
  const errorShot = `${output}/error.png`
  await page.screenshot({ path: errorShot })
  report.screenshots.push(errorShot)
  rejectSave = false

  // 返回首页关闭浮层前清理
  await page.locator('.srpop-back').click()

  // 空目录：进入二级页给出可读空态
  snapshot = baseSnapshot({ catalog: [] })
  await page.evaluate(() => {
    window.__SR_RESET__()
    window.__SR_MOUNT_CHIP__('chip-mount')
    window.__SR_MOUNT_OVERLAY__('overlay-mount')
  })
  await page.waitForTimeout(240)
  await page.locator('#chip-mount button.sr-chip').click()
  await page.locator('.sr-popover-portal').waitFor()
  await page.locator('.srpop-mode', { hasText: '指定模型…' }).click()
  await page.locator('.srpop-empty').waitFor()
  assert.ok((await page.locator('.srpop-empty').textContent()).includes('模型目录'))
  report.checks.push('空目录时给出可读空态')
  const emptyShot = `${output}/empty-catalog.png`
  await page.screenshot({ path: emptyShot })
  report.screenshots.push(emptyShot)

  // 超长路径与长模型名不撑破
  snapshot = baseSnapshot({
    directory: '/Users/you/Code/' + 'very-long-segment/'.repeat(8),
    catalog: [{
      id: 'acme-provider-with-a-really-long-identifier',
      name: 'Acme Provider With An Extremely Long Display Name',
      models: [{ id: 'acme-model-with-an-extremely-long-name-v2-preview', name: 'Acme Model With An Extremely Long Name V2 Preview' }],
    }],
  })
  await page.evaluate(() => {
    window.__SR_RESET__()
    window.__SR_MOUNT_CHIP__('chip-mount')
    window.__SR_MOUNT_OVERLAY__('overlay-mount')
  })
  await page.waitForTimeout(240)
  await page.locator('#chip-mount button.sr-chip').click()
  await page.locator('.sr-popover-portal').waitFor()
  await page.waitForTimeout(240)
  const long = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewport: innerWidth,
    popoverRight: Math.round(document.querySelector('.sr-popover-portal').getBoundingClientRect().right),
  }))
  assert.ok(long.documentWidth <= long.viewport, `长文本导致横向溢出: ${JSON.stringify(long)}`)
  assert.ok(long.popoverRight <= long.viewport, `长文本把浮层撑出视口: ${JSON.stringify(long)}`)
  report.checks.push('超长路径与模型名不撑破布局')
  const longShot = `${output}/long-content.png`
  await page.screenshot({ path: longShot })
  report.screenshots.push(longShot)

  assert.deepEqual(errors, [], `页面报错: ${errors.join('; ')}`)
  report.checks.push('无未捕获页面错误')
  await context.close()
  context = null

  // 键盘可达性单独用干净页面验证（避免多次挂载留下多个实例）
  freshContext = await browser.newContext({ viewport: { width: 900, height: 760 } })
  const freshErrors = []
  await freshContext.route('http://popover.test/**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname === '/api/subagent-routes/session') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(baseSnapshot()) })
    }
    if (url.pathname === '/fixture') return route.fulfill({ contentType: 'text/html', body: fixtureHtml })
    if (url.pathname === '/lib/client.js') {
      return route.fulfill({ contentType: 'application/javascript', body: await readFile('lib/client.js', 'utf8') })
    }
    const result = await server.transformRequest(url.pathname + url.search)
    return route.fulfill({ contentType: 'application/javascript', body: result.code })
  })
  const fresh = await freshContext.newPage()
  fresh.on('pageerror', error => freshErrors.push(String(error)))
  await fresh.goto('http://popover.test/fixture')
  await fresh.addStyleTag({ content: composerCss })
  await fresh.evaluate(() => {
    window.__SR_MOUNT_CHIP__('chip-mount')
    window.__SR_MOUNT_OVERLAY__('overlay-mount')
  })
  await fresh.waitForTimeout(300)
  const chipFresh = fresh.locator('#chip-mount button.sr-chip')
  await chipFresh.click()
  await fresh.locator('.sr-popover-portal').waitFor()
  await fresh.waitForTimeout(340)

  const focusInfo = await fresh.evaluate(() => {
    const node = document.querySelector('.sr-popover-portal')
    const active = document.activeElement
    return { inside: node !== null && node.contains(active), className: String(active?.className ?? '') }
  })
  assert.ok(focusInfo.inside, '打开后焦点应落在浮层内部')
  assert.ok(!focusInfo.className.includes('srpop-close'),
    `焦点不应落在关闭按钮上，实际: ${JSON.stringify(focusInfo)}`)
  assert.ok(focusInfo.className.includes('srpop-mode'),
    `焦点应落在模式按钮上，实际: ${JSON.stringify(focusInfo)}`)
  report.checks.push('打开后焦点落在模式按钮而非关闭按钮')

  await fresh.keyboard.press('Escape')
  await fresh.waitForTimeout(260)
  assert.equal(await fresh.locator('.sr-popover-portal').count(), 0, 'Escape 应关闭浮层')
  const focusedClass = await fresh.evaluate(() => String(document.activeElement?.className ?? ''))
  assert.ok(focusedClass.includes('sr-chip'), `关闭后焦点应回到药丸，实际: ${focusedClass}`)
  report.checks.push('Escape 关闭并把焦点还原到药丸')

  await chipFresh.click()
  await fresh.locator('.sr-popover-portal').waitFor()
  await fresh.mouse.click(12, 12)
  await fresh.waitForTimeout(260)
  assert.equal(await fresh.locator('.sr-popover-portal').count(), 0, '点击外部应关闭浮层')
  report.checks.push('点击外部关闭浮层')

  const openShot = `${output}/opened.png`
  await chipFresh.click()
  await fresh.locator('.sr-popover-portal').waitFor()
  await fresh.waitForTimeout(260)
  await fresh.screenshot({ path: openShot })
  report.screenshots.push(openShot)

  /*
   * 专用场景：composer 位于视口中部。
   *
   * 这里上方空间有限，正是「刚打开盖住输入框、几秒后才跳到上面」的触发条件。
   * 贴底布局永远测不到该缺陷，必须单独布局验证。
   */
  const driftContext = await browser.newContext({ viewport: { width: 900, height: 760 } })
  const driftErrors = []
  await driftContext.route('http://popover.test/**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname === '/api/subagent-routes/session') {
      // 模拟真实数据延迟：让骨架先显示出来，再长成完整列表
      await new Promise(resolve => setTimeout(resolve, 900))
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(baseSnapshot()) })
    }
    if (url.pathname === '/fixture') return route.fulfill({ contentType: 'text/html', body: fixtureHtml })
    if (url.pathname === '/lib/client.js') {
      return route.fulfill({ contentType: 'application/javascript', body: await readFile('lib/client.js', 'utf8') })
    }
    const result = await server.transformRequest(url.pathname + url.search)
    return route.fulfill({ contentType: 'application/javascript', body: result.code })
  })
  const drift = await driftContext.newPage()
  drift.on('pageerror', error => driftErrors.push(String(error)))
  await drift.goto('http://popover.test/fixture')
  await drift.addStyleTag({ content: centeredComposerCss })
  await drift.evaluate(() => {
    window.__SR_MOUNT_CHIP__('chip-mount')
    window.__SR_MOUNT_OVERLAY__('overlay-mount')
  })
  await drift.waitForTimeout(300)
  await drift.locator('#chip-mount button.sr-chip').click()
  await drift.locator('.sr-popover-portal').waitFor()

  const driftSamples = []
  for (let index = 0; index < 18; index += 1) {
    const sample = await drift.evaluate(() => {
      const node = document.querySelector('.sr-popover-portal')
      if (node === null) return null
      const box = node.getBoundingClientRect()
      const composer = document.querySelector('#composer').getBoundingClientRect()
      /*
       * 是否压住输入框要按展开方向分别判断：
       * 向上展开要求底边在输入框之上，向下展开要求顶边在输入框之下。
       */
      const side = box.bottom <= composer.top + 1 ? 'above' : box.top >= composer.bottom - 1 ? 'below' : 'overlap'
      return {
        top: Math.round(box.top),
        bottom: Math.round(box.bottom),
        composerTop: Math.round(composer.top),
        side,
      }
    })
    if (sample !== null) driftSamples.push(sample)
    await drift.waitForTimeout(130)
  }
  assert.ok(driftSamples.length >= 12, `采样不足: ${driftSamples.length}`)
  const driftCovered = driftSamples.filter(sample => sample.side === 'overlap')
  assert.equal(driftCovered.length, 0, `浮层压住了输入框: ${JSON.stringify(driftCovered.slice(0, 3))}`)
  const driftSides = new Set(driftSamples.map(sample => sample.side))
  assert.equal(driftSides.size, 1,
    `浮层在打开过程中上下翻转了（先遮住再跳开），侧别序列: ${JSON.stringify([...driftSides])}`)
  /*
   * 覆盖边界说明：由于先用可用空间限高再定位，高度永远落在空间内，
   * `placePopup` 的自动翻转在本场景不会被走到；因此这里实际验证的是
   * 「内容变高后不跳位、不压住输入框」。方向锁定的正确性由
   * tests/client/popup-placement.spec.ts 的 lockSide 用例单元验证。
   */
  report.checks.push('内容变高时浮层不跳位、不压住输入框（composer 居中场景）')
  const driftShot = `${output}/no-drift-centered.png`
  await drift.screenshot({ path: driftShot })
  report.screenshots.push(driftShot)
  assert.deepEqual(driftErrors, [], `居中场景报错: ${driftErrors.join('; ')}`)
  await driftContext.close()

  assert.deepEqual(freshErrors, [], `键盘页报错: ${freshErrors.join('; ')}`)
  await freshContext.close()
  freshContext = null

  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ ok: true, checks: report.checks.length, screenshots: report.screenshots.length }, null, 2))
} finally {
  await context?.close()
  await freshContext?.close()
  await browser.close()
  await server.close()
}
