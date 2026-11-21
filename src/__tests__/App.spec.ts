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
})
