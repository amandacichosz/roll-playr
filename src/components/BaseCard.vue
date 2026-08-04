<script setup lang="ts">

defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="card p-3 flex flex-col justify-evenly items-center w-61 h-61">
    <div class="card-header font-semibold text-2xl">{{ title }}</div>
    <div class="card-content">
      <slot></slot>
    </div>
    <!-- <div class="card-footer">{{ tool.link }}</div> -->
  </div>
</template>

<style scoped>
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 24px;
}

.card:hover {
  background: var(--color-surface-elevated);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  transition: 150ms;
}
</style>