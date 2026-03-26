import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LiveMonitor } from './LiveMonitor'
import type { Participant, Response } from '../../lib/types'

const makeParticipant = (id: string, name: string): Participant => ({
  id, session_id: 's1', display_name: name, token: 'tok', joined_at: new Date().toISOString(), is_active: true,
})

const makeResponse = (id: string, participantId: string, round: number, content: string): Response => ({
  id, session_id: 's1', participant_id: participantId, round, content,
  response_type: 'initial', submitted_at: new Date().toISOString(), time_taken_ms: 5000,
})

const baseProps = {
  participants: [makeParticipant('p1', 'Alice'), makeParticipant('p2', 'Bob')],
  responses: [makeResponse('r1', 'p1', 1, 'My response text here')],
  currentRound: 1,
  roundPrompt: 'What do you think?',
  joinCode: 'ABC123',
  serverTimestamp: null,
  durationSec: 300,
  onAdvanceRound: vi.fn(),
  onEndSession: vi.fn(),
  onRoundExpire: vi.fn(),
  sessionStatus: 'active',
}

describe('LiveMonitor', () => {
  it('shows round number and join code', () => {
    render(<LiveMonitor {...baseProps} />)
    expect(screen.getByText('Round 1')).toBeInTheDocument()
    expect(screen.getByText('ABC123')).toBeInTheDocument()
  })

  it('shows submission count', () => {
    render(<LiveMonitor {...baseProps} />)
    expect(screen.getByText('1')).toBeInTheDocument() // submittedCount
    expect(screen.getByText('/2 submitted')).toBeInTheDocument()
  })

  it('shows submitted status for participants who responded', () => {
    render(<LiveMonitor {...baseProps} />)
    expect(screen.getByText('✓ Submitted')).toBeInTheDocument()
    expect(screen.getByText('Writing…')).toBeInTheDocument()
  })

  it('shows response preview text', () => {
    render(<LiveMonitor {...baseProps} />)
    expect(screen.getByText('My response text here')).toBeInTheDocument()
  })

  it('calls onAdvanceRound when advance button is clicked', async () => {
    const onAdvance = vi.fn()
    render(<LiveMonitor {...baseProps} onAdvanceRound={onAdvance} />)
    await userEvent.click(screen.getByText('Advance Early →'))
    expect(onAdvance).toHaveBeenCalled()
  })

  it('shows confirm dialog when End Session is clicked', async () => {
    render(<LiveMonitor {...baseProps} />)
    await userEvent.click(screen.getByText('End Session'))
    expect(screen.getByText('End session?')).toBeInTheDocument()
  })

  it('calls onEndSession after confirming end', async () => {
    const onEnd = vi.fn()
    render(<LiveMonitor {...baseProps} onEndSession={onEnd} />)
    await userEvent.click(screen.getByText('End Session'))
    await userEvent.click(screen.getByText('Yes, end'))
    expect(onEnd).toHaveBeenCalled()
  })

  it('shows "Paused" badge when session is between_rounds', () => {
    render(<LiveMonitor {...baseProps} sessionStatus="between_rounds" />)
    expect(screen.getByText('⏸ Paused')).toBeInTheDocument()
    expect(screen.getByText('Next Round →')).toBeInTheDocument()
  })

  it('shows peer warning when provided', () => {
    render(<LiveMonitor {...baseProps} peerWarning="Odd number of participants" />)
    expect(screen.getByText('Odd number of participants')).toBeInTheDocument()
  })

  it('opens expanded response overlay when a submitted card is clicked', async () => {
    render(<LiveMonitor {...baseProps} />)
    await userEvent.click(screen.getByText('My response text here'))
    // Overlay shows the participant name and full content
    expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('My response text here').length).toBeGreaterThanOrEqual(1)
  })
})
