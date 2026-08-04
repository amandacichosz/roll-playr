<script setup lang="ts">

defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="card p-3 flex flex-col">
    <div v-if="title" class="card-header flex justify-between">
      <div class="font-semibold text-2xl">{{ title }}</div>
      <slot name="headerActions" />
    </div>
    <div v-if="$slots.header">
      <slot name="header" />
    </div>

    <div class="flex-1">
      <div v-if="$slots.default" class="card-content flex-1">
        <slot />
      </div>
    </div>
    <div v-if="$slots.footer" class="flex justify-end">
      <slot name="footer" />
    </div>
  </div>
</template>


<style scoped>

.card-header {
  line-height: 1.25;
  border-bottom: 2px solid var(--color-border);
}
.card {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-primary);
  border-radius: 20px;
  padding: 24px;
}

</style>