<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{ arrow?: boolean }>()
</script>

<template>
  <RouterLink to="/" :aria-label="arrow ? 'Back to home' : undefined">
    <svg
      v-if="arrow"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="m11 5-7 7 7 7M4 12h16" />
    </svg>
    <template v-else>Back</template>
  </RouterLink>
</template>
