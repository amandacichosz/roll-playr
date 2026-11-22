<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

const minutes = ref<number | string>('')
const seconds = ref<number | string>('')
const state = ref<'setup' | 'ready' | 'running' | 'paused' | 'finished'>('setup')
const remainingMs = ref(0)
const error = ref('')
const minutesInput = useTemplateRef<HTMLInputElement>('minutesInput')
const countdownButton = useTemplateRef<HTMLButtonElement>('countdownButton')
const resetButton = useTemplateRef<HTMLButtonElement>('resetButton')

let durationMs = 0
let deadline = 0
let countdownTimeout: number | undefined
let lastTickSecond: number | undefined
let audio: AudioContext | undefined
let activeTone: OscillatorNode | undefined

const remainingSeconds = computed(() => Math.ceil(remainingMs.value / 1000))
const timeLeft = computed(() => {
  const mm = String(Math.floor(remainingSeconds.value / 60)).padStart(2, '0')
  const ss = String(remainingSeconds.value % 60).padStart(2, '0')
  return `${mm}:${ss}`
})

function prepareAudio() {
  if (!window.AudioContext) return
  try {
    audio ??= new AudioContext()
    void audio.resume().catch(() => {})
  } catch {
    // The countdown still works if audio is unavailable.
  }
}

function playSound(frequencies: number[], noteLength: number) {
  if (!audio || audio.state === 'closed') return
  // Replace any tone still queued if the browser has suspended audio.
  activeTone?.stop()
  const oscillator = audio.createOscillator()
  const volume = audio.createGain()
  const now = audio.currentTime

  oscillator.type = 'sine'
  oscillator.connect(volume)
  volume.connect(audio.destination)
  for (const [index, frequency] of frequencies.entries()) {
    const noteStart = now + index * noteLength
    oscillator.frequency.setValueAtTime(frequency, noteStart)
    volume.gain.setValueAtTime(0, noteStart)
    volume.gain.linearRampToValueAtTime(0.2, noteStart + noteLength * 0.1)
    volume.gain.linearRampToValueAtTime(0, noteStart + noteLength * 0.9)
  }
  oscillator.onended = () => {
    oscillator.disconnect()
    volume.disconnect()
    if (activeTone === oscillator) activeTone = undefined
  }
  activeTone = oscillator
  oscillator.start(now)
  oscillator.stop(now + frequencies.length * noteLength)
}

function updateCountdown() {
  if (state.value !== 'running') return
  window.clearTimeout(countdownTimeout)
  remainingMs.value = Math.max(0, deadline - Date.now())

  if (remainingMs.value === 0) {
    const hadCountdownFocus = document.activeElement === countdownButton.value
    state.value = 'finished'
    playSound([660, 880, 990], 0.2)
    if (hadCountdownFocus) void nextTick(() => resetButton.value?.focus())
    return
  }

  const secondsLeft = remainingSeconds.value
  if (secondsLeft <= 10 && secondsLeft !== lastTickSecond) {
    lastTickSecond = secondsLeft
    playSound([1200], 0.06)
  }

  // Schedule the next update when the displayed second changes.
  countdownTimeout = window.setTimeout(updateCountdown, remainingMs.value % 1000 || 1000)
}

function runCountdown() {
  prepareAudio()
  if (state.value !== 'paused') lastTickSecond = undefined
  state.value = 'running'
  deadline = Date.now() + remainingMs.value
  updateCountdown()
}

function startTimer() {
  if (state.value !== 'setup') return
  const mm = Number(minutes.value)
  const ss = Number(seconds.value)
  if (!Number.isInteger(mm) || mm < 0 || mm > 99 || !Number.isInteger(ss) || ss < 0 || ss > 59) {
    error.value = 'Enter 0–99 minutes and 0–59 seconds.'
    return
  }

  const duration = mm * 60 + ss
  if (duration === 0) {
    error.value = 'Enter a time greater than zero.'
    minutesInput.value?.focus()
    return
  }

  durationMs = duration * 1000
  remainingMs.value = durationMs
  runCountdown()
  void nextTick(() => countdownButton.value?.focus())
}

function toggleCountdown() {
  if (state.value === 'ready' || state.value === 'paused') {
    runCountdown()
    return
  }

  updateCountdown()
  if (state.value === 'running') {
    window.clearTimeout(countdownTimeout)
    activeTone?.stop()
    state.value = 'paused'
  }
}

function resetTimer() {
  window.clearTimeout(countdownTimeout)
  activeTone?.stop()
  remainingMs.value = durationMs
  state.value = 'ready'
  void nextTick(() => countdownButton.value?.focus())
}

function newTimer() {
  activeTone?.stop()
  minutes.value = ''
  seconds.value = ''
  error.value = ''
  state.value = 'setup'
  void nextTick(() => minutesInput.value?.focus())
}

onMounted(() => document.addEventListener('visibilitychange', updateCountdown))

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', updateCountdown)
  window.clearTimeout(countdownTimeout)
  activeTone?.stop()
  void audio?.close().catch(() => {})
})
</script>

<template>
  <main class="timer">
    <div class="timer-panel">
      <form
        v-if="state === 'setup'"
        class="timer-setup"
        @submit.prevent="startTimer"
        @input="error = ''"
      >
        <fieldset>
          <legend>Set a duration</legend>
          <div class="timer-fields">
            <label>
              Minutes
              <input
                ref="minutesInput"
                v-model.number="minutes"
                type="number"
                inputmode="numeric"
                min="0"
                max="99"
                step="1"
                placeholder="00"
              />
            </label>
            <label>
              Seconds
              <input
                v-model.number="seconds"
                type="number"
                inputmode="numeric"
                min="0"
                max="59"
                step="1"
                placeholder="00"
              />
            </label>
          </div>
        </fieldset>
        <p v-if="error" class="timer-message" role="alert">{{ error }}</p>
        <button type="submit" class="timer-button primary-button">Start timer</button>
      </form>

      <div v-else class="timer-countdown">
        <p class="timer-display" role="timer" :class="{ 'is-finished': state === 'finished' }">
          {{ timeLeft }}
        </p>
        <p class="timer-message" role="status">
          <template v-if="state === 'paused'">Paused</template>
          <template v-else-if="state === 'finished'">Time’s up!</template>
        </p>
        <div class="timer-actions">
          <button
            v-if="state !== 'finished'"
            ref="countdownButton"
            type="button"
            class="timer-button primary-button"
            @click="toggleCountdown"
          >
            <template v-if="state === 'ready'">Start</template>
            <template v-else-if="state === 'paused'">Resume</template>
            <template v-else>Pause</template>
          </button>
          <button
            v-if="state !== 'ready'"
            ref="resetButton"
            type="button"
            class="timer-button"
            @click="resetTimer"
          >
            Reset
          </button>
          <button
            v-if="state === 'finished' || state === 'ready'"
            type="button"
            class="timer-button"
            :class="{ 'primary-button': state === 'finished' }"
            @click="newTimer"
          >
            New timer
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.timer {
  width: 100%;
  max-width: 32rem;
  margin-inline: auto;
  padding: clamp(1.5rem, 5vw, 3rem) clamp(1rem, 4vw, 2rem);
}

.timer-panel {
  padding: clamp(1rem, 5vw, 2.5rem);
  border: 1px solid var(--color-border);
  border-radius: 1.25rem;
  background: radial-gradient(
    ellipse at top,
    var(--color-surface-elevated),
    var(--color-background)
  );
}

.timer-setup,
.timer-countdown {
  display: grid;
  gap: 1rem;
}

.timer-setup legend {
  margin-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: 750;
}

.timer-fields,
.timer-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.timer-fields label {
  display: grid;
  gap: 0.375rem;
  min-width: 0;
  color: var(--color-text-muted);
  font-weight: 650;
}

.timer-fields input {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.625rem;
  background: var(--color-background);
  color: var(--color-text);
  color-scheme: dark;
  font-variant-numeric: tabular-nums;
}

.timer-display {
  text-align: center;
  font-size: clamp(3rem, 13vw, 6rem);
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
}

.timer-message {
  min-height: 1.5rem;
  color: var(--color-text-muted);
  text-align: center;
}

.is-finished,
.timer-message[role='alert'] {
  color: var(--color-warning);
}

.timer-button {
  min-height: 2.75rem;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 0.625rem;
  background: var(--color-surface-elevated);
  cursor: pointer;
  font-weight: 700;
}

.timer-button:hover {
  border-color: var(--color-secondary);
}

.primary-button {
  border-color: var(--color-secondary);
  background: var(--color-primary);
}

.primary-button:hover {
  background: var(--color-primary-hover);
}

.timer-button:focus-visible,
.timer-fields input:focus-visible {
  outline: 2px solid #c4b5fd;
  outline-offset: 2px;
}
</style>
