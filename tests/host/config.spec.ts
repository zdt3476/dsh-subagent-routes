import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultRoutesFile, resolveConfig } from '../../src/host/config'
import { loadRouteTable } from '../../src/host/routes'

vi.mock('node:os', async importOriginal => ({
  ...await importOriginal<typeof import('node:os')>(),
  homedir: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(homedir).mockReturnValue('/home/tester')
  vi.stubEnv('DSH_HOME', undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('resolveConfig', () => {
  it('缺省配置使用用户目录并启用路由及预检', () => {
    expect(resolveConfig()).toEqual({
      routesFile: '/home/tester/.dsh/subagent-routes.yaml',
      enabled: true,
      preflight: true,
    })
  })

  it('空路径使用 DSH_HOME', () => {
    vi.stubEnv('DSH_HOME', '/custom/dsh')
    expect(defaultRoutesFile()).toBe('/custom/dsh/subagent-routes.yaml')
    expect(resolveConfig({ routesFile: '  ' }).routesFile).toBe(defaultRoutesFile())
  })

  it.each([
    ['~/.dsh/subagent-routes.yaml', '/home/tester/.dsh/subagent-routes.yaml'],
    [' ~ ', '/home/tester'],
    ['/custom/routes.yaml', '/custom/routes.yaml'],
    [' ./routes.yaml ', './routes.yaml'],
    ['~other/routes.yaml', '~other/routes.yaml'],
  ])('解析路径 %s', (routesFile, expected) => {
    expect(resolveConfig({ routesFile }).routesFile).toBe(expected)
  })

  it('保留显式关闭的开关', () => {
    expect(resolveConfig({ enabled: false, preflight: false })).toMatchObject({
      enabled: false,
      preflight: false,
    })
  })

  it('按文档的 ~/ 配置实际读取路由文件', () => {
    const home = mkdtempSync(join(tmpdir(), 'subagent-routes-config-'))
    vi.mocked(homedir).mockReturnValue(home)
    try {
      writeFileSync(join(home, 'routes.yaml'), 'default:\n  provider: p\n  model: m\n')
      const config = resolveConfig({ routesFile: '~/routes.yaml' })
      expect(loadRouteTable(config.routesFile).fallback).toEqual({ provider: 'p', model: 'm' })
    } finally {
      rmSync(home, { recursive: true, force: true })
    }
  })
})
