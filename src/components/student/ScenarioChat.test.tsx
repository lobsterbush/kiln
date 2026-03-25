import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScenarioChat } from './ScenarioChat'
import type { Activity } from '../../lib/types'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    functions: { invoke: vi.fn() },
    rpc: vi.fn(),
  },
}))

vi.mock('../../lib/utils', async () => {
  const actual = await vi.importActual<typeof import('../../lib/utils')>('../../lib/utils')
  return {
    ...actual,
    getStudentToken: vi.fn(() => ({
      participant_id: 'p-1',
      token: 'tok-abc',
      session_id: 'sess-1',
      display_name: 'Alice',
    })),
  }
})

async function getSupabaseMock() {
  const mod = await import('../../lib/supabase')
  return mod.supabase
}

const mockActivity: Activity = {
  id: 'act-1',
  instructor_id: 'instr-1',
  title: 'Foreign Policy Crisis',
  type: 'scenario_solo',
  config: {
    rounds: 1,
    round_duration_sec: 300,
    initial_prompt: 'Brief the Prime Minister',
    learning_objectives: ['Strategic thinking'],
    scenario_context: 'A neighbouring country invaded.',
    student_role: 'Foreign Minister',
    ai_personas: [{ name: 'Dr. Chen', role: 'NSA', goals: 'Stress-test ideas' }],
    max_turns: 4,
  },
  created_at: new Date().toISOString(),
}

function renderChat(sessionStatus = 'active') {
  return render(
    <ScenarioChat sessionId="sess-1" activity={mockActivity} sessionStatus={sessionStatus} />,
  )
}

describe('ScenarioChat', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows loading spinner while fetching transcript', async () => {
    const sb = await getSupabaseMock()
    // Never resolve so loading stays visible
    vi.mocked(sb.rpc).mockReturnValue(new Promise(() => {}) as never)
    renderChat()
    expect(screen.getByText(/loading your conversation/i)).toBeInTheDocument()
  })

  it('renders empty state after transcript resolves with no messages', async () => {
    const sb = await getSupabaseMock()
    vi.mocked(sb.rpc).mockResolvedValue({ data: { messages: [] }, error: null })
    renderChat()
    await waitFor(() =>
      expect(screen.queryByText(/loading your conversation/i)).not.toBeInTheDocument()
    )
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument()
  })

  it('renders existing transcript messages', async () => {
    const sb = await getSupabaseMock()
    vi.mocked(sb.rpc).mockResolvedValue({
      data: {
        messages: [
          { turn: 1, speaker_type: 'student', speaker_name: 'Alice', content: 'My recommendation is X.' },
          { turn: 2, speaker_type: 'ai', speaker_name: 'Dr. Chen', content: 'Be more specific.' },
        ],
      },
      error: null,
    })
    renderChat()
    await waitFor(() => expect(screen.getByText('My recommendation is X.')).toBeInTheDocument())
    expect(screen.getByText('Be more specific.')).toBeInTheDocument()
  })

  it('marks completed when sessionStatus is "completed"', async () => {
    const sb = await getSupabaseMock()
    vi.mocked(sb.rpc).mockResolvedValue({ data: { messages: [] }, error: null })
    renderChat('completed')
    await waitFor(() =>
      expect(screen.getByText(/simulation complete/i)).toBeInTheDocument()
    )
  })

  it('shows turn counter that decrements after sending', async () => {
    const sb = await getSupabaseMock()
    vi.mocked(sb.rpc).mockResolvedValue({ data: { messages: [] }, error: null })
    vi.mocked(sb.functions.invoke).mockResolvedValue({
      data: { speaker_name: 'Dr. Chen', content: 'Response.', student_turns_used: 1, completed: false },
      error: null,
    })

    renderChat()
    await waitFor(() => screen.getByPlaceholderText(/type your message/i))
    expect(screen.getByText(/4 turns remaining/i)).toBeInTheDocument()

    await userEvent.type(screen.getByPlaceholderText(/type your message/i), 'Hello')
    await userEvent.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => expect(screen.getByText(/3 turns remaining/i)).toBeInTheDocument())
  })

  it('shows error and rolls back message if edge fn fails and transcript is empty', async () => {
    const sb = await getSupabaseMock()
    // First call: load transcript (empty)
    // Second call: re-sync after failure (empty)
    vi.mocked(sb.rpc)
      .mockResolvedValueOnce({ data: { messages: [] }, error: null })
      .mockResolvedValueOnce({ data: { messages: [] }, error: null })

    vi.mocked(sb.functions.invoke).mockRejectedValue(new Error('Edge fn error'))

    renderChat()
    await waitFor(() => screen.getByPlaceholderText(/type your message/i))

    await userEvent.type(screen.getByPlaceholderText(/type your message/i), 'My message')
    await userEvent.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() =>
      expect(screen.getByText(/could not send message/i)).toBeInTheDocument()
    )
    // Rolled back: input is restored
    expect(screen.getByRole('textbox')).toHaveValue('My message')
  })
})
