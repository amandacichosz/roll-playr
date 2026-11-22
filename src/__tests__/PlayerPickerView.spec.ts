import { enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, expect, it, vi } from 'vitest'
import DesktopPlayerPicker from '../components/DesktopPlayerPicker.vue'
import MobilePlayerPicker from '../components/MobilePlayerPicker.vue'
import PlayerPickerView from '../views/PlayerPickerView.vue'

enableAutoUnmount(afterEach)
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function mockPrimaryPointer(pointer: 'coarse' | 'fine') {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === `(pointer: ${pointer})` }))
}

it('tracks each finger by touch identifier until it lifts or is canceled', async () => {
  mockPrimaryPointer('coarse')
  const wrapper = mount(PlayerPickerView)
  expect(wrapper.find('.desktop-picker').exists()).toBe(false)
  const surface = wrapper.get('.touch-surface')
  vi.spyOn(surface.element, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 70))
  const first = { identifier: 4, clientX: 80, clientY: 160 }
  const second = { identifier: 7, clientX: 200, clientY: 300 }
  const circles = () => wrapper.findAll<HTMLDivElement>('.touch-circle').map(({ element }) => element)

  await surface.trigger('touchstart', { changedTouches: [first] })
  await surface.trigger('touchstart', { changedTouches: [second] })
  const [firstCircle, secondCircle] = circles()
  expect(circles()).toHaveLength(2)
  expect(firstCircle!.style.color).not.toBe(secondCircle!.style.color)
  expect(firstCircle!.style.left).toBe('70px')
  expect(firstCircle!.style.top).toBe('90px')

  await surface.trigger('touchmove', { changedTouches: [{ ...first, clientX: 100 }] })
  expect(firstCircle!.style.left).toBe('90px')
  expect(secondCircle!.style.left).toBe('190px')

  await surface.trigger('touchend', { changedTouches: [second] })
  expect(circles()).toEqual([firstCircle])

  await surface.trigger('touchcancel', { changedTouches: [first] })
  expect(circles()).toHaveLength(0)
})

it('picks one remaining touch after two seconds without joins or lifts', async () => {
  mockPrimaryPointer('coarse')
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0.75)
  const vibrate = vi.fn()
  vi.stubGlobal('navigator', { vibrate })
  const wrapper = mount(PlayerPickerView)
  const surface = wrapper.get('.touch-surface')
  const winner = () => wrapper.find<HTMLDivElement>('.touch-circle--winner')
  const trails = () => wrapper.findAll<HTMLDivElement>('.touch-trail')
  const first = { identifier: 4, clientX: 80, clientY: 160 }
  const second = { identifier: 7, clientX: 200, clientY: 300 }
  const third = { identifier: 9, clientX: 310, clientY: 450 }

  await surface.trigger('touchstart', { changedTouches: [first, second] })
  vi.advanceTimersByTime(1900)
  await surface.trigger('touchstart', { changedTouches: [third] })
  vi.advanceTimersByTime(1900)
  await surface.trigger('touchend', { changedTouches: [second] })
  vi.advanceTimersByTime(1999)
  await surface.trigger('touchmove', { changedTouches: [{ ...third, clientX: 320 }] })
  expect(winner().exists()).toBe(false)
  expect(wrapper.findAll('.touch-circle')).toHaveLength(2)
  expect(trails()).toHaveLength(0)
  expect(vibrate).not.toHaveBeenCalled()

  vi.advanceTimersByTime(1)
  await nextTick()
  expect(wrapper.findAll('.touch-circle')).toHaveLength(1)
  expect(winner().element.style.left).toBe('320px')
  expect(trails()).toHaveLength(1)
  const trail = trails()[0]!.element.style
  expect(trail.left).toBe('80px')
  expect(trail.top).toBe('160px')
  expect(trail.getPropertyValue('--trail-length')).toBe(`${Math.hypot(240, 290)}px`)
  expect(trail.getPropertyValue('--trail-angle')).toBe(`${Math.atan2(290, 240)}rad`)
  expect(vibrate).toHaveBeenCalledExactlyOnceWith(100)

  await surface.trigger('touchend', { changedTouches: [third] })
  vi.advanceTimersByTime(2000)
  await nextTick()
  expect(winner().element.style.left).toBe('320px')
  expect(vibrate).toHaveBeenCalledTimes(1)

  await surface.trigger('touchend', { changedTouches: [first] })
  expect(winner().exists()).toBe(true)
  await surface.trigger('touchstart', { changedTouches: [second] })
  expect(winner().exists()).toBe(false)
  expect(trails()).toHaveLength(0)
  expect(wrapper.findAll('.touch-circle')).toHaveLength(1)
})

it('rolls for a first player from the desktop roster and can roll again', async () => {
  mockPrimaryPointer('fine')
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValueOnce(0.75).mockReturnValueOnce(0)
  const wrapper = mount(PlayerPickerView)
  expect(wrapper.find('.touch-surface').exists()).toBe(false)
  const form = wrapper.get('form')
  const input = form.get('input')
  const roll = wrapper.get('.roll-button')

  expect(roll.attributes('aria-disabled')).toBe('true')
  await input.setValue('ab')
  await form.trigger('submit')
  await input.setValue('cd')
  await form.trigger('submit')
  await input.setValue('AB')
  await form.trigger('submit')
  expect(form.get('[role="alert"]').text()).toContain('already on the list')

  await roll.trigger('click')
  expect(roll.find('.die--rolling').exists()).toBe(true)
  expect(wrapper.find('.winner').exists()).toBe(false)

  vi.advanceTimersByTime(750)
  await nextTick()
  expect(wrapper.get('.winner p').text()).toBe('First player')
  expect(wrapper.get('.winner strong').text()).toBe('CD')

  await roll.trigger('click')
  vi.advanceTimersByTime(750)
  await nextTick()
  expect(wrapper.get('.winner strong').text()).toBe('AB')

  await form.get('[aria-label="Remove AB"]').trigger('click')
  expect(wrapper.find('.winner').exists()).toBe(false)

  expect(form.get('[aria-label="Remove CD"]').text()).toContain('CD')
})

it('splits an odd desktop roster into balanced teams and preserves the roster when settings change', async () => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0)
  const wrapper = mount(DesktopPlayerPicker, { props: { teamCount: 2 } })
  const form = wrapper.get('form')
  const roll = wrapper.get('.roll-button')
  expect(roll.attributes('aria-disabled')).toBe('true')
  const roster = ['AB', 'CD', 'EF', 'GH', 'IJ']
  for (const player of roster) {
    await form.get('input').setValue(player)
    await form.trigger('submit')
  }

  await roll.trigger('click')
  vi.advanceTimersByTime(750)
  await nextTick()
  const teams = wrapper.findAll('.team-results li p').map((team) => team.text().split(', '))
  expect(teams.map((team) => team.length)).toEqual([3, 2])
  expect(teams.flat().sort()).toEqual(roster)
  expect(wrapper.find('.winner').exists()).toBe(false)

  await roll.trigger('click')
  await wrapper.setProps({ teamCount: 0 })
  vi.advanceTimersByTime(750)
  await nextTick()
  expect(wrapper.find('.team-results').exists()).toBe(false)
  expect(form.findAll('.player-list li')).toHaveLength(roster.length)
  await roll.trigger('click')
  vi.advanceTimersByTime(750)
  await nextTick()
  expect(wrapper.get('.winner strong').text()).toBe('AB')
})

it('waits for enough fingers, labels each mobile player by team, and keeps the result until the next round', async () => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0)
  const wrapper = mount(MobilePlayerPicker, { props: { teamCount: 2 } })
  const surface = wrapper.get('.touch-surface')
  const touches = [1, 2, 3].map((identifier) => ({ identifier, clientX: identifier * 50, clientY: 100 }))
  const teamLabels = () => wrapper.findAll('.team-label').map((label) => label.text())

  await surface.trigger('touchstart', { changedTouches: touches.slice(0, 1) })
  vi.advanceTimersByTime(2000)
  await nextTick()
  expect(teamLabels()).toHaveLength(0)
  expect(wrapper.get('.team-hint').text()).toContain('at least 2 fingers')

  await surface.trigger('touchstart', { changedTouches: touches.slice(1) })
  vi.advanceTimersByTime(2000)
  await nextTick()
  expect(teamLabels().sort()).toEqual(['Team 1', 'Team 1', 'Team 2'])
  expect(wrapper.get('[role="status"]').text()).toBe('2 teams assigned.')
  expect(new Set(wrapper.findAll<HTMLDivElement>('.touch-circle').map(({ element }) => element.style.left)).size).toBe(3)

  await surface.trigger('touchend', { changedTouches: touches })
  expect(teamLabels()).toHaveLength(3)
  await surface.trigger('touchstart', { changedTouches: touches.slice(0, 1) })
  expect(teamLabels()).toHaveLength(0)
})
