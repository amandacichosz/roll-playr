import { describe, it, expect } from 'vitest'

import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '../App.vue'
import appRouter from '../router'

describe('App', () => {
  it.each([
    ['/player-picker', 'Player Picker'],
    ['/score-keeper', 'Score Keeper'],
  ])('shows the tool header at %s and links back home', async (path, title) => {
    const router = createRouter({ history: createMemoryHistory(), routes: appRouter.options.routes })
    await router.push(path)
    const wrapper = mount(App, { global: { plugins: [router] } })

    expect(wrapper.findAll('h1').map((heading) => heading.text())).toEqual([title])

    await wrapper.get('header a[aria-label="Back to home"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/')
    wrapper.unmount()
  })

  it('opens Player Picker settings from the shared header and applies only saved changes', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: appRouter.options.routes })
    await router.push('/player-picker')
    const wrapper = mount(App, { global: { plugins: [router] } })
    const dialog = wrapper.get<HTMLDialogElement>('#player-picker-settings')
    // jsdom does not implement the native modal methods.
    dialog.element.showModal = () => { dialog.element.open = true }
    dialog.element.close = () => { dialog.element.open = false }

    try {
      const options = wrapper.get('header button[aria-label="Player Picker options"]')
      await options.trigger('click')
      expect(dialog.element.open).toBe(true)

      await dialog.get('input[type="checkbox"]').setValue(true)
      expect(dialog.get<HTMLInputElement>('input[type="number"]').element.value).toBe('2')
      await dialog.get('footer button[type="button"]').trigger('click')
      expect(dialog.element.open).toBe(false)
      expect(wrapper.get('.roll-button').text()).toContain('Roll the die')

      await options.trigger('click')
      expect(dialog.get<HTMLInputElement>('input[type="checkbox"]').element.checked).toBe(false)
      await dialog.get('input[type="checkbox"]').setValue(true)
      await dialog.get('input[type="number"]').setValue('3')
      await dialog.get('form').trigger('submit')
      expect(dialog.element.open).toBe(false)
      expect(wrapper.get('.team-hint').text()).toContain('at least 3 players')

      await options.trigger('click')
      expect(dialog.get<HTMLInputElement>('input[type="number"]').element.value).toBe('3')
      await dialog.get('input[type="checkbox"]').setValue(false)
      await dialog.get('form').trigger('submit')
      expect(wrapper.get('.roll-button').text()).toContain('Roll the die')
    } finally {
      wrapper.unmount()
    }
  })

  it('plays a fixed number of rounds and picks the lowest total from Score Keeper settings', async () => {
    const storageKey = 'roll-playr:score-keeper:v1'
    sessionStorage.setItem(storageKey, JSON.stringify({
      players: ['AB', 'CD'],
      rounds: [[5, 9]],
      selectedRound: 0,
      finished: false,
    }))
    const router = createRouter({ history: createMemoryHistory(), routes: appRouter.options.routes })
    await router.push('/score-keeper')
    const wrapper = mount(App, { global: { plugins: [router] } })
    const dialog = wrapper.get<HTMLDialogElement>('#score-keeper-settings')
    dialog.element.showModal = () => { dialog.element.open = true }
    dialog.element.close = () => { dialog.element.open = false }

    try {
      const options = wrapper.get('header button[aria-label="Score Keeper options"]')
      const roundCount = dialog.get<HTMLInputElement>('input[type="number"]')
      const highest = dialog.get<HTMLInputElement>('input[value="highest"]')
      const lowest = dialog.get('input[value="lowest"]')
      const standings = () => wrapper.findAll('tbody .initials').map((player) => player.text())

      await options.trigger('click')
      expect(dialog.element.open).toBe(true)
      expect(highest.element.checked).toBe(true)
      expect(standings()).toEqual(['CD', 'AB'])
      await lowest.setValue()
      await roundCount.setValue('2')
      await dialog.get('footer button[type="button"]').trigger('click')
      expect(dialog.element.open).toBe(false)
      expect(wrapper.get('#round-heading').text()).toBe('Round 1')

      await options.trigger('click')
      expect(highest.element.checked).toBe(true)
      expect(roundCount.element.value).toBe('')
      await lowest.setValue()
      await roundCount.setValue('2')
      await dialog.get('form').trigger('submit')
      expect(dialog.element.open).toBe(false)
      expect(wrapper.get('#round-heading').text()).toBe('Round 1 of 2')
      expect(standings()).toEqual(['AB', 'CD'])
      expect(wrapper.find('.game-alert').exists()).toBe(false)
      expect(wrapper.find('.finish-button').exists()).toBe(false)
      expect(JSON.parse(sessionStorage.getItem(storageKey)!).settings).toEqual({
        winningCondition: 'lowest',
        roundLimit: 2,
      })

      await wrapper.get('.game-actions .primary-button').trigger('click')
      expect(wrapper.get('#round-heading').text()).toBe('Round 2 of 2')
      expect(wrapper.get('.game-alert').text()).toContain('1 round left')
      await wrapper.get('[aria-label="Round 2 score for AB"]').setValue('3')
      await wrapper.get('[aria-label="Round 2 score for CD"]').setValue('2')
      expect(wrapper.findAll('.game-actions button').map((button) => button.text()))
        .toEqual(['Finish game'])
      await wrapper.get('.finish-button').trigger('click')
      expect(wrapper.get('#result-heading').text()).toBe('AB wins!')
    } finally {
      wrapper.unmount()
      sessionStorage.removeItem(storageKey)
    }
  })

  it('warns at two thirds of the point target and finishes when the score is committed', async () => {
    const storageKey = 'roll-playr:score-keeper:v1'
    sessionStorage.setItem(storageKey, JSON.stringify({
      players: ['AB', 'CD'],
      rounds: [[133, 120]],
      selectedRound: 0,
      finished: false,
    }))
    const router = createRouter({ history: createMemoryHistory(), routes: appRouter.options.routes })
    await router.push('/score-keeper')
    const wrapper = mount(App, { global: { plugins: [router] } })
    const dialog = wrapper.get<HTMLDialogElement>('#score-keeper-settings')
    dialog.element.showModal = () => { dialog.element.open = true }
    dialog.element.close = () => { dialog.element.open = false }

    try {
      await wrapper.get('[aria-label="Score Keeper options"]').trigger('click')
      await dialog.get('[aria-label="Number of rounds"]').setValue('3')
      await dialog.get('input[value="target"]').setValue()
      expect(dialog.find('[aria-label="Number of rounds"]').exists()).toBe(false)
      await dialog.get('.point-target input').setValue('200')
      await dialog.get('form').trigger('submit')
      expect(dialog.element.open).toBe(false)
      expect(JSON.parse(sessionStorage.getItem(storageKey)!).settings).toEqual({
        winningCondition: 'target',
        roundLimit: null,
        pointTarget: 200,
      })
      expect(wrapper.find('.game-alert').exists()).toBe(false)

      const score = wrapper.get('[aria-label="Round 1 score for CD"]')
      await score.trigger('focus')
      await score.setValue('134')
      expect(wrapper.get('.game-alert').text()).toBe('CD is close to winning with 134 of 200 points.')
      expect(wrapper.findAll('tbody .initials').map((player) => player.text())).toEqual(['AB', 'CD'])
      await score.trigger('blur')
      expect(wrapper.findAll('tbody .initials').map((player) => player.text())).toEqual(['CD', 'AB'])

      await score.setValue('201')
      expect(wrapper.find('#result-heading').exists()).toBe(false)
      await score.trigger('blur')
      expect(wrapper.get('#result-heading').text()).toBe('CD wins!')
      expect(wrapper.findAll('.player-result h3').map((player) => player.text())).toEqual(['CD', 'AB'])
    } finally {
      wrapper.unmount()
      sessionStorage.removeItem(storageKey)
    }
  })
})
