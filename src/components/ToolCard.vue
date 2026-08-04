<script setup lang="ts">
import BaseCard from '@/components/BaseCard.vue'
import { RouterLink } from 'vue-router'

defineProps<{
  tool: {
    title: string
    icon: string
    link: string
  }
}>()

</script>

<template>
  <div class="tool-card">
    <RouterLink :to="tool.link">
        <BaseCard>
          <template #header>
            <header class="card-header font-semibold text-2xl"> {{ tool.title }}</header>
          </template>
          <div class="flex justify-center">
            <img :src="tool.icon" />
          </div>
        </BaseCard>
    </RouterLink>
  </div>
</template>

<style scoped>
.tool-card:hover {
  transform: translateY(-2px);
  transition: 150ms;
}
</style>
