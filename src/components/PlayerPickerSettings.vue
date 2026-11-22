<script setup lang="ts">
const settings = defineModel<{ splitIntoTeams: boolean; teamCount: number | '' }>({ required: true })
</script>

<template>
  <fieldset class="picker-settings">
    <legend>Selection mode</legend>
    <label class="team-toggle">
      <input v-model="settings.splitIntoTeams" type="checkbox" />
      Split players into teams
    </label>
    <label v-if="settings.splitIntoTeams" class="team-count">
      Number of teams
      <input
        v-model.number="settings.teamCount"
        type="number"
        min="2"
        :max="Number.MAX_SAFE_INTEGER"
        step="1"
        required
      />
    </label>
  </fieldset>
</template>

<style scoped>
.picker-settings legend {
  margin-bottom: 0.75rem;
  font-weight: 750;
}

.team-toggle {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 2.75rem;
  cursor: pointer;
}

.team-toggle input {
  width: 1.125rem;
  height: 1.125rem;
  accent-color: var(--color-secondary);
}

.team-count {
  display: grid;
  gap: 0.375rem;
  margin-top: 0.75rem;
}

.team-count input {
  width: 8rem;
  min-height: 2.75rem;
  padding-inline: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.625rem;
  background: var(--color-background);
}

.picker-settings input:focus-visible {
  outline: 2px solid #c4b5fd;
  outline-offset: 2px;
}
</style>
