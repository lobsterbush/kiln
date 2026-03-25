/**
 * Unit tests for the peer-assignment and round-advance logic used in InstructorSession.
 *
 * Because the logic lives inside a React component, we test it as pure functions
 * mirroring the exact algorithm, so bugs here catch real session failures.
 */
import { describe, it, expect } from 'vitest'
import { shuffleArray } from '../utils'

// ---------------------------------------------------------------------------
// Peer assignment algorithm (mirrors InstructorSession.assignPeers)
// ---------------------------------------------------------------------------

interface Response {
  id: string
  participant_id: string
  content: string
}

interface Assignment {
  reviewer_id: string
  author_id: string
  response_id: string
}

/** Pure version of the assignment algorithm for testing. */
function buildAssignments(responses: Response[]): Assignment[] {
  if (responses.length < 2) return []
  const shuffled = shuffleArray(responses)
  return shuffled.map((reviewer, i) => {
    const author = shuffled[(i + 1) % shuffled.length]
    return {
      reviewer_id: reviewer.participant_id,
      author_id: author.participant_id,
      response_id: author.id,
    }
  })
}

const makeResponse = (id: string): Response => ({
  id: `resp-${id}`,
  participant_id: `part-${id}`,
  content: `Response from ${id}`,
})

describe('buildAssignments', () => {
  it('returns empty array when fewer than 2 responses', () => {
    expect(buildAssignments([])).toHaveLength(0)
    expect(buildAssignments([makeResponse('A')])).toHaveLength(0)
  })

  it('creates exactly N assignments for N participants', () => {
    const responses = ['A', 'B', 'C', 'D'].map(makeResponse)
    expect(buildAssignments(responses)).toHaveLength(4)
  })

  it('every participant is a reviewer exactly once', () => {
    const responses = ['A', 'B', 'C', 'D'].map(makeResponse)
    const assignments = buildAssignments(responses)
    const reviewers = assignments.map((a) => a.reviewer_id)
    expect(new Set(reviewers).size).toBe(4) // all unique
  })

  it('every participant is an author exactly once (circular)', () => {
    const responses = ['A', 'B', 'C', 'D'].map(makeResponse)
    const assignments = buildAssignments(responses)
    const authors = assignments.map((a) => a.author_id)
    expect(new Set(authors).size).toBe(4) // all unique
  })

  it('no participant reviews their own work', () => {
    for (let run = 0; run < 20; run++) {
      const responses = ['A', 'B', 'C', 'D', 'E'].map(makeResponse)
      const assignments = buildAssignments(responses)
      for (const a of assignments) {
        expect(a.reviewer_id).not.toBe(a.author_id)
      }
    }
  })

  it('response_id matches the author, not the reviewer', () => {
    const responses = ['A', 'B'].map(makeResponse)
    const assignments = buildAssignments(responses)
    for (const a of assignments) {
      expect(a.response_id).toBe(`resp-${a.author_id.replace('part-', '')}`)
    }
  })

  it('works correctly with exactly 2 participants', () => {
    const responses = ['A', 'B'].map(makeResponse)
    const assignments = buildAssignments(responses)
    expect(assignments).toHaveLength(2)
    // A reviews B, B reviews A
    const reviewerIds = new Set(assignments.map((a) => a.reviewer_id))
    const authorIds = new Set(assignments.map((a) => a.author_id))
    expect(reviewerIds).toEqual(authorIds) // same set of participants
  })
})

// ---------------------------------------------------------------------------
// Rebuttal assignment algorithm (mirrors InstructorSession.assignRebuttals)
// ---------------------------------------------------------------------------

interface PeerAssignment {
  reviewer_id: string
  author_id: string
  response_id: string
}

interface Critique {
  participant_id: string
  content: string
}

interface RebuttalBroadcast {
  participant_id: string  // the original author who receives the critique
  response_content: string
  response_type: 'rebuttal'
}

function buildRebuttals(
  critiqueResponses: Critique[],
  prevAssignments: PeerAssignment[],
): RebuttalBroadcast[] {
  const result: RebuttalBroadcast[] = []
  for (const assignment of prevAssignments) {
    const critique = critiqueResponses.find(
      (r) => r.participant_id === assignment.reviewer_id,
    )
    if (!critique) continue
    result.push({
      participant_id: assignment.author_id,
      response_content: critique.content,
      response_type: 'rebuttal',
    })
  }
  return result
}

describe('buildRebuttals', () => {
  it('sends each author the critique written about their work', () => {
    // Round 1: A wrote the original, B wrote the original
    // Round 2 assignments: B reviewed A, A reviewed B
    const prevAssignments: PeerAssignment[] = [
      { reviewer_id: 'part-B', author_id: 'part-A', response_id: 'resp-A' },
      { reviewer_id: 'part-A', author_id: 'part-B', response_id: 'resp-B' },
    ]
    // Round 2 critique responses
    const critiqueResponses: Critique[] = [
      { participant_id: 'part-B', content: "A's argument has a weak premise." },
      { participant_id: 'part-A', content: "B missed the main point." },
    ]

    const rebuttals = buildRebuttals(critiqueResponses, prevAssignments)

    // A (the original author) should receive B's critique
    const aRebuttal = rebuttals.find((r) => r.participant_id === 'part-A')
    expect(aRebuttal?.response_content).toBe("A's argument has a weak premise.")

    // B should receive A's critique
    const bRebuttal = rebuttals.find((r) => r.participant_id === 'part-B')
    expect(bRebuttal?.response_content).toBe("B missed the main point.")
  })

  it('skips participants who did not submit a critique', () => {
    const prevAssignments: PeerAssignment[] = [
      { reviewer_id: 'part-B', author_id: 'part-A', response_id: 'resp-A' },
      { reviewer_id: 'part-A', author_id: 'part-B', response_id: 'resp-B' },
    ]
    // Only B submitted a critique; A did not
    const critiqueResponses: Critique[] = [
      { participant_id: 'part-B', content: "Critique from B." },
    ]

    const rebuttals = buildRebuttals(critiqueResponses, prevAssignments)
    expect(rebuttals).toHaveLength(1) // only A gets a rebuttal (from B's critique)
    expect(rebuttals[0].participant_id).toBe('part-A')
  })

  it('returns empty when no critique responses', () => {
    const prevAssignments: PeerAssignment[] = [
      { reviewer_id: 'part-B', author_id: 'part-A', response_id: 'resp-A' },
    ]
    expect(buildRebuttals([], prevAssignments)).toHaveLength(0)
  })

  it('returns empty when no previous assignments', () => {
    const critiqueResponses: Critique[] = [
      { participant_id: 'part-B', content: "Critique." },
    ]
    expect(buildRebuttals(critiqueResponses, [])).toHaveLength(0)
  })

  it('all returned broadcasts have response_type rebuttal', () => {
    const prevAssignments: PeerAssignment[] = [
      { reviewer_id: 'part-B', author_id: 'part-A', response_id: 'resp-A' },
    ]
    const critiqueResponses: Critique[] = [
      { participant_id: 'part-B', content: "Critique." },
    ]
    const rebuttals = buildRebuttals(critiqueResponses, prevAssignments)
    for (const r of rebuttals) {
      expect(r.response_type).toBe('rebuttal')
    }
  })
})

// ---------------------------------------------------------------------------
// Round completion detection (mirrors auto-advance logic)
// ---------------------------------------------------------------------------

describe('auto-advance: all-submitted detection', () => {
  it('returns true when every participant has submitted for the current round', () => {
    const participants = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }]
    const responses = [
      { participant_id: 'p1', round: 2 },
      { participant_id: 'p2', round: 2 },
      { participant_id: 'p3', round: 2 },
    ]
    const currentRound = 2
    const roundResponses = responses.filter((r) => r.round === currentRound)
    const allSubmitted = participants.length > 0 && roundResponses.length >= participants.length
    expect(allSubmitted).toBe(true)
  })

  it('returns false when only some participants have submitted', () => {
    const participants = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }]
    const responses = [
      { participant_id: 'p1', round: 2 },
      { participant_id: 'p2', round: 2 },
    ]
    const currentRound = 2
    const roundResponses = responses.filter((r) => r.round === currentRound)
    const allSubmitted = participants.length > 0 && roundResponses.length >= participants.length
    expect(allSubmitted).toBe(false)
  })

  it('returns false when there are no participants', () => {
    const participants: unknown[] = []
    const responses = [{ participant_id: 'p1', round: 1 }]
    const currentRound = 1
    const roundResponses = responses.filter((r) => r.round === currentRound)
    const allSubmitted = participants.length > 0 && roundResponses.length >= participants.length
    expect(allSubmitted).toBe(false)
  })

  it('does not fire for responses from earlier rounds', () => {
    const participants = [{ id: 'p1' }, { id: 'p2' }]
    const responses = [
      { participant_id: 'p1', round: 1 },  // old round
      { participant_id: 'p2', round: 1 },  // old round
    ]
    const currentRound = 2
    const roundResponses = responses.filter((r) => r.round === currentRound)
    const allSubmitted = participants.length > 0 && roundResponses.length >= participants.length
    expect(allSubmitted).toBe(false)
  })
})
