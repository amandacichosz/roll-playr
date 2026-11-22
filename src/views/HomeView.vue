<script setup lang="ts">
import ToolCard from '@/components/ToolCard.vue'
import playerPickr from '@/assets/images/player-pickr.svg'
import scoreKeeper from '@/assets/images/score-keeper.svg'
import diceRoller from '@/assets/images/dice-roller.svg'
import timer from '@/assets/images/timer.svg'

const tools = [
  {
    title: 'Player Picker',
    description: 'Pick a player at random.',
    icon: playerPickr,
    link: '/player-picker',
  },
  {
    title: 'Score Keeper',
    description: 'Track scores round by round.',
    icon: scoreKeeper,
    link: '/score-keeper',
  },
  {
    title: 'Dice Roller',
    description: 'Roll one or more dice.',
    icon: diceRoller,
    link: '/dice-roller',
  },
  {
    title: 'Timer',
    description: 'Track time for your activities.',
    icon: timer,
    link: '/timer',
  },
]
</script>

<template>
  <main class="home">
    <ul class="tool-grid" role="list">
      <li v-for="tool in tools" :key="tool.link">
        <ToolCard :tool="tool" />
      </li>
    </ul>
  </main>
</template>

<style scoped>
.home {
  width: calc(100% - 84px);
  max-width: 56rem;
  margin-inline: auto;
  padding: clamp(1.75rem, 5vw, 4rem) clamp(1rem, 4vw, 2rem);
}

.tool-grid {
  display: grid;
  gap: clamp(0.75rem, 2.5vw, 1.5rem);
}

@media (min-width: 48rem) {
  .tool-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
