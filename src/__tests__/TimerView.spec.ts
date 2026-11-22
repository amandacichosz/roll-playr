import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import TimerView from '../views/TimerView.vue'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('pauses between seconds, resumes from the same point, and resets to a stopped countdown', async () => {
  vi.useFakeTimers()
  const wrapper = mount(TimerView)
  const display = () => wrapper.get('[role="timer"]').text()

  try {
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('[role="alert"]').text()).toBe('Enter a time greater than zero.')

    await wrapper.get('input[max="99"]').setValue(1)
    await wrapper.get('input[max="59"]').setValue(5)
    await wrapper.get('form').trigger('submit')
    expect(display()).toBe('01:05')

    vi.advanceTimersByTime(1500)
    await wrapper.get('.primary-button').trigger('click')
    expect(display()).toBe('01:04')
    vi.advanceTimersByTime(3000)
    expect(wrapper.get('[role="status"]').text()).toBe('Paused')
    expect(display()).toBe('01:04')

    await wrapper.get('.primary-button').trigger('click')
    vi.advanceTimersByTime(500)
    await nextTick()
    expect(display()).toBe('01:03')

    await wrapper.get('.timer-actions button:last-child').trigger('click')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.get('.primary-button').text()).toBe('Start')
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(2000)
    expect(display()).toBe('01:05')

    await wrapper.get('.primary-button').trigger('click')
    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(display()).toBe('01:04')

    await wrapper.get('.timer-actions button:last-child').trigger('click')
    await wrapper.get('.timer-actions button:last-child').trigger('click')
    expect(wrapper.get<HTMLInputElement>('input[max="99"]').element.value).toBe('')
    expect(wrapper.get<HTMLInputElement>('input[max="59"]').element.value).toBe('')
  } finally {
    wrapper.unmount()
  }
})

it('ticks once per second from ten to one and plays a distinct chime at zero', async () => {
  vi.useFakeTimers()
  const startTone = vi.fn()
  const setFrequency = vi.fn()
  const resumeAudio = vi.fn().mockResolvedValue(undefined)
  const closeAudio = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal(
    'AudioContext',
    class {
      state = 'running'
      currentTime = 0
      resume = resumeAudio
      close = closeAudio
      createOscillator() {
        return {
          connect: vi.fn(),
          start: startTone,
          stop: vi.fn(),
          frequency: { setValueAtTime: setFrequency },
        }
      }
      createGain() {
        return {
          connect: vi.fn(),
          gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        }
      }
    },
  )
  const wrapper = mount(TimerView)
  const secondsInput = () => wrapper.get<HTMLInputElement>('input[max="59"]')

  try {
    await secondsInput().setValue(12)
    await wrapper.get('form').trigger('submit')
    expect(resumeAudio).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(1000)
    expect(startTone).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)
    expect(startTone).toHaveBeenCalledOnce()
    expect(setFrequency).toHaveBeenLastCalledWith(1200, 0)

    await wrapper.get('.primary-button').trigger('click')
    vi.advanceTimersByTime(3000)
    await wrapper.get('.primary-button').trigger('click')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(startTone).toHaveBeenCalledOnce()

    for (let count = 2; count <= 10; count++) {
      vi.advanceTimersByTime(1000)
      expect(startTone).toHaveBeenCalledTimes(count)
      expect(setFrequency).toHaveBeenLastCalledWith(1200, 0)
    }

    vi.advanceTimersByTime(1000)
    await nextTick()

    expect(wrapper.get('[role="timer"]').text()).toBe('00:00')
    expect(wrapper.get('[role="status"]').text()).toBe('Time’s up!')
    expect(startTone).toHaveBeenCalledTimes(11)
    expect(setFrequency.mock.calls.slice(-3).map(([frequency]) => frequency)).toEqual([
      660, 880, 990,
    ])
    const [reset, newTimer] = wrapper.findAll('.timer-actions button')
    expect([reset?.text(), newTimer?.text()]).toEqual(['Reset', 'New timer'])

    await reset!.trigger('click')
    expect(wrapper.get('[role="timer"]').text()).toBe('00:12')
    expect(wrapper.find('form').exists()).toBe(false)
    await wrapper.get('.primary-button').trigger('click')
    vi.advanceTimersByTime(12000)
    await nextTick()
    await wrapper.get('.timer-actions .primary-button').trigger('click')
    expect(secondsInput().element.value).toBe('')
    expect(startTone).toHaveBeenCalledTimes(22)

    await secondsInput().setValue(2)
    await wrapper.get('form').trigger('submit')
    expect(startTone).toHaveBeenCalledTimes(23)
    expect(setFrequency).toHaveBeenLastCalledWith(1200, 0)
  } finally {
    wrapper.unmount()
  }
  expect(closeAudio).toHaveBeenCalledOnce()
})
