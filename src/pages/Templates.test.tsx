import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Templates } from './Templates'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: vi.fn(() => vi.fn()) }
})

import { useNavigate } from 'react-router-dom'

function renderTemplates() {
  return render(
    <MemoryRouter>
      <Templates />
    </MemoryRouter>,
  )
}

describe('Templates', () => {
  it('renders the page title and template count', () => {
    renderTemplates()
    expect(screen.getByText('Activity Templates')).toBeInTheDocument()
    expect(screen.getByText(/ready-to-use activities/i)).toBeInTheDocument()
  })

  it('renders the search input', () => {
    renderTemplates()
    expect(screen.getByPlaceholderText(/search templates/i)).toBeInTheDocument()
  })

  it('renders template cards', () => {
    renderTemplates()
    expect(screen.getByText('Cuban Missile Crisis Negotiation')).toBeInTheDocument()
    expect(screen.getByText('Democratic Backsliding Debate')).toBeInTheDocument()
  })

  it('filters templates by search text', async () => {
    renderTemplates()
    await userEvent.type(screen.getByPlaceholderText(/search templates/i), 'trolley')
    expect(screen.getAllByText(/Trolley Problem/i).length).toBeGreaterThan(0)
    expect(screen.queryByText('Cuban Missile Crisis Negotiation')).not.toBeInTheDocument()
  })

  it('shows no results message when filter matches nothing', async () => {
    renderTemplates()
    await userEvent.type(screen.getByPlaceholderText(/search templates/i), 'zzzznotexist')
    expect(screen.getByText(/no templates match/i)).toBeInTheDocument()
  })

  it('navigates to create page with template state when Use button is clicked', async () => {
    const mockNav = vi.fn()
    vi.mocked(useNavigate).mockReturnValue(mockNav)
    renderTemplates()
    const useButtons = screen.getAllByText(/use this template/i)
    await userEvent.click(useButtons[0])
    expect(mockNav).toHaveBeenCalledWith('/instructor/create', expect.objectContaining({ state: expect.any(Object) }))
  })

  it('shows learning objectives on template cards', () => {
    renderTemplates()
    expect(screen.getByText(/crisis decision-making/i)).toBeInTheDocument()
  })
})
