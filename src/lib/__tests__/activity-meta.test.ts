import { describe, it, expect } from 'vitest'
import { ACTIVITY_META } from '../activity-meta'
import type { ActivityType } from '../types'

const ACTIVITY_TYPES: ActivityType[] = [
  'peer_critique',
  'socratic_chain',
  'peer_clarification',
  'evidence_analysis',
  'scenario_solo',
  'scenario_multi',
]

const COLOR_KEYS = ['bg', 'text', 'border', 'badge', 'accent'] as const

describe('ACTIVITY_META', () => {
  it('defines all 6 activity types', () => {
    for (const type of ACTIVITY_TYPES) {
      expect(ACTIVITY_META).toHaveProperty(type)
    }
  })

  for (const type of ACTIVITY_TYPES) {
    describe(`${type}`, () => {
      it('has label and shortLabel strings', () => {
        expect(typeof ACTIVITY_META[type].label).toBe('string')
        expect(ACTIVITY_META[type].label.length).toBeGreaterThan(0)
        expect(typeof ACTIVITY_META[type].shortLabel).toBe('string')
      })

      it('has a non-empty description', () => {
        expect(typeof ACTIVITY_META[type].description).toBe('string')
        expect(ACTIVITY_META[type].description.length).toBeGreaterThan(0)
      })

      it('has at least one round definition', () => {
        expect(ACTIVITY_META[type].rounds.length).toBeGreaterThan(0)
      })

      it('each round has round number, label, emoji, and text', () => {
        for (const round of ACTIVITY_META[type].rounds) {
          expect(typeof round.round).toBe('number')
          expect(round.round).toBeGreaterThan(0)
          expect(typeof round.label).toBe('string')
          expect(typeof round.emoji).toBe('string')
          expect(typeof round.text).toBe('string')
        }
      })

      it('has all 5 color keys', () => {
        for (const key of COLOR_KEYS) {
          expect(ACTIVITY_META[type].color).toHaveProperty(key)
          expect(typeof ACTIVITY_META[type].color[key]).toBe('string')
        }
      })
    })
  }
})
