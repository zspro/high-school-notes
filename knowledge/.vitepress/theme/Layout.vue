<script setup lang="ts">
import TeekTheme, { zhCn } from "vitepress-theme-teek";
import { onMounted, onUnmounted } from "vue";

const { Layout } = TeekTheme;

// 清理已废弃的自定义色板值：曾用 "rainbow" 色卡驱动首页渐变，
// 现已改为官方方案（:root 无条件 rainbow 动画），该值不再有对应色板定义。
const LEGACY_PALETTE = "rainbow";

// 面板开关「图标跟随彩虹」：关闭时 html 挂 .icon-rainbow-off，图标墨色回退为当前主题色
const ICON_RAINBOW_KEY = "tk-icon-rainbow";

const applyIconRainbow = (on: boolean) => {
  document.documentElement.classList.toggle("icon-rainbow-off", !on);
};

onMounted(() => {
  // 清理已废弃的自定义色板值：曾用 "rainbow" 色卡驱动首页渐变，
  // 现已改为官方方案（:root 无条件 rainbow 动画），该值不再有对应色板定义。
  if (localStorage.getItem("tk:themeColor") === LEGACY_PALETTE) {
    localStorage.removeItem("tk:themeColor");
    document.documentElement.removeAttribute("theme-color");
  }
  localStorage.removeItem("tk-palette-migrated");

  applyIconRainbow(localStorage.getItem(ICON_RAINBOW_KEY) !== "off");

  // ===== 面板开关行注入（DOM 可能被 Vue 重渲染，重复调用是幂等的） =====
  const injectIconSwitch = () => {
    if (document.querySelector(".tk-icon-rainbow-block")) return;
    const anchor = document.querySelector(".tk-theme-enhance__theme-color");
    if (!anchor || !anchor.parentElement) return;
    const on = localStorage.getItem(ICON_RAINBOW_KEY) !== "off";
    const block = document.createElement("div");
    block.className = "tk-border-highlight tk-icon-rainbow-block";
    block.innerHTML = `
      <div class="flx-justify-between flx-1" style="align-items:center;gap:8px">
        <span class="label" title="首页大图标的渐变是否跟随彩虹一起流动；关闭后固定为当前主题色">图标跟随彩虹</span>
        <input type="checkbox" aria-label="图标跟随彩虹" ${on ? "checked" : ""} />
      </div>`;
    anchor.parentElement.insertBefore(block, anchor.nextSibling);
    const sw = block.querySelector<HTMLInputElement>("input");
    sw?.addEventListener("change", () => {
      localStorage.setItem(ICON_RAINBOW_KEY, sw.checked ? "on" : "off");
      applyIconRainbow(sw.checked);
    });
  };

  // ===== hero 图标内联化 =====
  // <img> 引用的 SVG 是独立文档，CSS 变量穿不进去；换成内联 SVG 才能跟随主题色与彩虹。
  // 首次进入、浏览器前进后退、SPA 路由切换都会让 Vue 重新渲染出新的 img，
  // 所以这里用 MutationObserver 常驻监听，而不是只轮询一次。
  let svgText: string | null = null;
  let inlining = false;

  const inlineHeroIcon = async () => {
    if (inlining) return;
    if (document.querySelector(".hero-icon-inline")) return;
    const img = document.querySelector<HTMLImageElement>(
      '.VPHome img.VPImage[src*="hero-icon"]'
    );
    if (!img || !img.parentElement) return;
    inlining = true;
    try {
      if (!svgText) svgText = await (await fetch("/hero-icon.svg")).text();
      const holder = document.createElement("span");
      holder.className = "hero-icon-inline";
      holder.innerHTML = svgText;
      img.replaceWith(holder);
    } catch {
      // 取不到就保留原 img，不影响页面其它功能
    } finally {
      inlining = false;
    }
  };

  const sync = () => {
    injectIconSwitch();
    void inlineHeroIcon();
  };

  const observer = new MutationObserver(sync);
  observer.observe(document.body, { childList: true, subtree: true });
  sync();

  onUnmounted(() => observer.disconnect());
});
</script>

<template>
  <Layout :locale="zhCn">
    <template #teek-back-top="{ show, progress, icon, scrollToTop }">
      <button
        v-show="show"
        class="back-top"
        @click="scrollToTop"
        aria-label="回到顶部"
        title="回到顶部"
      >
        <svg
          class="icon"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 19V5M5 12l7-7 7 7"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </template>

    <template #teek-to-comment="{ show, icon, scrollToComment }">
      <button
        v-show="show"
        class="right-btn"
        @click="scrollToComment"
        aria-label="前往评论"
        title="前往评论"
      >
        <svg
          class="icon"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </template>
  </Layout>
</template>

<style scoped>
.right-btn,
.back-top {
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: grid;
  place-items: center;
  color: #fff;
  background: var(--vp-c-brand-1);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.right-btn:hover,
.back-top:hover {
  transform: translateY(-2px);
  background: var(--vp-c-brand-2);
}

.right-btn:focus-visible,
.back-top:focus-visible {
  outline: 2px solid var(--vp-c-brand-3);
  outline-offset: 2px;
}

.icon {
  width: 20px;
  height: 20px;
}
</style>
