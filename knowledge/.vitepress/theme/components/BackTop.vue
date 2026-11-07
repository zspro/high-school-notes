<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const visible = ref(false);

const onScroll = () => {
  const top = window.scrollY || document.documentElement.scrollTop;
  visible.value = top > 200;
};

const toTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

onMounted(() => {
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
});
</script>

<template>
  <button
    v-show="visible"
    class="back-top"
    @click="toTop"
    aria-label="回到顶部"
    title="回到顶部"
  >
    <svg
      class="icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <!-- 向上箭头 -->
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

<style scoped>
.back-top {
  position: fixed;
  right: 24px;
  bottom: 24px;
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
  z-index: 50;
}

.back-top:hover {
  transform: translateY(-2px);
  background: var(--vp-c-brand-2);
}

.back-top:focus-visible {
  outline: 2px solid var(--vp-c-brand-3);
  outline-offset: 2px;
}

.icon {
  width: 20px;
  height: 20px;
}
</style>
