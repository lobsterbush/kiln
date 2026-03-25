import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionLobby } from './SessionLobby'
import type { Participant } from '../../lib/types'

// qrcode.react renders an SVG — just verify it doesn't crash
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <svg data-testid="qr-code" data-value={value} />,
}))

const makeParticipant = (id: string, name: string): Participant => ({
  id,
  session_id: 'sess-1',
  display_name: name,
  token: 'tok',
  joined_at: new Date().toISOString(),
  is_active: true,
})

describe('SessionLobby', () => {
  it('renders each character of the join code in its own tile', () => {
    render(
      <SessionLobby joinCode="ABC123" participants={[]} isInstructor={false} />,
    )
    for (const ch of 'ABC123') {
      expect(screen.getAllByText(ch).length).toBeGreaterThan(0)
    }
  })

  it('shows correct participant count (singular)', () => {
    render(
      <SessionLobby
        joinCode="XYZ789"
        participants={[makeParticipant('p1', 'Alice')]}
        isInstructor={false}
      />,
    )
    expect(screen.getByText(/1 student joined/i)).toBeInTheDocument()
  })

  it('shows correct participant count (plural)', () => {
    render(
      <SessionLobby
        joinCode="XYZ789"
        participants={[makeParticipant('p1', 'Alice'), makeParticipant('p2', 'Bob')]}
        isInstructor={false}
      />,
    )
    expect(screen.getByText(/2 students joined/i)).toBeInTheDocument()
  })

  it('renders participant display names', () => {
    render(
      <SessionLobby
        joinCode="AAABBB"
        participants={[makeParticipant('p1', 'Alice'), makeParticipant('p2', 'Bob')]}
        isInstructor={false}
      />,
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows "Waiting for instructor" spinner for students', () => {
    render(
      <SessionLobby joinCode="CODE99" participants={[]} isInstructor={false} />,
    )
    expect(screen.getByText(/waiting for instructor/i)).toBeInTheDocument()
  })

  it('shows Start Session button for instructors', () => {
    render(
      <SessionLobby
        joinCode="CODE99"
        participants={[makeParticipant('p1', 'Alice')]}
        isInstructor={true}
        onStart={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /start session/i })).toBeInTheDocument()
  })

  it('Start Session button is disabled with no participants', () => {
    render(
      <SessionLobby joinCode="CODE99" participants={[]} isInstructor={true} onStart={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /start session/i })).toBeDisabled()
  })

  it('calls onStart when Start Session is clicked', async () => {
    const onStart = vi.fn()
    render(
      <SessionLobby
        joinCode="CODE99"
        participants={[makeParticipant('p1', 'Alice')]}
        isInstructor={true}
        onStart={onStart}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /start session/i }))
    expect(onStart).toHaveBeenCalled()
  })

  it('renders the QR code pointed at the join URL', () => {
    render(<SessionLobby joinCode="QR1234" participants={[]} isInstructor={false} />)
    const qr = screen.getByTestId('qr-code')
    expect(qr.getAttribute('data-value')).toContain('QR1234')
  })

  it('shows activity title for students when provided', () => {
    render(
      <SessionLobby
        joinCode="ABC"
        participants={[]}
        isInstructor={false}
        activityTitle="My Cool Activity"
      />,
    )
    expect(screen.getByText('My Cool Activity')).toBeInTheDocument()
  })
})
