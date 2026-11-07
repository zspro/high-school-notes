/// <reference types="vitepress/client" />

declare module "*.css" {}
declare module "@waline/client/style" {}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
