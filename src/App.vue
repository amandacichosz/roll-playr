<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import BaseHeader from "@/components/BaseHeader.vue"
import BackButton from '@/components/BackButton.vue'
import { RouterView, useRoute } from 'vue-router'

const route = useRoute()
const isHome = computed(() => route.path === '/')
const pageTitle = computed(() => {
  const title = route.meta.title
  return typeof title === 'string' ? title : undefined
})

const hasMenu = computed(() => route.meta.menu === true)
const toolView = useTemplateRef<{ openOptions?: () => void; optionsAvailable?: boolean }>('toolView')

</script>

<template>
  <BaseHeader
    :title="pageTitle"
    :menu="hasMenu && toolView?.optionsAvailable !== false"
    @options="toolView?.openOptions?.()"
  />
  <BackButton v-if="!isHome && !pageTitle" />

  <RouterView v-slot="{ Component }">
    <component :is="Component" ref="toolView" />
  </RouterView>
</template>

<style>
body {
  height: 100vh;
}
</style>
