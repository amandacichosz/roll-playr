<script setup lang="ts">
import { computed, onUnmounted, reactive, shallowRef, watch } from 'vue'
import { splitIntoTeams } from '@/playerPickerTeams'

const { teamCount = 0 } = defineProps<{ teamCount?: number }>()

interface PlayerTouch {
  x: number
  y: number
  color: string
  team?: number
}

const selectionDelay = 2000
const touches = reactive(new Map<number, PlayerTouch>())
const winner = shallowRef<{
  player: [number, PlayerTouch]
  trails: { id: number; touch: PlayerTouch; length: number; angle: number }[]
}>()
const teamPlayers = shallowRef<[number, PlayerTouch][]>()
const visibleTouches = computed(() => (winner.value ? [winner.value.player] : (teamPlayers.value ?? [...touches])))
const status = computed(() => {
  if (winner.value) return 'Player selected.'
  return teamPlayers.value ? `${teamCount} teams assigned.` : ''
})
let nextColor = 0
let selectionTimer: ReturnType<typeof setTimeout> | undefined

function restartSelection() {
  clearTimeout(selectionTimer)
  if (winner.value || teamPlayers.value || touches.size < Math.max(1, teamCount)) return

  selectionTimer = setTimeout(() => {
    const players = [...touches]

    if (teamCount) {
      teamPlayers.value = splitIntoTeams(players, teamCount).flatMap((team, index) => {
        const color = `hsl(${190 + index * 137.508} 85% 65%)`
        return team.map<[number, PlayerTouch]>(([id, touch]) => [id, { ...touch, color, team: index + 1 }])
      })
      navigator.vibrate?.(100)
      return
    }

    const selectedIndex = Math.floor(Math.random() * players.length)
    const player = players[selectedIndex]!
    const [winnerId, winnerTouch] = player
    const trails = players
      .filter(([id]) => id !== winnerId)
      .map(([id, touch]) => {
        const dx = winnerTouch.x - touch.x
        const dy = winnerTouch.y - touch.y
        return { id, touch, length: Math.hypot(dx, dy), angle: Math.atan2(dy, dx) }
      })
    winner.value = { player, trails }
    navigator.vibrate?.(100)
  }, selectionDelay)
}

onUnmounted(() => clearTimeout(selectionTimer))
watch(() => teamCount, () => {
  winner.value = undefined
  teamPlayers.value = undefined
  restartSelection()
})

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
    if (previousCount === 0) {
      winner.value = undefined
      teamPlayers.value = undefined
    }
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
    <p v-if="teamCount && !teamPlayers && touches.size < teamCount" class="team-hint">
      Hold at least {{ teamCount }} fingers, one per player.
    </p>
    <p v-else-if="visibleTouches.length === 0">Touch and hold one finger per player.</p>
    <span class="sr-only" role="status">{{ status }}</span>

    <div
      v-for="{ id, touch, length, angle } in winner?.trails"
      :key="id"
      class="touch-trail"
      aria-hidden="true"
      :style="{
        left: `${touch.x}px`,
        top: `${touch.y}px`,
        color: touch.color,
        '--trail-length': `${length}px`,
        '--trail-angle': `${angle}rad`,
      }"
    ></div>

    <div
      v-for="[id, touch] in visibleTouches"
      :key="id"
      class="touch-circle"
      :class="{ 'touch-circle--winner': winner, 'touch-circle--team': touch.team }"
      aria-hidden="true"
      :style="{ left: `${touch.x}px`, top: `${touch.y}px`, color: touch.color }"
    >
      <span v-if="touch.team" class="team-label">Team {{ touch.team }}</span>
    </div>
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

.team-hint {
  position: absolute;
  inset: 1rem 1rem auto;
  pointer-events: none;
}

.touch-circle,
.touch-trail::before {
  position: absolute;
  width: 8.125rem;
  aspect-ratio: 1;
  translate: -50% -50%;
  border: 4px solid currentColor;
  border-radius: 50%;
  background: color-mix(in srgb, currentColor 32%, transparent);
  box-shadow: 0 0 1.5rem color-mix(in srgb, currentColor 65%, transparent);
  pointer-events: none;
}

.touch-circle {
  animation: touch-pulse 1.2s ease-in-out infinite;
}

.touch-circle--team {
  display: grid;
  width: 6rem;
  place-items: center;
  animation: none;
}

.team-label {
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  background: var(--color-background);
  color: var(--color-text);
  font-weight: 750;
  text-align: center;
}

.touch-trail {
  position: absolute;
  pointer-events: none;
}

.touch-trail::before {
  content: '';
  inset: 0 auto auto 0;
  animation: touch-collapse 220ms ease-in forwards;
}

.touch-trail::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: var(--trail-length);
  height: 4px;
  translate: 0 -50%;
  rotate: var(--trail-angle);
  transform-origin: left center;
  border-radius: 999px;
  background: currentColor;
  box-shadow: 0 0 0.75rem currentColor;
  animation: touch-trace 440ms ease-out 220ms both;
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

  60% {
    scale: 1.65;
  }

  100% {
    scale: 0.85;
  }
}

@keyframes touch-collapse {
  from {
    scale: 1;
  }

  to {
    scale: 0.025;
    visibility: hidden;
  }
}

@keyframes touch-trace {
  from {
    scale: 0 1;
    opacity: 0;
  }

  55% {
    scale: 1;
    opacity: 1;
  }

  to {
    scale: 1;
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .touch-circle {
    animation: none;
  }

  .touch-trail {
    display: none;
  }
}
</style>
