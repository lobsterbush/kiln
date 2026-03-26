import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Feedback } from './Feedback'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '../lib/supabase'

beforeEach(() => vi.clearAllMocks())

function renderFeedback() {
  return render(<Feedback />)
}

describe('Feedback', () => {
  it('renders the form with category, message, and email fields', () => {
    renderFeedback()
    expect(screen.getByRole('heading', { name: /send feedback/i })).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/tell us what happened/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/you@institution.edu/i)).toBeInTheDocument()
  })

  it('shows all four category options', () => {
    renderFeedback()
    expect(screen.getByText(/bug report/i)).toBeInTheDocument()
    expect(screen.getByText(/feature request/i)).toBeInTheDocument()
    expect(screen.getByText(/general/i)).toBeInTheDocument()
    expect(screen.getByText(/other/i)).toBeInTheDocument()
  })

  it('submit button is disabled when message is empty', () => {
    renderFeedback()
    expect(screen.getByRole('button', { name: /send feedback/i })).toBeDisabled()
  })

  it('submit button enables when message is typed', async () => {
    renderFeedback()
    await userEvent.type(screen.getByPlaceholderText(/tell us/i), 'Great app!')
    expect(screen.getByRole('button', { name: /send feedback/i })).not.toBeDisabled()
  })

  it('shows success state after submission', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    renderFeedback()
    await userEvent.type(screen.getByPlaceholderText(/tell us/i), 'Feedback message')
    await userEvent.click(screen.getByRole('button', { name: /send feedback/i }))

    await waitFor(() => expect(screen.getByText(/thanks — received/i)).toBeInTheDocument())
  })

  it('shows error on failed submission', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
    } as never)

    renderFeedback()
    await userEvent.type(screen.getByPlaceholderText(/tell us/i), 'Feedback message')
    await userEvent.click(screen.getByRole('button', { name: /send feedback/i }))

    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument())
  })

  it('allows selecting a different category', async () => {
    renderFeedback()
    await userEvent.click(screen.getByText(/bug report/i))
    // bug category selected — just verify it doesn't crash and the button reflects the selection
    expect(screen.getByText(/bug report/i).closest('button')).toHaveClass('border-slate-300')
  })
})
