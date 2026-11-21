<script setup lang="ts">
import { onUnmounted, ref, useTemplateRef } from 'vue'

const rollDuration = 750
const initials = ref('')
const players = ref<string[]>([])
const error = ref('')
const winner = ref('')
const rolling = ref(false)
const initialsInput = useTemplateRef<HTMLInputElement>('initialsInput')
let rollTimer: ReturnType<typeof setTimeout> | undefined

onUnmounted(() => clearTimeout(rollTimer))

function addPlayer() {
  if (rolling.value) return

  const player = initials.value.trim().toUpperCase()
  if (!/^\p{L}{1,4}$/u.test(player)) {
    error.value = 'Enter 1–4 letters.'
  } else if (players.value.includes(player)) {
    error.value = `${player} is already on the list.`
  } else {
    players.value.push(player)
    initials.value = ''
    error.value = ''
    winner.value = ''
  }

  initialsInput.value?.focus()
}

function removePlayer(player: string) {
  players.value = players.value.filter((initials) => initials !== player)
  winner.value = ''
  error.value = ''
  initialsInput.value?.focus()
}

function roll() {
  if (rolling.value || players.value.length === 0) return

  const selected = players.value[Math.floor(Math.random() * players.value.length)]!
  winner.value = ''
  rolling.value = true
  rollTimer = setTimeout(() => {
    winner.value = selected
    rolling.value = false
  }, rollDuration)
}
</script>

<template>
  <div class="desktop-picker">
    <form class="players" @submit.prevent="addPlayer">
      <fieldset :disabled="rolling">
        <label for="picker-initials">Player initials</label>
        <div class="player-entry">
          <input
            id="picker-initials"
            ref="initialsInput"
            v-model="initials"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            :aria-invalid="!!error"
            :aria-describedby="error ? 'picker-error' : undefined"
            @input="error = ''"
          />
          <button class="add-player" type="submit">Add player</button>
        </div>
        <p v-if="error" id="picker-error" class="error" role="alert">{{ error }}</p>

        <ul v-if="players.length" class="player-list" aria-label="Players">
          <li v-for="player in players" :key="player">
            <button type="button" :aria-label="`Remove ${player}`" @click="removePlayer(player)">
              {{ player }} <span aria-hidden="true">×</span>
            </button>
          </li>
        </ul>
      </fieldset>
    </form>

    <section class="roll-area" aria-label="Roll for first player">
      <div role="status" aria-atomic="true">
        <div v-if="winner" class="winner">
          <p>First player</p>
          <strong>{{ winner }}</strong>
        </div>
      </div>

      <button
        class="roll-button"
        type="button"
        :aria-disabled="rolling || players.length === 0"
        @click="roll"
      >
        <span
          class="die"
          :class="{ 'die--rolling': rolling }"
          :style="{ '--roll-duration': `${rollDuration}ms` }"
          aria-hidden="true"
        >
          <span v-for="pip in 5" :key="pip" class="pip"></span>
        </span>
        <span>{{ rolling ? 'Rolling…' : winner ? 'Roll again' : 'Roll the die' }}</span>
      </button>
    </section>
  </div>
</template>

<style scoped>
.desktop-picker {
  display: grid;
  width: min(100%, 44rem);
  gap: 1rem;
  margin-inline: auto;
  padding: clamp(1rem, 4vw, 2rem) 1rem 2rem;
}

.players,
.roll-area {
  border: 1px solid var(--color-border);
  border-radius: 1.25rem;
}

.players {
  padding: clamp(1rem, 4vw, 1.5rem);
  background: var(--color-surface-elevated);
}

.players label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.player-entry {
  display: flex;
  gap: 0.5rem;
}

.player-entry input,
.add-player,
.player-list button {
  min-height: 2.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.625rem;
}

.player-entry input {
  flex: 1;
  min-width: 0;
  padding-inline: 0.75rem;
  background: var(--color-background);
  text-transform: uppercase;
}

.add-player,
.player-list button {
  padding-inline: 0.875rem;
  font-weight: 700;
  cursor: pointer;
}

.add-player {
  background: var(--color-primary);
}

.add-player:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.player-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.875rem;
}

.player-list button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-surface);
}

.player-list button:hover:not(:disabled) {
  border-color: var(--color-secondary);
}

.player-list span {
  color: var(--color-text-muted);
  font-size: 1.25rem;
}

.error {
  margin-top: 0.5rem;
  color: #fda4af;
}

.roll-area {
  display: flex;
  min-height: 21rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: radial-gradient(ellipse at center, var(--color-surface-elevated), var(--color-background));
  text-align: center;
}

.roll-button {
  display: grid;
  justify-items: center;
  gap: 0.875rem;
  padding: 0.75rem;
  border-radius: 0.875rem;
  font-weight: 700;
  cursor: pointer;
}

.roll-button[aria-disabled='true'] {
  color: var(--color-text-muted);
  cursor: default;
}

.die {
  display: grid;
  width: 5rem;
  aspect-ratio: 1;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  place-items: center;
  padding: 0.625rem;
  border: 1px solid #ede9fe;
  border-radius: 1.125rem;
  background: linear-gradient(140deg, #faf5ff, #c4b5fd);
  box-shadow: 0 5px 0 #7c3aed, 0 14px 28px rgb(15 11 23 / 60%);
  transform: rotate(-12deg);
  transition: transform 160ms ease-out;
}

.roll-button:not([aria-disabled='true']):hover .die {
  transform: translateY(-4px) rotate(0);
}

.pip {
  width: 0.65rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #4c1d95;
}

.pip:nth-child(1) { grid-area: 1 / 1; }
.pip:nth-child(2) { grid-area: 1 / 3; }
.pip:nth-child(3) { grid-area: 2 / 2; }
.pip:nth-child(4) { grid-area: 3 / 1; }
.pip:nth-child(5) { grid-area: 3 / 3; }

.die--rolling {
  animation: dice-roll var(--roll-duration) ease-in-out;
}

.winner {
  margin-bottom: 0.75rem;
  animation: show-winner 350ms ease-out;
}

.winner p {
  color: #fde68a;
  font-weight: 750;
}

.winner strong {
  display: block;
  font-size: clamp(2.5rem, 10vw, 4rem);
  font-weight: 850;
  line-height: 1.1;
  text-shadow: 0 0 1.5rem rgb(139 92 246 / 65%);
}

:focus-visible {
  outline: 2px solid #c4b5fd;
  outline-offset: 2px;
}

@keyframes dice-roll {
  0% { transform: rotate(-12deg); }
  40% { transform: translateY(-2rem) rotate(165deg) scale(1.15); }
  75% { transform: translateY(0.25rem) rotate(310deg) scale(0.92); }
  100% { transform: rotate(348deg); }
}

@keyframes show-winner {
  from { opacity: 0; transform: translateY(0.5rem) scale(0.85); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .die,
  .winner {
    animation: none;
    transition: none;
  }
}
</style>
