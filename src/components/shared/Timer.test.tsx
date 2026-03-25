import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { Timer } from './Timer'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function serverTs(offsetMs = 0) {
  return new Date(Date.now() - offsetMs).toISOString()
}

describe('Timer', () => {
  it('renders the initial time', () => {
    render(<Timer serverTimestamp={serverTs()} durationSec={60} />)
    expect(screen.getByText('1:00')).toBeInTheDocument()
  })

  it('counts down over time', () => {
    render(<Timer serverTimestamp={serverTs()} durationSec={60} />)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByText('0:55')).toBeInTheDocument()
  })

  it('calls onExpire when the timer reaches zero', () => {
    const onExpire = vi.fn()
    render(<Timer serverTimestamp={serverTs()} durationSec={10} onExpire={onExpire} />)
    act(() => { vi.advanceTimersByTime(11_000) })
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('does not call onExpire more than once', () => {
    const onExpire = vi.fn()
    render(<Timer serverTimestamp={serverTs()} durationSec={5} onExpire={onExpire} />)
    act(() => { vi.advanceTimersByTime(20_000) })
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('accounts for time already elapsed via serverTimestamp', () => {
    // Simulate that 5 seconds have already passed server-side
    render(<Timer serverTimestamp={serverTs(5000)} durationSec={60} />)
    // Should start at ~55 seconds, not 60
    expect(screen.getByText('0:55')).toBeInTheDocument()
  })

  it('clamps remaining to 0 if serverTimestamp is far in the past', () => {
    render(<Timer serverTimestamp={serverTs(120_000)} durationSec={60} />)
    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  it('shows urgent styling when ≤ 10 seconds remain', () => {
    const { container } = render(
      <Timer serverTimestamp={serverTs()} durationSec={10} />,
    )
    act(() => { vi.advanceTimersByTime(1000) }) // 9 seconds left
    expect(container.querySelector('.timer-urgent')).toBeTruthy()
  })
})
