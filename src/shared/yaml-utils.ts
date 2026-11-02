export interface RouteSpec {
  provider?: string
  model?: string
  reasoningEffort?: string
}

export interface WorkspaceRoute extends RouteSpec {
  path: string
}

export interface ParsedRouteTable {
  fallback?: RouteSpec
  routes: WorkspaceRoute[]
}

/**
 * 将结构化路由数据序列化为排版规范、带友好注释的 YAML 文本。
 */
export function serializeRouteTable(fallback?: RouteSpec, routes: WorkspaceRoute[] = []): string {
  const lines: string[] = [
    '# 子代理工作区路由表',
    '# 最长前缀匹配优先；未匹配项目回落至全局兜底配置（若有）。',
  ]

  const hasFallback = fallback && (fallback.provider || fallback.model || fallback.reasoningEffort)
  if (hasFallback) {
    lines.push('')
    lines.push('# 全局兜底配置（未匹配项目时使用）')
    lines.push('default:')
    if (fallback.provider) lines.push(`  provider: ${fallback.provider}`)
    if (fallback.model) lines.push(`  model: ${fallback.model}`)
    if (fallback.reasoningEffort) lines.push(`  reasoningEffort: ${fallback.reasoningEffort}`)
  }

  if (routes.length > 0) {
    lines.push('')
    lines.push('# 项目专属路由规则')
    lines.push('routes:')
    for (const r of routes) {
      lines.push(`  - path: ${r.path}`)
      if (r.provider) lines.push(`    provider: ${r.provider}`)
      if (r.model) lines.push(`    model: ${r.model}`)
      if (r.reasoningEffort) lines.push(`    reasoningEffort: ${r.reasoningEffort}`)
    }
  } else if (!hasFallback) {
    lines.push('')
    lines.push('routes: []')
  }

  lines.push('')
  return lines.join('\n')
}

/**
 * 轻量且安全的 YAML 提取解析器（在纯客户端且无外部 yaml 库环境中使用）。
 * 支持标准的 default: 与 routes: 列表结构。
 */
export function parseSimpleRouteYaml(text: string): { data?: ParsedRouteTable; error?: string } {
  const trimmed = text.trim()
  if (!trimmed) {
    return { data: { fallback: undefined, routes: [] } }
  }

  const lines = trimmed.split(/\r?\n/)
  let inDefault = false
  let inRoutes = false
  const fallback: RouteSpec = {}
  const routes: WorkspaceRoute[] = []
  let currentRoute: Partial<WorkspaceRoute> | null = null

  const commitCurrentRoute = () => {
    if (currentRoute && currentRoute.path) {
      routes.push({
        path: currentRoute.path,
        provider: currentRoute.provider,
        model: currentRoute.model,
        reasoningEffort: currentRoute.reasoningEffort,
      })
    }
    currentRoute = null
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    // 去除行尾注释（如果不是在字符串内）
    const lineWithoutComment = rawLine.replace(/#.*$/, '').trimEnd()
    if (!lineWithoutComment.trim()) continue

    const indent = rawLine.search(/\S/)
    const trimmedLine = lineWithoutComment.trim()

    // 顶级段落
    if (indent === 0) {
      commitCurrentRoute()
      if (trimmedLine.startsWith('default:')) {
        inDefault = true
        inRoutes = false
        continue
      }
      if (trimmedLine.startsWith('routes:')) {
        inDefault = false
        inRoutes = true
        continue
      }
      // 其他未知顶级键暂且忽略
      inDefault = false
      inRoutes = false
      continue
    }

    if (inDefault && indent > 0) {
      const match = trimmedLine.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.+)$/)
      if (match) {
        const [, key, val] = match
        const cleanedVal = val.trim().replace(/^['"](.*)['"]$/, '$1')
        if (key === 'provider') fallback.provider = cleanedVal
        else if (key === 'model') fallback.model = cleanedVal
        else if (key === 'reasoningEffort') fallback.reasoningEffort = cleanedVal
      }
      continue
    }

    if (inRoutes && indent > 0) {
      if (trimmedLine.startsWith('- ')) {
        commitCurrentRoute()
        currentRoute = {}
        const rest = trimmedLine.slice(2).trim()
        if (rest) {
          const match = rest.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.+)$/)
          if (match) {
            const [, key, val] = match
            const cleanedVal = val.trim().replace(/^['"](.*)['"]$/, '$1')
            if (key === 'path') currentRoute.path = cleanedVal
            else if (key === 'provider') currentRoute.provider = cleanedVal
            else if (key === 'model') currentRoute.model = cleanedVal
            else if (key === 'reasoningEffort') currentRoute.reasoningEffort = cleanedVal
          }
        }
        continue
      }

      if (currentRoute) {
        const match = trimmedLine.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.+)$/)
        if (match) {
          const [, key, val] = match
          const cleanedVal = val.trim().replace(/^['"](.*)['"]$/, '$1')
          if (key === 'path') currentRoute.path = cleanedVal
          else if (key === 'provider') currentRoute.provider = cleanedVal
          else if (key === 'model') currentRoute.model = cleanedVal
          else if (key === 'reasoningEffort') currentRoute.reasoningEffort = cleanedVal
        }
      }
    }
  }

  commitCurrentRoute()

  const hasFallback = fallback.provider || fallback.model || fallback.reasoningEffort
  return {
    data: {
      fallback: hasFallback ? fallback : undefined,
      routes,
    },
  }
}
