<script setup lang="ts">
import { computed } from 'vue'
import BaseHeader from "@/components/BaseHeader.vue"
import BackButton from '@/components/BackButton.vue'
import { RouterView, useRoute } from 'vue-router'

const route = useRoute()
const isHome = computed(() => route.path === '/')
const pageTitle = computed(() => {
  const title = route.meta.title
  return typeof title === 'string' ? title : undefined
})

</script>

<template>
  <BaseHeader :title="pageTitle" />
  <BackButton v-if="!isHome && !pageTitle" />
  <RouterView />
</template>
