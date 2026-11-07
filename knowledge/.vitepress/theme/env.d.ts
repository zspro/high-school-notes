/// <reference types="vitepress/client" />

declare module "*.css" {}
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
declare module "@waline/client/style" {}
declare module "vitepress-theme-teek/index.css" {}
declare module "vitepress-theme-teek/theme-chalk/*.css" {}
