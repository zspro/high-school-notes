// .vitepress/config.mts
import { defineConfig } from 'vitepress'
import { teekConfig } from "./teekConfig.mts";
import { sortByVolume } from "./volumeOrder.mts";
import fs from 'node:fs'
import path from 'node:path'
import { mathjax } from 'mathjax-full/js/mathjax.js'
import { TeX } from 'mathjax-full/js/input/tex.js'
import { SVG } from 'mathjax-full/js/output/svg.js'
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js'
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js'
import { AssistiveMmlHandler } from 'mathjax-full/js/a11y/assistive-mml.js'
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js'

// ── 自建 MathJax 管线(fontCache:'global' 跨公式共享字形,体积比内置的 'none' 小约 37%)──
// adaptor / tex 全站复用;SVG 输出实例每页新建(global 缓存需按页隔离)。
const mjAdaptor = liteAdaptor()
AssistiveMmlHandler(RegisterHTMLHandler(mjAdaptor)) // 保留无障碍 MathML 副本
const mjTex = new TeX({
  packages: AllPackages.filter((p) => p !== 'require' && p !== 'autoload'),
})

// MathJax 容器样式与公式内容无关(实测固定),全站注入一份即可,不在每页重复输出。
const mjStyleSheet = (() => {
  const svg = new SVG({ fontCache: 'global' })
  const doc = mathjax.document('', { InputJax: mjTex, OutputJax: svg })
  doc.convert('x', { display: false })
  return mjAdaptor.textContent(svg.styleSheet(doc))
})()

// 当前正在渲染的页面上下文(md.render 与 convert 全程同步,JS 单线程,不会串页)
let mjPage: { svg: any; doc: any } | null = null

function mjConvert(tex: string, display: boolean) {
  if (!mjPage) {
    const svg = new SVG({ fontCache: 'global' })
    mjPage = { svg, doc: mathjax.document('', { InputJax: mjTex, OutputJax: svg }) }
  }
  const node = mjPage.doc.convert(tex, { display })
  // convert 会把每个公式留在 doc 的内部列表里,大量公式时内存持续增长导致构建 OOM,这里转换后立即释放
  mjPage.doc.clear?.()
  return mjAdaptor.outerHTML(node)
}

// 搜索索引渲染期间置为 true:公式只保留 TeX 源码文本,不生成 SVG(索引只需要文字,能省下大量时间和内存)
let mjPlainText = false
const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// 取出本页累积的全局字形 <defs>,包进隐藏 <svg> 外壳(供 <use> 引用解析),并重置页上下文
function mjFlushDefs(): string {
  if (!mjPage) return ''
  const cache = mjPage.svg.fontCache?.getCache?.()
  mjPage = null
  if (!cache) return ''
  const defs = mjAdaptor.outerHTML(cache)
  if (!defs.includes('<path')) return ''
  return `<svg width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true">${defs}</svg>`
}

// 读取 package.json 版本信息
const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8')
)
const version = packageJson.version || '1.0.0'
const releaseVersion = packageJson.releaseVersion || '2024.04.1'
const notesVersion = packageJson.notesVersion || '2024.04'

// 从 md 文件的 frontmatter 或第一个 # 标题读取名称
function getTitle(filePath: string, fallback: string) {
  if (!fs.existsSync(filePath)) return fallback
  const content = fs.readFileSync(filePath, 'utf-8')
  const fmMatch = content.match(/^---\s*\n[\s\S]*?title:\s*(.+)\s*\n[\s\S]*?---/)
  if (fmMatch) return fmMatch[1].trim()
  const h1Match = content.match(/^#\s+(.+)/m)
  if (h1Match) return h1Match[1].trim()
  return fallback
}

// 自定义导航栏排序（数字越小越靠前，未配置的排在最后按字母顺序）
const navOrder: Record<string, number> = {
  '数学': 1,
  '物理': 2,
  '化学': 3,
}

// 自动扫描 knowledge 下的子目录，生成带下拉菜单的导航项
// 顶级目录作为导航项，子目录作为下拉菜单项
function getSubjectNav() {
  const knowledgeDir = path.resolve(__dirname, '..')
  const ignoreDirs = ['.vitepress', 'public', 'readme', 'assets']
  const navItems: { text: string; items: { text: string; link: string }[] }[] = []

  for (const dir of fs.readdirSync(knowledgeDir)) {
    const fullPath = path.join(knowledgeDir, dir)
    if (!fs.statSync(fullPath).isDirectory()) continue
    if (ignoreDirs.includes(dir)) continue

    // 导航栏名称直接用文件夹名
    const subjectName = dir

    // 导航链接（优先 index.md，其次 说明.md）
    const indexFile = fs.existsSync(path.join(fullPath, 'index.md'))
      ? 'index.md'
      : fs.existsSync(path.join(fullPath, '说明.md'))
        ? '说明.md'
        : ''
    const subjectLink = indexFile
      ? `/${dir}/${indexFile === 'index.md' ? '' : '说明'}`
      : `/${dir}/`

    // 扫描子目录
    const children: { text: string; link: string }[] = []
    for (const sub of fs.readdirSync(fullPath)) {
      const subPath = path.join(fullPath, sub)
      if (!fs.statSync(subPath).isDirectory()) continue
      if (sub === 'assets') continue

      const subIndex = path.join(subPath, 'index.md')
      const subFiles = fs.readdirSync(subPath).filter(f => f.endsWith('.md'))
      if (subFiles.length === 0) continue

      // 下拉菜单已在学科下，去掉重复的学科名和"笔记"后缀：数学必修一笔记 → 必修一
      const text = sub.replace(new RegExp(`^${dir}`), '').replace(/笔记$/, '') || sub
      const link = subFiles.includes('index.md')
        ? `/${dir}/${sub}/`
        : `/${dir}/${sub}/${subFiles[0].replace(/\.md$/, '')}`

      children.push({ text, link })
    }

    const linkHtml = `<a href="${subjectLink}" class="nav-subject-link">${subjectName}</a>`
    if (children.length > 0) {
      navItems.push({ text: linkHtml, items: sortByVolume(children, (c) => c.text) })
    } else {
      navItems.push({ text: subjectName, link: subjectLink })
    }
  }

  // 按自定义顺序排序
  navItems.sort((a, b) => {
    const aName = a.text.replace(/<[^>]+>/g, '') // 去除 HTML 标签获取纯文本
    const bName = b.text.replace(/<[^>]+>/g, '')
    const aOrder = navOrder[aName] ?? 999
    const bOrder = navOrder[bName] ?? 999
    if (aOrder !== bOrder) return aOrder - bOrder
    return aName.localeCompare(bName) // 相同优先级按字母排序
  })

  return navItems
}

// https://vitepress.dev/reference/site-config
// VitePress 配置
export default defineConfig({
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }],
    ['link', { rel: 'dns-prefetch', href: 'https://waline.zspro.top' }],
    ['link', { rel: 'preconnect', href: 'https://waline.zspro.top', crossorigin: '' }],
    // MathJax 容器样式(与公式内容无关,全站共享一份,避免每页/每公式重复输出)
    ['style', { id: 'mathjax-style' }, mjStyleSheet],
  ],
  markdown: {
    math: true,
    config: (md) => {
      // 接管公式渲染:用自建 global 管线替代内置的 fontCache:'none' 输出
      md.renderer.rules.math_inline = (tokens, idx) =>
        mjPlainText
          ? escapeHtml(tokens[idx].content)
          : '<span v-pre>' + mjConvert(tokens[idx].content, false) + '</span>'
      md.renderer.rules.math_block = (tokens, idx) =>
        mjPlainText
          ? '<p>' + escapeHtml(tokens[idx].content) + '</p>'
          : '<div v-pre>' + mjConvert(tokens[idx].content, true) + '</div>'

      // 页级协调:一次 md.render 渲染一页正文,结束后把本页共享 <defs> 追加到页尾一次。
      // 注意 VitePress 也会用同一 md 实例渲染搜索索引/摘要,这些场景同样会正确 flush(无公式则 mjFlushDefs 返回空)。
      const origRender = md.render.bind(md)
      md.render = (src: string, env?: any) => {
        mjPage = null
        const html = origRender(src, env)
        return html + mjFlushDefs()
      }
    },
  },
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.startsWith('mjx-'),
      },
    },
  },
  extends: teekConfig,
  title: "An Awesome Note",
  description: "一个基于中国普通高中教科书的学科笔记项目",
  themeConfig: {
    logo: '/logo.svg',
    search: {
      provider: 'local',
      options: {
        // 索引只需要文字:渲染时跳过公式 SVG 生成
        _render(src, env, md) {
          mjPlainText = true
          try {
            return md.render(src, env)
          } finally {
            mjPlainText = false
          }
        },
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档',
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            displayDetails: '显示详细列表',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            },
          },
        },
      },
    },
    // https://vitepress.dev/reference/default-theme-config
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
    outline: {
      label: '页面导航',
    },
    lastUpdated: {
      text: '最后更新于',
    },
    darkModeSwitchLabel: '主题',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',
    langMenuLabel: '多语言',
    nav: [
      { text: '主页', link: '/' },
      ...getSubjectNav(),
      { text: '关于', link: '/about' },
    ],
  },
  vite: {
    define: {
      __RELEASE_VERSION__: JSON.stringify(releaseVersion),
      __SITE_VERSION__: JSON.stringify(version),
      __NOTES_VERSION__: JSON.stringify(notesVersion),
      __VITEPRESS_VERSION__: JSON.stringify((packageJson.devDependencies?.vitepress || 'unknown').replace(/^[\^~]/, '')),
      __TEEK_VERSION__: JSON.stringify((packageJson.devDependencies?.['vitepress-theme-teek'] || 'unknown').replace(/^[\^~]/, '')),
    },
    build: {
      sourcemap: false,
      cssMinify: true,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('vitepress-theme-teek')) {
                return 'teek'
              }
              if (id.includes('@vue')) {
                return 'vue'
              }
              if (id.includes('@waline')) {
                return 'waline'
              }
            }
          },
        },
      },
    },
  },
})
