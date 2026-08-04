<script setup lang="ts">
import { reactive } from 'vue'
import BaseCard from '@/components/BaseCard.vue'

interface Player {
  id: number
  name: string
  score: number
}
interface Form { players: Player[] }

const form = reactive<Form>({
  players: []
})

const onSubmit = async () => {
  console.log('form', form)
}
</script>


<template>
  <div class="flex h-full p-4">
    <BaseCard title="Score Keeper" class="min-h-full min-w-full">
      <template #headerActions>
        <button @click="form.players.push({ id: form.players.length + 1, name: '', score: 0 })">+ Add Player</button>
      </template>
      <form @submit.prevent="onSubmit">
        <div v-for="player in form.players" :key="player.id">
          <input type="text" v-model="player.name" />
          <input type="text" v-model="player.score" />
        </div>
      </form>
      <template #footer>
        <button type="submit">Submit</button>
      </template>
    </BaseCard>
  </div>
</template>

