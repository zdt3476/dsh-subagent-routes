import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'tsdown'

const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))

/**
 * 构建横幅只保留与构建环境无关的静态信息（名称 / 版本 / 描述 / 许可证）。
 * 时间戳与 git 状态会让同一份源码产生不同产物，破坏可复现构建，
 * 也会让 CI 的「lib 与源码一致」闸门永远无法通过；版本与出处由 package.json 和 git 标签承担。
 */
function artifactBanner(): string {
  const lines = [
    ` * ${pkg.name} v${pkg.version}`,
    ` * ${pkg.description}`,
    ` * @license ${pkg.license}`,
  ]
  return ['/**', ...lines, ' */', ''].join('\n')
}

const productionDeps = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
  ...Object.keys(pkg.optionalDependencies ?? {}),
])
const escapeSpecifier = (name: string): string => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const productionPatterns = [...productionDeps].map(name => new RegExp(`^${escapeSpecifier(name)}(/|$)`))
const isProductionDependency = (specifier: string): boolean =>
  productionPatterns.some(pattern => pattern.test(specifier))

const OUTPUT_COMMENTS = { legal: true, annotation: false, jsdoc: false } as const

export default defineConfig([
  {
    name: pkg.name,
    entry: { index: 'src/host/index.ts' },
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    minify: true,
    sourcemap: true,
    dts: true,
    clean: true,
    banner: () => ({ js: artifactBanner() }),
    outputOptions: { comments: OUTPUT_COMMENTS },
    deps: {
      neverBundle: isProductionDependency,
    },
  },
  {
    name: `${pkg.name}/client`,
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: ['cjs'],
    platform: 'browser',
    inputOptions: { platform: 'browser' },
    target: 'es2024',
    minify: true,
    sourcemap: true,
    dts: false,
    clean: false,
    deps: { neverBundle: isProductionDependency },
    outputOptions: {
      entryFileNames: 'client.js',
      comments: OUTPUT_COMMENTS,
      banner: `${artifactBanner()}window.__ModuleLoader__.load({ id: ${JSON.stringify(pkg.name)}, factory: (require) => {`,
      intro: 'var module = { exports: {} }; var exports = module.exports;',
      footer: 'return module.exports; } });',
    },
  },
])
