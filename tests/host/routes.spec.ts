import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  isUnder,
  loadRouteTable,
  matchRoute,
  normalizePath,
  parseRouteTable,
  RouteTableError,
} from '../../src/host/routes'

const HOME = '/Users/tester'

describe('parseRouteTable', () => {
  it('把空文本视为空表', () => {
    expect(parseRouteTable('', HOME)).toEqual({ fallback: undefined, routes: [] })
    expect(parseRouteTable('   \n', HOME)).toEqual({ fallback: undefined, routes: [] })
  })

  it('解析 routes 与 default 两段', () => {
    const table = parseRouteTable(
      [
        'default:',
        '  provider: acme',
        '  model: acme-fast',
        '  reasoningEffort: low',
        'routes:',
        '  - path: ~/Code/app',
        '    provider: acme-gateway',
        '    model: acme-large',
        '    reasoningEffort: max',
      ].join('\n'),
      HOME,
    )
    expect(table.fallback).toEqual({
      provider: 'acme',
      model: 'acme-fast',
      reasoningEffort: 'low',
    })
    expect(table.routes).toEqual([
      { path: `${HOME}/Code/app`, provider: 'acme-gateway', model: 'acme-large', reasoningEffort: 'max' },
    ])
  })

  it('允许只给 provider/model 或只给 reasoningEffort', () => {
    expect(parseRouteTable('routes:\n  - path: /a\n    model: m\n    provider: p', HOME).routes[0]).toEqual({
      path: '/a',
      provider: 'p',
      model: 'm',
    })
    expect(parseRouteTable('routes:\n  - path: /a\n    reasoningEffort: high', HOME).routes[0]).toEqual({
      path: '/a',
      reasoningEffort: 'high',
    })
  })

  it('拒绝 provider 与 model 单独出现', () => {
    expect(() => parseRouteTable('routes:\n  - path: /a\n    provider: p', HOME)).toThrow(RouteTableError)
    expect(() => parseRouteTable('routes:\n  - path: /a\n    model: m', HOME)).toThrow(RouteTableError)
  })

  it('拒绝空条目与未知字段', () => {
    expect(() => parseRouteTable('routes:\n  - path: /a', HOME)).toThrow(/至少要指定/)
    expect(() => parseRouteTable('routes:\n  - path: /a\n    provider: p\n    model: m\n    nope: 1', HOME)).toThrow(
      /未知字段/,
    )
    expect(() => parseRouteTable('extra: 1', HOME)).toThrow(/未知字段/)
  })

  it.each(['reasoningEfort', 'path'])('拒绝 default 中的未知字段 %s', key => {
    expect(() => parseRouteTable(`default:\n  provider: p\n  model: m\n  ${key}: high`, HOME)).toThrow(
      new RegExp(`default.*未知字段.*${key}`),
    )
  })

  it('拒绝重复目录与非法结构', () => {
    const duplicated = ['routes:', '  - path: /a', '    provider: p', '    model: m', '  - path: /a', '    provider: q', '    model: n'].join('\n')
    expect(() => parseRouteTable(duplicated, HOME)).toThrow(/重复声明/)
    expect(() => parseRouteTable('routes: 3', HOME)).toThrow(/必须是数组/)
    expect(() => parseRouteTable('- a\n- b', HOME)).toThrow(/必须是对象/)
  })

  it('拒绝相对路径', () => {
    expect(() => parseRouteTable('routes:\n  - path: relative/dir\n    provider: p\n    model: m', HOME)).toThrow(
      /绝对路径/,
    )
  })

  it('拒绝坏 YAML', () => {
    expect(() => parseRouteTable('routes: [', HOME)).toThrow(/不是合法 YAML/)
  })
})

describe('normalizePath', () => {
  it('展开 ~ 并去掉尾部分隔符', () => {
    expect(normalizePath('~/Code/app/', HOME)).toBe(`${HOME}/Code/app`)
    expect(normalizePath('~', HOME)).toBe(HOME)
    expect(normalizePath('/tmp/../tmp/x', HOME)).toBe('/tmp/x')
  })
})

describe('isUnder', () => {
  it('按路径边界匹配，不把相邻目录算作子目录', () => {
    expect(isUnder('/a/b', '/a/b')).toBe(true)
    expect(isUnder('/a/b/c', '/a/b')).toBe(true)
    expect(isUnder('/a/bc', '/a/b')).toBe(false)
    expect(isUnder('/a', '/a/b')).toBe(false)
  })
})

describe('matchRoute', () => {
  const table = parseRouteTable(
    [
      'default:',
      '  provider: d',
      '  model: dm',
      'routes:',
      '  - path: /repo',
      '    provider: p1',
      '    model: m1',
      '  - path: /repo/legacy',
      '    provider: p2',
      '    model: m2',
    ].join('\n'),
    HOME,
  )

  it('最长前缀优先', () => {
    expect(matchRoute(table, '/repo/legacy/src')).toMatchObject({ provider: 'p2' })
    expect(matchRoute(table, '/repo/pkg')).toMatchObject({ provider: 'p1' })
  })

  it('没有匹配时回落到 default', () => {
    expect(matchRoute(table, '/elsewhere')).toMatchObject({ provider: 'd' })
  })

  it('空表返回 undefined', () => {
    expect(matchRoute({ fallback: undefined, routes: [] }, '/anywhere')).toBeUndefined()
  })
})

describe('loadRouteTable', () => {
  it('文件不存在时返回空表而不是抛错', () => {
    const dir = mkdtempSync(join(tmpdir(), 'subagent-routes-'))
    try {
      expect(loadRouteTable(join(dir, 'missing.yaml'), HOME)).toEqual({ fallback: undefined, routes: [] })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('读取真实文件', () => {
    const dir = mkdtempSync(join(tmpdir(), 'subagent-routes-'))
    const file = join(dir, 'routes.yaml')
    try {
      writeFileSync(file, 'routes:\n  - path: /repo\n    provider: p1\n    model: m1\n')
      expect(loadRouteTable(file, HOME).routes).toHaveLength(1)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
