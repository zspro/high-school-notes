/**
 * Hero 区域的运行时装饰：
 *   1. 把 hero 的 <img> 换成内联 SVG —— 外部 SVG 是独立文档，CSS 变量穿不进去，
 *      内联后图标墨色才能跟随主题色与彩虹动画。
 *   2. 往主题增强面板注入「图标跟随彩虹」开关。
 *
 * 两者都依赖同一个常驻的 MutationObserver：
 * 首次进入、浏览器前进后退、SPA 路由切换都会重建 DOM，
 * 只在挂载时做一次是不够的。重复执行是幂等的。
 */

const ICON_RAINBOW_KEY = "tk-icon-rainbow";

const applyIconRainbow = (on: boolean) => {
  document.documentElement.classList.toggle("awe-icon-rainbow-off", !on);
};

/** 面板开关行（插在主题色区块下方），已存在则跳过 */
const injectIconSwitch = () => {
  if (document.querySelector(".awe-panel-switch")) return;

  const anchor = document.querySelector(".tk-theme-enhance__theme-color");
  if (!anchor?.parentElement) return;

  const on = localStorage.getItem(ICON_RAINBOW_KEY) !== "off";
  const block = document.createElement("div");
  block.className = "tk-border-highlight awe-panel-switch";
  block.innerHTML = `
    <div class="flx-justify-between flx-1" style="align-items:center;gap:8px">
      <span class="label" title="首页大图标的渐变是否跟随彩虹一起流动；关闭后固定为当前主题色">图标跟随彩虹</span>
      <input type="checkbox" aria-label="图标跟随彩虹" ${on ? "checked" : ""} />
    </div>`;

  anchor.parentElement.insertBefore(block, anchor.nextSibling);

  const input = block.querySelector<HTMLInputElement>("input");
  input?.addEventListener("change", () => {
    localStorage.setItem(ICON_RAINBOW_KEY, input.checked ? "on" : "off");
    applyIconRainbow(input.checked);
  });
};

let svgText: string | null = null;
let inlining = false;

/** 用内联 SVG 替换 hero 的 img，已替换则跳过 */
const inlineHeroIcon = async () => {
  if (inlining) return;
  if (document.querySelector(".awe-hero-icon")) return;

  const img = document.querySelector<HTMLImageElement>(
    '.VPHome img.VPImage[src*="hero-icon"]'
  );
  if (!img?.parentElement) return;

  inlining = true;
  try {
    if (!svgText) svgText = await (await fetch("/hero-icon.svg")).text();
    const holder = document.createElement("span");
    holder.className = "awe-hero-icon";
    holder.innerHTML = svgText;
    img.replaceWith(holder);
  } catch {
    // 取不到就保留原 img，不影响页面其它功能
  } finally {
    inlining = false;
  }
};

/** 安装装饰逻辑，返回清理函数 */
export function installHeroDecor() {
  applyIconRainbow(localStorage.getItem(ICON_RAINBOW_KEY) !== "off");

  const sync = () => {
    injectIconSwitch();
    void inlineHeroIcon();
  };

  const observer = new MutationObserver(sync);
  observer.observe(document.body, { childList: true, subtree: true });
  sync();

  return () => observer.disconnect();
}
