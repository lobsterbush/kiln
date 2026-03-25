import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Join } from './Join'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn().mockReturnValue({
      subscribe: vi.fn().mockReturnThis(),
      send: vi.fn().mockResolvedValue({}),
    }),
    removeChannel: vi.fn(),
  },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: vi.fn(() => vi.fn()) }
})

import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

function renderJoin(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/join${search}`]}>
      <Join />
    </MemoryRouter>,
  )
}

// Helper: build a chainable Supabase query mock
function mockQuery(result: unknown) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    insert: vi.fn().mockReturnThis(),
  }
  vi.mocked(supabase.from).mockReturnValue(chain as never)
  return chain
}

beforeEach(() => vi.clearAllMocks())

describe('Join — rendering', () => {
  it('renders the session code and name inputs', () => {
    renderJoin()
    expect(screen.getByLabelText(/session code/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument()
  })

  it('pre-fills the code from ?code= query param', () => {
    renderJoin('?code=ABC123')
    expect(screen.getByLabelText(/session code/i)).toHaveValue('ABC123')
  })

  it('join button is disabled when fields are empty', () => {
    renderJoin()
    expect(screen.getByRole('button', { name: /join/i })).toBeDisabled()
  })

  it('join button becomes enabled when both fields are filled', async () => {
    renderJoin()
    await userEvent.type(screen.getByLabelText(/session code/i), 'ABCDEF')
    await userEvent.type(screen.getByLabelText(/your name/i), 'Alice')
    expect(screen.getByRole('button', { name: /join/i })).not.toBeDisabled()
  })
})

describe('Join — validation errors', () => {
  it('shows error when session is not found', async () => {
    mockQuery({ data: null, error: { message: 'No rows' } })
    renderJoin()
    await userEvent.type(screen.getByLabelText(/session code/i), 'XXXXXX')
    await userEvent.type(screen.getByLabelText(/your name/i), 'Alice')
    await userEvent.click(screen.getByRole('button', { name: /join/i }))
    await waitFor(() =>
      expect(screen.getByText(/session not found/i)).toBeInTheDocument(),
    )
  })

  it('shows error when session has already ended', async () => {
    mockQuery({ data: { id: 'sess-1', status: 'completed' }, error: null })
    renderJoin()
    await userEvent.type(screen.getByLabelText(/session code/i), 'DONE99')
    await userEvent.type(screen.getByLabelText(/your name/i), 'Alice')
    await userEvent.click(screen.getByRole('button', { name: /join/i }))
    await waitFor(() =>
      expect(screen.getByText(/already ended/i)).toBeInTheDocument(),
    )
  })

  it('shows error when name is fewer than 2 characters', async () => {
    mockQuery({ data: { id: 'sess-1', status: 'lobby' }, error: null })
    renderJoin()
    await userEvent.type(screen.getByLabelText(/session code/i), 'ABCDEF')
    await userEvent.type(screen.getByLabelText(/your name/i), 'A')
    await userEvent.click(screen.getByRole('button', { name: /join/i }))
    await waitFor(() =>
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument(),
    )
  })

  it('shows error when name is already taken', async () => {
    // session query
    vi.mocked(supabase.from)
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'sess-1', status: 'lobby' }, error: null }),
      } as never)
      // existing participants query
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [{ display_name: 'Alice' }], error: null }),
      } as never)

    renderJoin()
    await userEvent.type(screen.getByLabelText(/session code/i), 'ABCDEF')
    await userEvent.type(screen.getByLabelText(/your name/i), 'Alice')
    await userEvent.click(screen.getByRole('button', { name: /join/i }))
    await waitFor(() =>
      expect(screen.getByText(/already taken/i)).toBeInTheDocument(),
    )
  })
})

describe('Join — successful join', () => {
  it('navigates to the session page on successful join', async () => {
    const mockNavigate = vi.fn()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)

    // session → participants → insert participant
    vi.mocked(supabase.from)
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'sess-42', status: 'lobby' }, error: null }),
      } as never)
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as never)
      .mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'part-1', display_name: 'Alice', token: 'tok' },
          error: null,
        }),
      } as never)

    renderJoin()
    await userEvent.type(screen.getByLabelText(/session code/i), 'ABCDEF')
    await userEvent.type(screen.getByLabelText(/your name/i), 'Alice')
    await userEvent.click(screen.getByRole('button', { name: /join/i }))

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/session/sess-42'),
    )
  })
})
