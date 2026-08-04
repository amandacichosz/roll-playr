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
  <RouterLink :to="tool.link">
      <BaseCard :title="tool.title">
        <img :src="tool.icon" />
      </BaseCard>
  </RouterLink>
</template>
