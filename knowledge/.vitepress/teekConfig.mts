// .vitepress/teekConfig.mts
import { defineTeekConfig } from "vitepress-theme-teek/config";
import { sortByVolume } from "./volumeOrder.mts";
import { PERMALINK_MAP } from "./theme/permalinkMap.ts";

// Teek 主题配置
export const teekConfig = defineTeekConfig({
    teekTheme: true, // 启用 Teek 主题功能
    vitePlugins: {
        sidebarOption: {
            ignoreList: ["assets"], // 侧边栏忽略 assets 目录
            titleFormMd: true, // 章节名取 md 的一级标题（"第一章 运动的描述"），而不是文件名
            // 修复 sidebar 中 index.md 链接不匹配的问题
            // sidebar 插件生成的链接为 /xxx/index，而 VitePress 路由为 /xxx/
            // 导致侧边栏当前项无法高亮，这里统一将 /index 结尾的链接替换为 /
            sidebarResolved: (data: any) => {
                // 链接英文化：按 PERMALINK_MAP 把文件路径换成 permalink
                const fix = (items: any[]) => {
                    for (const item of items) {
                        if (item.link) {
                            const key = item.link.replace(/\/index$/, '')
                            if (PERMALINK_MAP[key]) item.link = PERMALINK_MAP[key]
                            else if (item.link.endsWith('/index')) item.link = item.link.replace(/\/index$/, '/')
                        }
                        if (item.items) fix(item.items)
                    }
                }
                // 册分组按教材顺序排列（必修一 → 选择性必修三）
                const sortGroups = (items: any[]): any[] => {
                    for (const item of items) if (item.items) item.items = sortGroups(item.items)
                    return items.some((i) => i.items) ? sortByVolume(items, (i) => i.text ?? '') : items
                }
                if (Array.isArray(data)) {
                    fix(data)
                    return sortGroups(data)
                }
                for (const key of Object.keys(data)) {
                    const val = data[key]
                    fix(Array.isArray(val) ? val : [val])
                    if (Array.isArray(val)) data[key] = sortGroups(val)
                }
                return data
            },
        },
        catalogueOption: {
            titleFormMd: true, // 目录页同样使用 md 一级标题
            // 目录页链接同样英文化
            catalogueItemResolved: (data: any[]) => {
                for (const item of data) {
                    if (item.link) {
                        const key = item.link.replace(/\/index$/, '')
                        if (PERMALINK_MAP[key]) item.link = PERMALINK_MAP[key]
                    }
                }
                return sortByVolume(data, (i) => i.title ?? '')
            },
        },
    },
    teekHome: false, // 不使用 Teek 首页布局
    vpHome: true, // 使用 VitePress 默认首页布局
    loading: true, // 启用路由加载动画；具体 UI 由 Layout.vue 的 #teek-loading 插槽渲染
    //loading: "正在加载中...", // 页面加载提示文字
    viewTransition: {
        enabled: true, // 启用深浅色切换动画效果
        mode: "out", // 动画模式，out 始终从点击点往全屏扩散
        duration: 300, // 动画持续时间（ms）
        easing: "ease-in", // 缓动函数
    },
    backTop: {
        enabled: true, // 启用回到顶部按钮
    },
    windowTransition: true, // 启用页面切换过渡动画
    sidebarTrigger: true, // 启用侧边栏触发器（收起/展开按钮）
    themeEnhance: {
        spotlight: {
            disabled: true, // 禁用聚光灯效果
            defaultValue: false,
        },
    },
    footerInfo: {
        theme: {
            show: true, // 显示主题信息
            name: "本网站使用 Teek VitePress 主题",
            link: "https://vp.teek.top/",
        },
        copyright: {
            show: true, // 显示版权信息
            createYear: 2026, // 创建年份
            suffix: "An Awesome Note", // 版权后缀
        },
    },
    articleUpdate: {
        enabled: false, // 禁用文章最近更新栏
    },
    comment: {
        provider: "waline",
        options: {
            serverURL: "https://waline.zspro.top",
        },
    },
});