import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Home } from './Home'

vi.mock('../lib/auth', () => ({
  useAuth: vi.fn(() => ({ user: null, loading: false })),
}))

vi.mock('../components/marketing/DemoPlayer', () => ({
  DemoPlayer: () => <div data-testid="demo-player" />,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: vi.fn(() => vi.fn()) }
})

import { useNavigate } from 'react-router-dom'

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  )
}

describe('Home', () => {
  it('renders the hero headline', () => {
    renderHome()
    expect(screen.getByText(/AI-resilient tools/i)).toBeInTheDocument()
  })

  it('renders the session code input', () => {
    renderHome()
    expect(screen.getByPlaceholderText('ABC123')).toBeInTheDocument()
  })

  it('renders the How it works section', () => {
    renderHome()
    expect(screen.getByText('How it works')).toBeInTheDocument()
    expect(screen.getByText('Create an activity')).toBeInTheDocument()
    expect(screen.getByText('Students join with a code')).toBeInTheDocument()
  })

  it('renders all six activity type cards', () => {
    renderHome()
    expect(screen.getByText('Peer Critique')).toBeInTheDocument()
    expect(screen.getByText('Socratic Chain')).toBeInTheDocument()
    expect(screen.getByText('Peer Clarification')).toBeInTheDocument()
    expect(screen.getByText('Evidence Analysis')).toBeInTheDocument()
    expect(screen.getByText('Scenario Solo')).toBeInTheDocument()
    expect(screen.getByText('Scenario Multi')).toBeInTheDocument()
  })

  it('navigates to join page when session code is submitted', async () => {
    const mockNav = vi.fn()
    vi.mocked(useNavigate).mockReturnValue(mockNav)
    renderHome()
    await userEvent.type(screen.getByPlaceholderText('ABC123'), 'XYZ789')
    const form = screen.getByPlaceholderText('ABC123').closest('form')!
    form.dispatchEvent(new Event('submit', { bubbles: true }))
    expect(mockNav).toHaveBeenCalledWith('/join?code=XYZ789')
  })

  it('renders demo link', () => {
    renderHome()
    expect(screen.getByText(/try a live demo/i)).toBeInTheDocument()
  })

  it('renders the Free section', () => {
    renderHome()
    expect(screen.getByText(/Free for every instructor/i)).toBeInTheDocument()
  })
})
