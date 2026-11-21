<script setup lang="ts">
import { computed, onUnmounted, reactive, shallowRef } from 'vue'

interface PlayerTouch {
  x: number
  y: number
  color: string
}

const selectionDelay = 2000
const touches = reactive(new Map<number, PlayerTouch>())
const winner = shallowRef<[number, PlayerTouch]>()
const visibleTouches = computed(() => (winner.value ? [winner.value] : [...touches]))
let nextColor = 0
let selectionTimer: ReturnType<typeof setTimeout> | undefined

function restartSelection() {
  clearTimeout(selectionTimer)
  if (winner.value || touches.size === 0) return

  selectionTimer = setTimeout(() => {
    const players = [...touches]
    winner.value = players[Math.floor(Math.random() * players.length)]
    navigator.vibrate?.(100)
  }, selectionDelay)
}

onUnmounted(() => clearTimeout(selectionTimer))

function updateTouches(event: TouchEvent) {
  const surface = event.currentTarget as HTMLElement
  const bounds = surface.getBoundingClientRect()
  const previousCount = touches.size

  for (const touch of Array.from(event.changedTouches)) {
    const player = touches.get(touch.identifier)
    if (!player && event.type !== 'touchstart') continue

    touches.set(touch.identifier, {
      x: touch.clientX - bounds.left,
      y: touch.clientY - bounds.top,
      color: player?.color ?? `hsl(${(nextColor++ * 137.508) % 360} 85% 65%)`,
    })
  }

  if (touches.size !== previousCount) {
    if (previousCount === 0) winner.value = undefined
    restartSelection()
  }
}

function removeTouches(event: TouchEvent) {
  const previousCount = touches.size
  for (const touch of Array.from(event.changedTouches)) {
    touches.delete(touch.identifier)
  }

  if (touches.size === 0) nextColor = 0
  if (touches.size !== previousCount) restartSelection()
}
</script>

<template>
  <div
    class="touch-surface"
    @touchstart="updateTouches"
    @touchmove="updateTouches"
    @touchend="removeTouches"
    @touchcancel="removeTouches"
    @contextmenu.prevent
  >
    <p v-if="visibleTouches.length === 0">Touch and hold one finger per player.</p>
    <span class="sr-only" role="status">{{ winner ? 'Player selected.' : '' }}</span>

    <div
      v-for="[id, touch] in visibleTouches"
      :key="id"
      class="touch-circle"
      :class="{ 'touch-circle--winner': winner }"
      aria-hidden="true"
      :style="{ left: `${touch.x}px`, top: `${touch.y}px`, color: touch.color }"
    ></div>
  </div>
</template>

<style scoped>
.touch-surface {
  position: relative;
  display: grid;
  flex: 1;
  min-height: 0;
  place-items: center;
  overflow: hidden;
  padding: 1rem;
  background: var(--color-background);
  touch-action: none;
  user-select: none;
  -webkit-touch-callout: none;
}

.touch-surface p {
  color: var(--color-text-muted);
  text-align: center;
}

.touch-circle {
  position: absolute;
  width: 7.5rem;
  aspect-ratio: 1;
  translate: -50% -50%;
  border: 4px solid currentColor;
  border-radius: 50%;
  background: color-mix(in srgb, currentColor 32%, transparent);
  box-shadow: 0 0 1.5rem color-mix(in srgb, currentColor 65%, transparent);
  pointer-events: none;
  animation: touch-pulse 1.2s ease-in-out infinite;
}

.touch-circle--winner {
  scale: 0.85;
  background: color-mix(in srgb, currentColor 52%, transparent);
  box-shadow: 0 0 2rem color-mix(in srgb, currentColor 85%, transparent);
  animation: touch-winner 850ms ease-in-out;
}

@keyframes touch-pulse {
  0%, 100% {
    scale: 1;
    opacity: 0.8;
  }

  50% {
    scale: 1.08;
    opacity: 1;
  }
}

@keyframes touch-winner {
  0% {
    scale: 1;
  }

  40% {
    scale: 1.65;
  }

  100% {
    scale: 0.85;
  }
}

@media (prefers-reduced-motion: reduce) {
  .touch-circle {
    animation: none;
  }
}
</style>
