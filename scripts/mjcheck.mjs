// 用站点同款 MathJax TeX 输入渲染每个公式，报告 TeX 错误
import fs from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { mathjax } = require('mathjax-full/js/mathjax.js')
const { TeX } = require('mathjax-full/js/input/tex.js')
const { SVG } = require('mathjax-full/js/output/svg.js')
const { liteAdaptor } = require('mathjax-full/js/adaptors/liteAdaptor.js')
const { RegisterHTMLHandler } = require('mathjax-full/js/handlers/html.js')
const { AllPackages } = require('mathjax-full/js/input/tex/AllPackages.js')

const adaptor = liteAdaptor()
RegisterHTMLHandler(adaptor)
const tex = new TeX({
  packages: AllPackages.filter((p) => p !== 'require' && p !== 'autoload'),
  formatError: (jax, err) => { throw err },
})
const doc = mathjax.document('', { InputJax: tex, OutputJax: new SVG({ fontCache: 'none' }) })

const errs = []
let cur = ''
function chk(s) {
  try { doc.convert(s, { display: false }) } catch (e) { errs.push([cur, e.message, s.slice(0, 140)]) }
}

const FENCE = /```[\s\S]*?```/g
const CODE = /`[^`\n]*`/g
const BLOCK = /\$\$([\s\S]+?)\$\$/g
const INLINE = /(?<!\\)\$((?:\\.|[^$\\])+?)\$/g

for (const f of process.argv.slice(2)) {
  cur = f
  let s = fs.readFileSync(f, 'utf-8').replace(FENCE, '').replace(CODE, '')
  s = s.replace(BLOCK, (_, m) => { chk(m); return '' })
  for (const line of s.split('\n')) {
    for (const m of line.matchAll(INLINE)) chk(m[1])
  }
}

const by = {}
for (const [f, m, s] of errs) (by[f] ??= []).push(m + ' | ' + s)
for (const f in by) {
  console.log('==', f, by[f].length)
  by[f].slice(0, 8).forEach((x) => console.log('   ', x))
}
console.log('total errors', errs.length)
