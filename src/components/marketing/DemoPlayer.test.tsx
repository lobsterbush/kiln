import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DemoPlayer } from './DemoPlayer'

describe('DemoPlayer', () => {
  it('renders the fake browser chrome', () => {
    render(<DemoPlayer />)
    expect(screen.getByText('app.usekiln.org/instructor/session')).toBeInTheDocument()
  })

  it('renders scene dot indicators for all 6 activity types', () => {
    const { container } = render(<DemoPlayer />)
    const dots = container.querySelectorAll('button[aria-label]')
    expect(dots.length).toBe(6)
  })

  it('shows the first scene type badge on initial render', () => {
    render(<DemoPlayer />)
    expect(screen.getByText('Peer Critique')).toBeInTheDocument()
  })

  it('renders student names from scene data', () => {
    render(<DemoPlayer />)
    expect(screen.getByText('Priya K.')).toBeInTheDocument()
    expect(screen.getByText('Marcus T.')).toBeInTheDocument()
  })

  it('renders session code', () => {
    render(<DemoPlayer />)
    expect(screen.getByText('XK7R4P')).toBeInTheDocument()
  })

  it('renders the action bar with AI Debrief and Advance buttons', () => {
    render(<DemoPlayer />)
    expect(screen.getAllByText('AI Debrief').length).toBeGreaterThan(0)
    expect(screen.getByText('Advance →')).toBeInTheDocument()
  })
})
