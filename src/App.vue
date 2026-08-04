<script setup lang="ts">
import { computed } from 'vue'
import BaseHeader from "@/components/BaseHeader.vue"
import BackButton from '@/components/BackButton.vue'
import { RouterView, useRoute } from 'vue-router'

const route = useRoute()
const isHome = computed(() => route.path === '/')

</script>

<template>
  <BaseHeader />
  <BackButton v-if="!isHome"></BackButton>
  <RouterView />
</template>
