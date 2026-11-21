<script setup lang="ts">
import DesktopPlayerPicker from '@/components/DesktopPlayerPicker.vue'
import MobilePlayerPicker from '@/components/MobilePlayerPicker.vue'

const isMobile = window.matchMedia?.('(pointer: coarse)').matches ?? false
</script>

<template>
  <main :class="{ 'player-picker--mobile': isMobile }">
    <MobilePlayerPicker v-if="isMobile" />
    <DesktopPlayerPicker v-else />
  </main>
</template>

<style scoped>
:global(#app:has(> .player-picker--mobile)) {
  display: flex;
  flex-direction: column;
  height: 100dvh;
}

.player-picker--mobile {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
</style>
