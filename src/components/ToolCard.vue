<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  tool: {
    title: string
    description: string
    icon: string
    link: string
    menu?: string
  }
}>()
</script>

<template>
  <RouterLink :to="tool.link" class="tool-card">
    <div class="tool-art">
      <img :src="tool.icon" alt="" width="120" height="120" />
    </div>
    <div class="tool-details">
      <h2>{{ tool.title }}</h2>
      <p>{{ tool.description }}</p>
    </div>
  </RouterLink>
</template>

<style scoped>
.tool-card {
  display: grid;
  grid-template-columns: clamp(4.5rem, 22vw, 7rem) minmax(0, 1fr);
  align-items: stretch;
  min-height: 100%;
  border: 1px solid var(--color-border);
  border-radius: 1.25rem;
  background: var(--color-surface-elevated);
  overflow: hidden;
}

.tool-card:hover {
  border-color: var(--color-secondary);
}

.tool-card:focus-visible {
  outline: 2px solid #c4b5fd;
  outline-offset: 3px;
}

.tool-art {
  display: grid;
  place-items: center;
  padding: 0.625rem;
  background: radial-gradient(ellipse at center, var(--color-primary-pressed), var(--color-background) 90%);
}

.tool-art img {
  width: min(100%, 9rem);
  height: auto;
}

.tool-details {
  align-self: center;
  padding: 1rem;
}

.tool-details h2 {
  font-size: clamp(1.125rem, 2.5vw, 1.5rem);
  font-weight: 750;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.tool-details p {
  margin-top: 0.375rem;
  color: var(--color-text-muted);
  font-size: 1rem;
  line-height: 1.4;
}

@media (min-width: 48rem) {
  .tool-card {
    grid-template-columns: 1fr;
    grid-template-rows: 13rem 1fr;
  }

  .tool-art {
    border-bottom: 1px solid var(--color-border);
  }

  .tool-details {
    padding: 1.25rem 1.5rem;
  }
}
</style>
