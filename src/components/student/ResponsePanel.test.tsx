import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResponsePanel } from './ResponsePanel'

// Mock Timer so we can trigger expiry on demand without real time passing
vi.mock('../shared/Timer', () => ({
  Timer: ({ onExpire }: { onExpire?: () => void; serverTimestamp: string; durationSec: number }) => (
    <button data-testid="expire-timer" onClick={onExpire}>Expire Timer</button>
  ),
}))

// Default props used by most tests (long duration = timer won't fire during typing)
const baseProps = {
  prompt: 'What is your argument?',
  serverTimestamp: new Date().toISOString(),
  durationSec: 300,
  onSubmit: vi.fn().mockResolvedValue(undefined),
}

function renderPanel(overrides: Partial<typeof baseProps> = {}) {
  return render(<ResponsePanel {...baseProps} {...overrides} />)
}

afterEach(() => vi.clearAllMocks())

describe('ResponsePanel — rendering', () => {
  it('renders the prompt text', () => {
    renderPanel()
    expect(screen.getByText('What is your argument?')).toBeInTheDocument()
  })

  it('shows word count of 0 initially', () => {
    renderPanel()
    expect(screen.getByText(/0 words/i)).toBeInTheDocument()
  })

  it('submit button is disabled when textarea is empty', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
  })

  it('disables input when disabled prop is true', () => {
    renderPanel({ disabled: true })
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})

describe('ResponsePanel — word count', () => {
  it('updates word count as user types', async () => {
    renderPanel()
    await userEvent.type(screen.getByRole('textbox'), 'hello world')
    expect(screen.getByText(/2 words/i)).toBeInTheDocument()
  })

  it('shows amber warning when word count is below 15', async () => {
    renderPanel()
    await userEvent.type(screen.getByRole('textbox'), 'only five words here now')
    expect(screen.getByText(/aim for 15\+/i)).toBeInTheDocument()
  })

  it('does not show word count warning when >= 15 words', async () => {
    const longText =
      'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen'
    renderPanel()
    await userEvent.type(screen.getByRole('textbox'), longText)
    expect(screen.queryByText(/aim for 15\+/i)).not.toBeInTheDocument()
  })
})

describe('ResponsePanel — submit flow', () => {
  it('calls onSubmit with content and elapsed time', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderPanel({ onSubmit })
    await userEvent.type(screen.getByRole('textbox'), 'My response')
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith('My response', expect.any(Number)),
    )
  })

  it('shows Submitted after successful submit', async () => {
    renderPanel()
    await userEvent.type(screen.getByRole('textbox'), 'My response')
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(screen.getByText(/submitted/i)).toBeInTheDocument())
  })

  it('shows error message when onSubmit throws', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Network error'))
    renderPanel({ onSubmit })
    await userEvent.type(screen.getByRole('textbox'), 'My response')
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/could not save/i),
    )
  })
})

describe('ResponsePanel — timer expiry', () => {
  it('auto-submits on timer expiry if content is present', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderPanel({ onSubmit })
    await userEvent.type(screen.getByRole('textbox'), 'My timed response')
    await userEvent.click(screen.getByTestId('expire-timer'))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('My timed response', expect.any(Number)))
  })

  it('shows Time is up and hides textarea when timer expires with no content', async () => {
    const onSubmit = vi.fn()
    renderPanel({ onSubmit })
    await userEvent.click(screen.getByTestId('expire-timer'))
    await waitFor(() => expect(screen.getByText(/time.s up/i)).toBeInTheDocument())
    // Textarea should be hidden (replaced by Time's up message)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
