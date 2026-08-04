<script setup lang="ts">
  import { ref } from 'vue'
  import ToolCard from '@/components/ToolCard.vue'

  import scoreKeeper from '@/assets/images/score-keeper.svg'
  import playerPickr from '@/assets/images/player-pickr.svg'

  const tools = ref([
    {
      title: 'Player Picker',
      icon: playerPickr,
      link: '/player-picker'
    }, {
      title: 'Score Keeper',
      icon: scoreKeeper,
      link: '/score-keeper'
    }
  ])
</script>


<template>
  <div class="p-4">
    <ul class="flex flex-wrap gap-2">
      <li v-for="tool in tools" :key="tool.title">
        <ToolCard :tool="tool"/>
      </li>
    </ul>
  </div>
</template>