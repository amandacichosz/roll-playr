<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const pipPositions = [
  [25, 25],
  [50, 25],
  [75, 25],
  [25, 50],
  [50, 50],
  [75, 50],
  [25, 75],
  [50, 75],
  [75, 75],
] as const
const facePips = [[4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]].map(
  (face) => face.map((position) => pipPositions[position]!),
)

const rollDuration = 600
const diceCount = ref(2)
const faces = ref([1, 1])
const rolling = ref(false)
const hasResult = ref(false)
const total = computed(() => faces.value.reduce((sum, face) => sum + face, 0))
let tumbleTimer: number | undefined
let landingTimer: number | undefined

watch(diceCount, (count) => {
  faces.value = Array.from({ length: count }, (_, index) => faces.value[index] ?? 1)
  hasResult.value = false
})

function randomFaces() {
  return faces.value.map(() => 1 + Math.floor(Math.random() * 6))
}

function landDice() {
  window.clearInterval(tumbleTimer)
  faces.value = randomFaces()
  rolling.value = false
  hasResult.value = true
}

function rollDice() {
  if (rolling.value) return

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    landDice()
    return
  }

  rolling.value = true
  faces.value = randomFaces()
  tumbleTimer = window.setInterval(() => {
    faces.value = randomFaces()
  }, 90)
  landingTimer = window.setTimeout(landDice, rollDuration)
}

onBeforeUnmount(() => {
  window.clearInterval(tumbleTimer)
  window.clearTimeout(landingTimer)
})
</script>

<template>
  <main class="dice-roller">
    <div class="dice-controls">
      <label for="dice-count">Number of dice</label>
      <select id="dice-count" v-model.number="diceCount" :disabled="rolling">
        <option v-for="count in 5" :key="count" :value="count">{{ count }}</option>
      </select>
    </div>

    <button
      type="button"
      class="dice-tray"
      :class="{ 'is-rolling': rolling }"
      :style="{ '--roll-duration': `${rollDuration}ms` }"
      :aria-disabled="rolling"
      @click="rollDice"
    >
      <span class="dice" aria-hidden="true">
        <span v-for="(face, index) in faces" :key="index" class="die">
          <svg viewBox="0 0 100 100" class="die-face" fill="currentColor">
            <circle v-for="[x, y] in facePips[face - 1]" :key="`${x}-${y}`" :cx="x" :cy="y" r="7" />
          </svg>
        </span>
      </span>
      <span class="roll-label">{{ diceCount === 1 ? 'Roll die' : 'Roll dice' }}</span>
    </button>

    <p class="roll-result" role="status">
      <template v-if="rolling">Rolling…</template>
      <template v-else-if="hasResult">
        <strong>Total {{ total }}</strong>
        <span v-if="diceCount > 1" class="roll-values">{{ faces.join(' + ') }}</span>
      </template>
    </p>
  </main>
</template>

<style scoped>
.dice-roller {
  width: 100%;
  max-width: 56rem;
  margin-inline: auto;
  padding: clamp(1.5rem, 5vw, 3rem) clamp(1rem, 4vw, 2rem);
}

.dice-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-weight: 650;
}

.dice-controls select {
  appearance: none;
  min-width: 4.5rem;
  min-height: 2.75rem;
  padding-inline: 0.75rem 2rem;
  border: 1px solid var(--color-border);
  border-radius: 0.625rem;
  background: var(--color-surface-elevated)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='m4 6 4 4 4-4' fill='none' stroke='%23B8AECF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")
    no-repeat right 0.75rem center / 1rem;
  color-scheme: dark;
}

@media (forced-colors: active) {
  .dice-controls select {
    appearance: auto;
    background-image: none;
  }
}

.dice-tray {
  display: grid;
  justify-items: center;
  gap: 1.25rem;
  width: 100%;
  padding: clamp(2rem, 6vw, 3.5rem) 1rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 1.25rem;
  background: radial-gradient(
    ellipse at center,
    var(--color-surface-elevated),
    var(--color-background)
  );
  cursor: pointer;
}

.dice-tray:hover {
  border-color: var(--color-secondary);
}

.dice-tray[aria-disabled='true'] {
  cursor: wait;
}

.dice-tray:focus-visible,
.dice-controls select:focus-visible {
  outline: 2px solid #c4b5fd;
  outline-offset: 3px;
}

.dice {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: clamp(1rem, 4vw, 1.75rem);
  max-width: 45rem;
  perspective: 30rem;
}

.die {
  --turn: 1;
  width: clamp(3.25rem, 13vw, 6rem);
  aspect-ratio: 1;
  border: 2px solid #a78bfa;
  border-radius: 22%;
  background: linear-gradient(145deg, var(--color-primary-hover), var(--color-primary-pressed));
  box-shadow:
    inset 0 1px 3px #ddd6fe66,
    0 4px 0 #2e1065,
    0 8px 12px #0f0b1780;
}

.die:nth-child(even) {
  --turn: -1;
}

.die-face {
  display: block;
  width: 100%;
}

.roll-label {
  color: var(--color-text-muted);
  font-weight: 650;
}

.roll-result {
  min-height: 4.5rem;
  margin-top: 1rem;
  text-align: center;
}

.roll-result strong {
  display: block;
  font-size: 1.5rem;
}

.roll-values {
  color: var(--color-text-muted);
}

@media (prefers-reduced-motion: no-preference) {
  .is-rolling .die {
    animation: tumble var(--roll-duration) ease-out;
  }
}

@keyframes tumble {
  24% {
    transform: translateY(-1.25rem) rotateX(105deg) rotateZ(calc(105deg * var(--turn)));
  }

  56% {
    transform: translateY(-0.5rem) rotateX(250deg) rotateZ(calc(255deg * var(--turn)));
  }

  76% {
    transform: translateY(0.2rem) rotateX(360deg) rotateZ(calc(350deg * var(--turn)));
  }

  88% {
    transform: translateY(-0.25rem) rotateX(360deg) rotateZ(calc(365deg * var(--turn)));
  }

  100% {
    transform: translateY(0) rotateX(360deg) rotateZ(calc(360deg * var(--turn)));
  }
}
</style>
