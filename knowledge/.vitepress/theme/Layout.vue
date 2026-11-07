<script setup lang="ts">
import TeekTheme, { zhCn } from "vitepress-theme-teek";

const { Layout } = TeekTheme;
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
