import { describe, it, expect, vi, beforeEach } from 'vitest'
import { trackEvent } from '../analytics'

describe('trackEvent', () => {
  beforeEach(() => {
    window.plausible = vi.fn()
  })

  it('calls window.plausible with the event name', () => {
    trackEvent('Session Created')
    expect(window.plausible).toHaveBeenCalledWith('Session Created', undefined)
  })

  it('passes props when provided', () => {
    trackEvent('Template Used', { template: 'cuban-missile', discipline: 'Political Science' })
    expect(window.plausible).toHaveBeenCalledWith('Template Used', {
      props: { template: 'cuban-missile', discipline: 'Political Science' },
    })
  })

  it('does not throw when plausible is undefined', () => {
    window.plausible = undefined
    expect(() => trackEvent('anything')).not.toThrow()
  })

  it('does not throw when plausible itself throws', () => {
    window.plausible = vi.fn(() => { throw new Error('plausible crash') })
    expect(() => trackEvent('anything')).not.toThrow()
  })
})
