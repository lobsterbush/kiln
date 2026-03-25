import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Demo } from './Demo'

// Mock react-router-dom Link (used in completed state CTA)
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual }
})

// Mock supabase — imported by Demo.tsx via ../../lib/supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

// Helper: import the mocked supabase AFTER vi.mock is registered
async function getSupabaseMock() {
  const mod = await import('../lib/supabase')
  return mod.supabase
}

function renderDemo() {
  return render(
    <MemoryRouter>
      <Demo />
    </MemoryRouter>,
  )
}

async function typeAndSend(text: string) {
  const textarea = screen.getByRole('textbox')
  await userEvent.type(textarea, text)
  const sendBtn = screen.getByRole('button', { name: /send/i })
  await userEvent.click(sendBtn)
}

// ---------------------------------------------------------------------------
// Scenario brief
// ---------------------------------------------------------------------------
describe('Demo — initial render', () => {
  it('renders the scenario brief', () => {
    renderDemo()
    expect(screen.getByText(/Foreign Policy Crisis/i)).toBeInTheDocument()
    expect(screen.getByText(/Foreign Minister/i)).toBeInTheDocument()
    expect(screen.getByText(/Dr. Chen/i)).toBeInTheDocument()
  })

  it('hides the brief when "Hide brief" is clicked', async () => {
    renderDemo()
    await userEvent.click(screen.getByText('Hide brief'))
    expect(screen.queryByText(/Foreign Minister/i)).not.toBeInTheDocument()
  })

  it('shows "4 turns remaining" before any message', () => {
    renderDemo()
    expect(screen.getByText(/4 turns remaining/i)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Fallback behaviour (THE critical regression test)
// ---------------------------------------------------------------------------
describe('Demo — fallback when edge function is unavailable', () => {
  beforeEach(async () => {
    const sb = await getSupabaseMock()
    vi.mocked(sb.functions.invoke).mockRejectedValue(new Error('Function not found'))
  })

  it('does NOT show an error message when edge function throws', async () => {
    renderDemo()
    await typeAndSend('Let us go to war')
    await waitFor(() =>
      expect(screen.queryByText(/could not get a response/i)).not.toBeInTheDocument()
    )
  })

  it('renders FALLBACK_RESPONSES[1] on the first turn', async () => {
    renderDemo()
    await typeAndSend('My recommendation is to call the UN')
    await waitFor(() =>
      expect(screen.getByText(/principle, not a plan/i)).toBeInTheDocument()
    )
  })

  it('renders FALLBACK_RESPONSES[2] on the second turn', async () => {
    renderDemo()
    await typeAndSend('Turn 1 message')
    await waitFor(() => screen.getByText(/principle, not a plan/i))
    await typeAndSend('Turn 2 message')
    await waitFor(() =>
      expect(screen.getByText(/dancing around the trade question/i)).toBeInTheDocument()
    )
  })

  it('renders FALLBACK_RESPONSES[3] on the third turn', async () => {
    renderDemo()
    await typeAndSend('Turn 1')
    await waitFor(() => screen.getByText(/principle, not a plan/i))
    await typeAndSend('Turn 2')
    await waitFor(() => screen.getByText(/dancing around the trade question/i))
    await typeAndSend('Turn 3')
    await waitFor(() =>
      expect(screen.getByText(/timeline gap/i)).toBeInTheDocument()
    )
  })

  it('shows completed state after 4 turns', async () => {
    renderDemo()
    for (let i = 1; i <= 4; i++) {
      await typeAndSend(`Turn ${i}`)
      // Wait for AI response before next turn
      await waitFor(() =>
        screen.getAllByRole('button').some((b) => b.textContent?.includes('Try again') || i < 4)
      )
    }
    await waitFor(() =>
      expect(screen.getByText(/demo complete/i)).toBeInTheDocument()
    )
  })
})

// ---------------------------------------------------------------------------
// Successful edge function call
// ---------------------------------------------------------------------------
describe('Demo — successful edge function response', () => {
  beforeEach(async () => {
    const sb = await getSupabaseMock()
    vi.mocked(sb.functions.invoke).mockResolvedValue({
      data: { content: 'That is an interesting strategy, Minister.', speaker_name: 'Dr. Chen', completed: false },
      error: null,
    })
  })

  it('renders the AI response content from data', async () => {
    renderDemo()
    await typeAndSend('We should invoke Article 5')
    await waitFor(() =>
      expect(screen.getByText(/interesting strategy/i)).toBeInTheDocument()
    )
  })

  it('does not show an error message on success', async () => {
    renderDemo()
    await typeAndSend('We should invoke Article 5')
    await waitFor(() => screen.getByText(/interesting strategy/i))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('decrements turn counter after sending', async () => {
    renderDemo()
    await typeAndSend('Turn 1 message')
    await waitFor(() => screen.getByText(/interesting strategy/i))
    expect(screen.getByText(/3 turns remaining/i)).toBeInTheDocument()
  })

  it('marks completed when data.completed is true', async () => {
    const sb = await getSupabaseMock()
    vi.mocked(sb.functions.invoke).mockResolvedValue({
      data: { content: 'Final response.', speaker_name: 'Dr. Chen', completed: true },
      error: null,
    })
    renderDemo()
    await typeAndSend('Final message')
    await waitFor(() =>
      expect(screen.getByText(/demo complete/i)).toBeInTheDocument()
    )
  })
})

// ---------------------------------------------------------------------------
// handleRestart
// ---------------------------------------------------------------------------
describe('Demo — restart', () => {
  it('resets to initial state when "Try again" is clicked', async () => {
    const sb = await getSupabaseMock()
    vi.mocked(sb.functions.invoke).mockRejectedValue(new Error('unavailable'))

    renderDemo()
    // Play through 4 turns to reach completed state
    for (let i = 1; i <= 4; i++) {
      await typeAndSend(`Turn ${i}`)
      await waitFor(() =>
        screen.getAllByText(/.+/).some(() => i < 4 || screen.queryByText(/demo complete/i))
      )
    }
    await waitFor(() => screen.getByText(/demo complete/i))

    await userEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(screen.queryByText(/demo complete/i)).not.toBeInTheDocument()
    expect(screen.getByText(/4 turns remaining/i)).toBeInTheDocument()
    // Brief should be visible again
    expect(screen.getByText(/Foreign Minister/i)).toBeInTheDocument()
  })
})
