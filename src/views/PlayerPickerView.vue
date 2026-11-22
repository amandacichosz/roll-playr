<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import DesktopPlayerPicker from '@/components/DesktopPlayerPicker.vue'
import MobilePlayerPicker from '@/components/MobilePlayerPicker.vue'
import PlayerPickerSettings from '@/components/PlayerPickerSettings.vue'

const isMobile = window.matchMedia?.('(pointer: coarse)').matches ?? false
const teamCount = ref(0)
const settingsOpen = ref(false)
const draft = ref({ splitIntoTeams: false, teamCount: 2 as number | '' })

function openOptions() {
  draft.value = { splitIntoTeams: teamCount.value > 0, teamCount: teamCount.value || 2 }
  settingsOpen.value = true
}

function saveSettings() {
  const { splitIntoTeams, teamCount: count } = draft.value
  if (splitIntoTeams && (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 2)) return

  teamCount.value = splitIntoTeams ? Number(count) : 0
  settingsOpen.value = false
}

defineExpose({ openOptions })
</script>

<template>
  <main :class="{ 'player-picker--mobile': isMobile }">
    <MobilePlayerPicker v-if="isMobile" :team-count="teamCount" />
    <DesktopPlayerPicker v-else :team-count="teamCount" />

    <BaseModal
      v-model:open="settingsOpen"
      name="player-picker-settings"
      title="Player Picker settings"
      submit-label="Save"
      @submit="saveSettings"
    >
      <PlayerPickerSettings v-model="draft" />
    </BaseModal>
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
