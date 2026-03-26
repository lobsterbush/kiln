import { describe, it, expect } from 'vitest'
import { TEMPLATES, DISCIPLINES } from '../templates'
import type { ActivityType } from '../types'

const VALID_TYPES: ActivityType[] = [
  'peer_critique', 'socratic_chain', 'peer_clarification',
  'evidence_analysis', 'scenario_solo', 'scenario_multi',
]

describe('TEMPLATES', () => {
  it('has at least 15 templates', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(15)
  })

  it('every template has a unique id', () => {
    const ids = TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every template has a valid activity type', () => {
    for (const t of TEMPLATES) {
      expect(VALID_TYPES).toContain(t.type)
    }
  })

  it('every template has a non-empty title and description', () => {
    for (const t of TEMPLATES) {
      expect(t.title.length).toBeGreaterThan(0)
      expect(t.description.length).toBeGreaterThan(0)
    }
  })

  it('every template discipline is one of the defined DISCIPLINES', () => {
    for (const t of TEMPLATES) {
      expect(DISCIPLINES as readonly string[]).toContain(t.discipline)
    }
  })

  it('every template has at least one learning objective', () => {
    for (const t of TEMPLATES) {
      expect(t.config.learning_objectives.length).toBeGreaterThan(0)
    }
  })

  it('scenario templates have scenario_context and student_role', () => {
    const scenarioTemplates = TEMPLATES.filter((t) => t.type === 'scenario_solo' || t.type === 'scenario_multi')
    expect(scenarioTemplates.length).toBeGreaterThan(0)
    for (const t of scenarioTemplates) {
      expect(t.config.scenario_context).toBeTruthy()
      expect(t.config.student_role).toBeTruthy()
      expect(t.config.ai_personas?.length).toBeGreaterThan(0)
    }
  })

  it('peer critique templates have critique_prompt', () => {
    const critiques = TEMPLATES.filter((t) => t.type === 'peer_critique')
    for (const t of critiques) {
      expect(t.config.critique_prompt).toBeTruthy()
    }
  })
})

describe('DISCIPLINES', () => {
  it('has at least 5 disciplines', () => {
    expect(DISCIPLINES.length).toBeGreaterThanOrEqual(5)
  })

  it('includes Political Science and General', () => {
    expect(DISCIPLINES).toContain('Political Science')
    expect(DISCIPLINES).toContain('General')
  })
})
