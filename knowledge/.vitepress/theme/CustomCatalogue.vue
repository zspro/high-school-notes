<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

const { theme, frontmatter } = useData()

interface CatalogueItem {
  title: string
  url?: string
  children?: CatalogueItem[]
  frontmatter?: { titleTag?: string }
}

const filterAssets = (items: CatalogueItem[]): CatalogueItem[] =>
  items
    .filter((item) => item.title !== 'assets')
    .map((item) => item.children
      ? { ...item, children: filterAssets(item.children) }
      : item
    )

const catalogues = computed<CatalogueItem[]>(() => {
  const raw = (theme.value as any).catalogues?.inv[frontmatter.value.path]?.catalogues ?? []
  return filterAssets(raw)
})
</script>

<template>
  <div class="custom-catalogue">
    <div v-if="catalogues.length" class="catalogue-grid">
      <div
        v-for="(item, i) in catalogues"
        :key="i"
        class="catalogue-card"
      >
        <!-- 有子项：分组卡片 -->
        <template v-if="item.children?.length">
          <div class="card-header">
            <span class="card-index">{{ String(i + 1).padStart(2, '0') }}</span>
            <h3 class="card-title">{{ item.title }}</h3>
          </div>
          <ul class="card-links">
            <li v-for="(child, j) in item.children" :key="j">
              <a v-if="child.url" :href="withBase(child.url)" class="link-item">
                <span class="link-dot" />
                <span class="link-text">{{ child.title }}</span>
                <span v-if="child.frontmatter?.titleTag" class="tag">{{ child.frontmatter.titleTag }}</span>
              </a>
              <span v-else class="link-item disabled">
                <span class="link-dot" />
                <span class="link-text">{{ child.title }}</span>
              </span>
            </li>
          </ul>
        </template>
        <!-- 无子项：单链接卡片 -->
        <template v-else>
          <a
            v-if="item.url"
            :href="withBase(item.url)"
            class="card-single"
          >
            <span class="card-index">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="card-title">{{ item.title }}</span>
            <span v-if="item.frontmatter?.titleTag" class="tag">{{ item.frontmatter.titleTag }}</span>
            <span class="card-arrow">&#8594;</span>
          </a>
          <div v-else class="card-single disabled">
            <span class="card-index">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="card-title">{{ item.title }}</span>
          </div>
        </template>
      </div>
    </div>
    <p v-else class="empty">暂无内容</p>
  </div>
</template>

<style scoped>
.custom-catalogue {
  margin-top: 8px;
  margin-bottom: 32px;
}
.catalogue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.catalogue-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  background: var(--vp-c-bg-soft);
  transition: box-shadow 0.25s, border-color 0.25s;
}
.catalogue-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.card-index {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  padding: 2px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}
.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0;
}
.card-links {
  list-style: none;
  padding: 0;
  margin: 0;
}
.card-links li + li {
  margin-top: 8px;
}
.link-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}
a.link-item:hover {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}
.link-item.disabled {
  color: var(--vp-c-text-3);
}
.link-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  flex-shrink: 0;
  opacity: 0.5;
}
a.link-item:hover .link-dot {
  opacity: 1;
}
.link-text {
  font-size: 0.9rem;
}
.card-single {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--vp-c-text-1);
  width: 100%;
}
a.card-single {
  cursor: pointer;
}
a.card-single:hover .card-title {
  color: var(--vp-c-brand-1);
}
.card-single .card-arrow {
  margin-left: auto;
  color: var(--vp-c-text-3);
  transition: transform 0.2s, color 0.2s;
}
a.card-single:hover .card-arrow {
  transform: translateX(4px);
  color: var(--vp-c-brand-1);
}
.card-single.disabled {
  color: var(--vp-c-text-3);
}
.tag {
  display: inline-block;
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}
.empty {
  color: var(--vp-c-text-3);
  text-align: center;
  padding: 32px 0;
}
</style>
