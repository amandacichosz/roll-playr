<script setup lang="ts">
  import { ref } from 'vue'
  import BaseHeader from "@/components/BaseHeader.vue"
  import BaseCard from "@/components/BaseCard.vue"

  import scoreKeeper from "@/assets/images/score-keeper.svg"
  import playerPickr from "@/assets/images/player-pickr.svg"

  const tools = ref([
    {
      title: 'Player Picker',
      icon: playerPickr,
      link: '/tool-1'
    }, {
      title: 'Score Keeper',
      icon: scoreKeeper,
      link: '/tool-2'
    }
  ])
</script>

<template>
  <BaseHeader />
  <div class="p-4">
    <ul class="flex gap-2">
      <li v-for="tool in tools" :key="tool">
        <BaseCard :config="tool"/>
      </li>
    </ul>
  </div>
</template>

<style scoped>

</style>
