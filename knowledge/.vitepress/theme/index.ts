// .vitepress/theme/index.ts
import Teek, { walineContext } from "vitepress-theme-teek";
import "vitepress-theme-teek/index.css";
// 文档页 H1 渐变（tk-doc-h1-gradient）为原生硬编码紫粉渐变，不随主题色，已停用：
// 正文标题保持中性色，与「首页炫、正文稳」的定位一致。
import "vitepress-theme-teek/theme-chalk/tk-nav-blur.css";
import "vitepress-theme-teek/theme-chalk/tk-doc-fade-in.css";
import "vitepress-theme-teek/theme-chalk/tk-nav-search-button.css";
import "./custom.css";
import LayoutVue from "./Layout.vue";
import CustomCatalogue from "./CustomCatalogue.vue";
import { defineComponent, h, provide } from "vue";
import type { Theme } from "vitepress";

export default {
  extends: Teek,
  Layout: defineComponent({
    name: "LayoutProvider",
    setup() {
      provide(walineContext, async (el, options) => {
        const [{ init }] = await Promise.all([
          import("@waline/client"),
          import("@waline/client/style"),
        ]);
        return init({ serverURL: options.serverURL!, dark: options.dark, el });
      });
      return () => h(LayoutVue);
    },
  }),
  enhanceApp({ app }) {
    app.component("CustomCatalogue", CustomCatalogue);
  },
} satisfies Theme;