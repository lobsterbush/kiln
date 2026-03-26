import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScenarioMonitor } from './ScenarioMonitor'
import type { Participant, Activity } from '../../lib/types'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [] }),
    }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  },
}))

vi.mock('../../lib/utils', async () => {
  const actual = await vi.importActual<typeof import('../../lib/utils')>('../../lib/utils')
  return { ...actual, copyToClipboard: vi.fn().mockResolvedValue(true) }
})

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <svg data-testid="qr" data-value={value} />,
}))

const makeParticipant = (id: string, name: string): Participant => ({
  id, session_id: 's1', display_name: name, token: 'tok', joined_at: new Date().toISOString(), is_active: true,
})

const activity: Activity = {
  id: 'a1', instructor_id: 'i1', title: 'Cuban Missile Crisis', type: 'scenario_multi',
  config: {
    rounds: 1, round_duration_sec: 600, initial_prompt: '',
    learning_objectives: ['test'], scenario_context: 'October 1962.',
    student_role: 'President JFK', ai_personas: [{ name: 'Khrushchev', role: 'Premier', goals: 'survive' }],
    max_turns: 6,
  },
  created_at: new Date().toISOString(),
}

const baseProps = {
  sessionId: 's1',
  joinCode: 'XK7R4P',
  activity,
  participants: [makeParticipant('p1', 'Alice'), makeParticipant('p2', 'Bob')],
  sessionStatus: 'lobby',
  isAdvancing: false,
  onStart: vi.fn(),
  onEnd: vi.fn(),
}

describe('ScenarioMonitor', () => {
  it('renders activity title and type badge', () => {
    render(<ScenarioMonitor {...baseProps} />)
    expect(screen.getByText('Cuban Missile Crisis')).toBeInTheDocument()
    expect(screen.getByText('Scenario Multi')).toBeInTheDocument()
  })

  it('shows participant count and max turns', () => {
    render(<ScenarioMonitor {...baseProps} />)
    expect(screen.getByText(/2 participants/)).toBeInTheDocument()
    expect(screen.getByText(/6 turns each/)).toBeInTheDocument()
  })

  it('shows scenario context snippet', () => {
    render(<ScenarioMonitor {...baseProps} />)
    expect(screen.getByText(/October 1962/)).toBeInTheDocument()
  })

  it('renders QR code and session code in lobby', () => {
    render(<ScenarioMonitor {...baseProps} />)
    expect(screen.getByTestId('qr')).toBeInTheDocument()
    // Session code characters displayed individually
    for (const ch of 'XK7R4P') {
      expect(screen.getAllByText(ch).length).toBeGreaterThan(0)
    }
  })

  it('shows Start Simulation button in lobby', () => {
    render(<ScenarioMonitor {...baseProps} />)
    expect(screen.getByText('Start Simulation')).toBeInTheDocument()
  })

  it('disables Start when no participants', () => {
    render(<ScenarioMonitor {...baseProps} participants={[]} />)
    expect(screen.getByText('Start Simulation').closest('button')).toBeDisabled()
  })

  it('calls onStart when Start Simulation is clicked', async () => {
    const onStart = vi.fn()
    render(<ScenarioMonitor {...baseProps} onStart={onStart} />)
    await userEvent.click(screen.getByText('Start Simulation'))
    expect(onStart).toHaveBeenCalled()
  })

  it('shows End Session button in active status', () => {
    render(<ScenarioMonitor {...baseProps} sessionStatus="active" />)
    expect(screen.getByText('End Session')).toBeInTheDocument()
  })

  it('shows progress grid stats', () => {
    render(<ScenarioMonitor {...baseProps} />)
    expect(screen.getByText('Participants')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })
})
