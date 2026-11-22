import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, expect, it } from 'vitest'
import ScoreKeeperView from '../views/ScoreKeeperView.vue'

enableAutoUnmount(afterEach)

const storageKey = 'roll-playr:score-keeper:v1'

afterEach(() => sessionStorage.removeItem(storageKey))

it('removes a player and their scores only after confirmation', async () => {
  const game = {
    players: ['AB', 'CD'],
    rounds: [
      [5, 9],
      [2, 4],
    ],
    selectedRound: 1,
    finished: false,
  }
  sessionStorage.setItem(storageKey, JSON.stringify(game))
  const wrapper = mount(ScoreKeeperView)
  const dialog = wrapper.get<HTMLDialogElement>('#remove-player-dialog')
  // jsdom exposes the open state but does not implement the dialog methods.
  dialog.element.showModal = () => {
    dialog.element.open = true
  }
  dialog.element.close = () => {
    dialog.element.open = false
  }
  const remove = () => wrapper.get('[aria-label="Remove AB and all their scores"]').trigger('click')
  const savedGame = () => JSON.parse(sessionStorage.getItem(storageKey)!)

  await wrapper.get('[aria-label="Edit round"]').trigger('click')
  await remove()
  expect(dialog.element.open).toBe(true)
  expect(dialog.get('h2').text()).toBe('Remove AB?')
  expect(savedGame()).toEqual(game)

  await dialog.get('.modal-footer button[type="button"]').trigger('click')
  expect(dialog.element.open).toBe(false)
  expect(savedGame()).toEqual(game)

  await remove()
  await dialog.get('form').trigger('submit')
  expect(dialog.element.open).toBe(false)
  expect(wrapper.find('[aria-label="Remove AB and all their scores"]').exists()).toBe(false)
  expect(savedGame()).toEqual({ ...game, players: ['CD'], rounds: [[9], [4]] })
})
