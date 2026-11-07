# An Awesome Note · 高中学科笔记

一个基于中国普通高中教科书的学科笔记项目，收录数学、物理、化学三科的学习笔记，帮助学生更好地理解和掌握高中知识。

## 学科目录

| 学科 | 覆盖范围 |
| ---- | -------- |
| 数学 | 必修一、必修二，选择性必修一至三。集合、函数、向量、立体几何、圆锥曲线、导数、概率统计 |
| 物理 | 必修一至三，选择性必修一至三。运动与力、能量、电磁学、振动与波、光、热学、原子物理 |
| 化学 | 必修一、必修二，选择性必修一至三 |

## 技术栈

- [VitePress](https://vitepress.dev/) 1.x —— 静态站点生成
- [vitepress-theme-teek](https://github.com/Kele-Bingtang/vitepress-theme-teek) —— 站点主题
- [Waline](https://waline.js.org/) —— 页面评论区
- markdown-it-mathjax3 —— 数学公式渲染

## 本地开发

需要 [Node.js](https://nodejs.org/) 18+ 与 [pnpm](https://pnpm.io/)。

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm docs:dev

# 构建生产版本（输出到 knowledge/.vitepress/dist）
pnpm docs:build

# 本地预览构建结果
pnpm docs:preview
```

## 目录结构

```
schoollearn/
├── knowledge/            # 站点内容与配置
│   ├── 数学/             # 数学笔记（按章节编号排序）
│   ├── 物理/             # 物理笔记
│   ├── 化学/             # 化学笔记
│   └── .vitepress/       # VitePress 配置与主题
├── scripts/              # 构建辅助脚本
│   ├── import_kimi.py    # 将 Kimi 导出的笔记导入站点目录
│   ├── fixmd.py          # Markdown 公式格式修复
│   ├── mjcheck.mjs       # TeX 公式语法检查
│   └── htmlcheck.py      # HTML 标签检查
└── package.json
```

## 笔记导入

如果你也在使用 Kimi 生成/整理笔记，可以用导入脚本将导出的笔记转换为站点格式：

```bash
python scripts/import_kimi.py <解压后的 Kimi 目录> [knowledge]

# 导入后检查 TeX 公式语法
node scripts/mjcheck.mjs "knowledge/数学/数学必修二笔记/"*.md
```

文件名前的序号（如 `07-第七章_复数.md`）决定侧边栏中的章节顺序。

## 贡献

欢迎通过 Issue 或 Pull Request 指正笔记中的错误、补充知识点。提交前请运行 `pnpm docs:build` 确保构建通过。

## 许可证

本项目内容以 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)（署名-非商业性使用-相同方式共享 4.0 国际）协议发布：

- ✅ 自由分享与改编 —— 需署名并注明修改
- ❌ 不得用于商业目的
- 🔁 衍生作品需以相同协议发布
