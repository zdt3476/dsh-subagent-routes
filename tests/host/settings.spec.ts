import { chmodSync, lstatSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs', async importOriginal => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return { ...actual, writeFileSync: vi.fn(actual.writeFileSync), chmodSync: vi.fn(actual.chmodSync), statSync: vi.fn(actual.statSync) }
})
import { readTableSettings, saveTableSettings } from '../../src/host/settings'

let directory: string
let file: string

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'subagent-routes-settings-'))
  file = join(directory, 'routes.yaml')
})

afterEach(() => {
  vi.mocked(writeFileSync).mockReset()
  vi.mocked(chmodSync).mockReset()
  vi.mocked(statSync).mockReset()
  rmSync(directory, { recursive: true, force: true })
})

const YAML = '# 保留注释\ndefault:\n  provider: p\n  model: m\n'

describe('路由表设置', () => {
  it('未创建文件时读取空文本，保存后即可被原有解析器使用', () => {
    const initial = readTableSettings(file)
    expect(initial).toMatchObject({ file, exists: false, text: '' })
    expect(initial.validationError).toBeUndefined()
    const saved = saveTableSettings(file, { text: YAML, revision: initial.revision })
    expect(saved).toMatchObject({ exists: true, text: YAML })
    expect(saved.validationError).toBeUndefined()
    expect(readFileSync(file, 'utf8')).toBe(YAML)
    expect(statSync(file).mode & 0o777).toBe(0o600)
    expect(saved.revision).not.toBe(initial.revision)
  })

  it('读取损坏的表时保留原文和校验错误，允许修正保存', () => {
    writeFileSync(file, 'default:\n  provider: p\n  model: m\n  typo: high\n')
    const initial = readTableSettings(file)
    expect(initial.validationError).toContain('未知字段')
    expect(initial.text).toContain('typo: high')
    expect(saveTableSettings(file, { text: YAML, revision: initial.revision }).validationError).toBeUndefined()
  })

  it('非法 YAML 不覆盖现有文件', () => {
    writeFileSync(file, YAML)
    const initial = readTableSettings(file)
    expect(() => saveTableSettings(file, { text: 'routes: [', revision: initial.revision })).toThrow(/合法 YAML/)
    expect(readFileSync(file, 'utf8')).toBe(YAML)
  })

  it('外部编辑或另一个标签页保存后拒绝旧版本覆盖', () => {
    writeFileSync(file, YAML)
    const initial = readTableSettings(file)
    const external = YAML.replace('model: m', 'model: changed')
    writeFileSync(file, external)
    expect(() => saveTableSettings(file, { text: '', revision: initial.revision })).toThrow(/已被修改/)
    expect(readFileSync(file, 'utf8')).toBe(external)
  })

  it('区分未创建的文件与外部新建的空文件', () => {
    const initial = readTableSettings(file)
    writeFileSync(file, '')
    expect(() => saveTableSettings(file, { text: YAML, revision: initial.revision })).toThrow(/已被修改/)
  })

  it('已有文件保存后保留权限', () => {
    writeFileSync(file, YAML, { mode: 0o640 })
    const initial = readTableSettings(file)
    saveTableSettings(file, { text: `${YAML}\n`, revision: initial.revision })
    expect(statSync(file).mode & 0o777).toBe(0o640)
  })

  it.each([null, { text: 1, revision: 'x' }, { text: YAML }, { text: YAML, revision: 'x', file: '/other' }])(
    '拒绝非法保存参数 %j', payload => {
      expect(() => saveTableSettings(file, payload)).toThrow(/参数/)
    },
  )

  it('拒绝超大的路由表', () => {
    const initial = readTableSettings(file)
    expect(() => saveTableSettings(file, { text: '#'.repeat(256 * 1024 + 1), revision: initial.revision })).toThrow(/大小/)
  })

  it('悬空符号链接也不能被保存替换', () => {
    symlinkSync(join(directory, 'missing-target.yaml'), file)
    const initial = readTableSettings(file)
    expect(() => saveTableSettings(file, { text: YAML, revision: initial.revision })).toThrow(/符号链接/)
    expect(lstatSync(file).isSymbolicLink()).toBe(true)
  })

  it('写入临时文件期间发生外部修改时拒绝覆盖', async () => {
    const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
    writeFileSync(file, YAML)
    const initial = readTableSettings(file)
    const external = YAML.replace('model: m', 'model: external')
    vi.mocked(chmodSync).mockImplementationOnce((...args) => {
      actual.chmodSync(...args)
      actual.writeFileSync(file, external)
    })
    expect(() => saveTableSettings(file, { text: '', revision: initial.revision })).toThrow(/已被修改/)
    expect(readFileSync(file, 'utf8')).toBe(external)
    expect(readdirSync(directory)).toEqual(['routes.yaml'])
  })

  it('临时文件部分写入失败后也清理残留', async () => {
    const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
    const initial = readTableSettings(file)
    vi.mocked(writeFileSync).mockImplementationOnce((target, _data, options) => {
      actual.writeFileSync(target, 'partial', options)
      throw Object.assign(new Error('disk full'), { code: 'ENOSPC' })
    })
    expect(() => saveTableSettings(file, { text: YAML, revision: initial.revision })).toThrow('disk full')
    expect(readdirSync(directory)).toEqual([])
  })

  it('读取前拒绝特殊文件，避免 FIFO 或设备阻塞宿主', () => {
    vi.mocked(statSync).mockReturnValueOnce({ size: 0, isFile: () => false } as never)
    expect(() => readTableSettings(file)).toThrow(/普通文件/)
  })

  it('不替换符号链接或覆盖其目标', () => {
    const target = join(directory, 'target.yaml')
    writeFileSync(target, YAML)
    symlinkSync(target, file)
    const initial = readTableSettings(file)
    expect(() => saveTableSettings(file, { text: '', revision: initial.revision })).toThrow(/符号链接/)
    expect(readFileSync(target, 'utf8')).toBe(YAML)
  })

  it('读取有效表时输出结构化 parsed 结果', () => {
    writeFileSync(file, 'default:\n  provider: acme\n  model: gemini\nroutes:\n  - path: /tmp\n    reasoningEffort: high\n')
    const res = readTableSettings(file)
    expect(res.parsed).toBeDefined()
    expect(res.parsed?.fallback).toEqual({ provider: 'acme', model: 'gemini' })
    expect(res.parsed?.routes).toEqual([{ path: '/tmp', reasoningEffort: 'high' }])
  })
})
