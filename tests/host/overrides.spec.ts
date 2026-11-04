import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { MAX_SESSIONS, OverrideStore } from '../../src/host/overrides'

const dirs: string[] = []

function store(): { store: OverrideStore; file: string } {
  const dir = mkdtempSync(join(tmpdir(), 'subagent-routes-overrides-'))
  dirs.push(dir)
  const file = join(dir, 'overrides.json')
  return { store: new OverrideStore(file), file }
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('OverrideStore', () => {
  it('文件不存在时读到空表', () => {
    const { store: s } = store()
    expect(s.read()).toEqual({})
    expect(s.get('s1')).toBeUndefined()
  })

  it('写入后能读回', () => {
    const { store: s } = store()
    s.set('s1', { mode: 'custom', provider: 'p', model: 'm', reasoningEffort: 'high' })
    expect(s.get('s1')).toEqual({ mode: 'custom', provider: 'p', model: 'm', reasoningEffort: 'high' })
  })

  it('清除单个会话不影响其他会话', () => {
    const { store: s } = store()
    s.set('s1', { mode: 'custom', provider: 'p', model: 'm' })
    s.set('s2', { mode: 'custom', reasoningEffort: 'low' })
    s.set('s1', undefined)
    expect(s.get('s1')).toBeUndefined()
    expect(s.get('s2')).toMatchObject({ mode: 'custom', reasoningEffort: 'low' })
  })

  it('落盘为原子替换后的合法 JSON', () => {
    const { store: s, file } = store()
    s.set('s1', { mode: 'custom', provider: 'p', model: 'm' })
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as { version: number; sessions: Record<string, unknown> }
    expect(parsed.version).toBe(2)
    expect(Object.keys(parsed.sessions)).toEqual(['s1'])
  })

  it('文件损坏时读到空表而不是抛错', () => {
    const { store: s, file } = store()
    writeFileSync(file, '{ not json')
    expect(s.read()).toEqual({})
  })

  it('丢弃半套 provider/model 记录，保留其余记录', () => {
    const { store: s, file } = store()
    writeFileSync(
      file,
      JSON.stringify({
        version: 1,
        sessions: {
          bad: { provider: 'p', updatedAt: 1 },
          good: { provider: 'p', model: 'm', updatedAt: 2 },
        },
      }),
    )
    expect(Object.keys(s.read())).toEqual(['good'])
  })

  it('丢弃完全没有内容的记录', () => {
    const { store: s, file } = store()
    writeFileSync(file, JSON.stringify({ version: 1, sessions: { empty: { updatedAt: 1 } } }))
    expect(s.read()).toEqual({})
  })

  it('超过会话上限时保留最新的那些', () => {
    const { store: s } = store()
    for (let index = 0; index < MAX_SESSIONS + 5; index += 1) {
      s.set(`s${index}`, { mode: 'custom', provider: 'p', model: 'm' })
    }
    const table = s.read()
    expect(Object.keys(table)).toHaveLength(MAX_SESSIONS)
    // 最后写入的一定在表里，最早写入的一定被淘汰。
    expect(table[`s${MAX_SESSIONS + 4}`]).toBeDefined()
    expect(table.s0).toBeUndefined()
  })

  it('旧版本没有 mode 的记录按「本会话指定」迁移', () => {
    const { store: s, file } = store()
    writeFileSync(
      file,
      JSON.stringify({ version: 1, sessions: { legacy: { provider: 'p', model: 'm', updatedAt: 5 } } }),
    )
    expect(s.get('legacy')).toEqual({ mode: 'custom', provider: 'p', model: 'm' })
  })

  it('inherit 记录往返不丢模式', () => {
    const { store: s } = store()
    s.set('s1', { mode: 'inherit' })
    expect(s.get('s1')).toEqual({ mode: 'inherit' })
  })

  it('丢弃未知 mode 的记录，保留其余记录', () => {
    const { store: s, file } = store()
    writeFileSync(
      file,
      JSON.stringify({
        version: 2,
        sessions: {
          bad: { mode: 'nope', provider: 'p', model: 'm', updatedAt: 1 },
          good: { mode: 'inherit', updatedAt: 2 },
        },
      }),
    )
    expect(Object.keys(s.read())).toEqual(['good'])
  })

  it('结构不对（sessions 不是对象）时读到空表', () => {
    const { store: s, file } = store()
    writeFileSync(file, JSON.stringify({ version: 1, sessions: [] }))
    expect(s.read()).toEqual({})
  })
})
