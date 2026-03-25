/**
 * Tests for the four student activity view components:
 * PeerCritiqueView, PeerClarificationView, EvidenceAnalysisView, SocraticView
 *
 * All four wrap ResponsePanel and display a peer's content alongside it.
 * ResponsePanel itself is mocked to focus on the wrapper logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PeerCritiqueView } from './PeerCritiqueView'
import { PeerClarificationView } from './PeerClarificationView'
import { EvidenceAnalysisView } from './EvidenceAnalysisView'
import { SocraticView } from './SocraticView'

// Mock Timer so it doesn't run real timers in these tests
vi.mock('../shared/Timer', () => ({
  Timer: ({ onExpire }: { onExpire?: () => void; serverTimestamp: string; durationSec: number }) => (
    <button data-testid="expire-timer" onClick={onExpire}>Expire</button>
  ),
}))

const BASE_PROPS = {
  serverTimestamp: new Date().toISOString(),
  durationSec: 300,
  onSubmit: vi.fn().mockResolvedValue(undefined),
}

beforeEach(() => vi.clearAllMocks())

// ---------------------------------------------------------------------------
// PeerCritiqueView
// ---------------------------------------------------------------------------
describe('PeerCritiqueView', () => {
  it('shows the peer name and their response', () => {
    render(
      <PeerCritiqueView
        {...BASE_PROPS}
        peerName="Alice"
        peerResponse="My argument is that democracy requires free speech."
        critiquePrompt="What is the weakest assumption here?"
      />,
    )
    expect(screen.getByText(/Alice's response/i)).toBeInTheDocument()
    expect(screen.getByText(/My argument is that democracy/i)).toBeInTheDocument()
  })

  it('passes the critique prompt to ResponsePanel', () => {
    render(
      <PeerCritiqueView
        {...BASE_PROPS}
        peerName="Bob"
        peerResponse="Response text"
        critiquePrompt="Find the weakest assumption."
      />,
    )
    expect(screen.getByText('Find the weakest assumption.')).toBeInTheDocument()
  })

  it('calls onSubmit when the student submits a critique', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      <PeerCritiqueView
        {...BASE_PROPS}
        onSubmit={onSubmit}
        peerName="Bob"
        peerResponse="Argument"
        critiquePrompt="Critique prompt"
      />,
    )
    await userEvent.type(screen.getByRole('textbox'), 'This argument assumes too much.')
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
  })
})

// ---------------------------------------------------------------------------
// PeerClarificationView
// ---------------------------------------------------------------------------
describe('PeerClarificationView', () => {
  it("shows the peer name and their confusion", () => {
    render(
      <PeerClarificationView
        {...BASE_PROPS}
        peerName="Carol"
        peerResponse="I don't understand how marginal cost relates to supply."
        explainPrompt="Explain this in plain language."
      />,
    )
    expect(screen.getByText(/Carol's confusion/i)).toBeInTheDocument()
    expect(screen.getByText(/marginal cost/i)).toBeInTheDocument()
  })

  it('passes the explain prompt to ResponsePanel', () => {
    render(
      <PeerClarificationView
        {...BASE_PROPS}
        peerName="Carol"
        peerResponse="Confusion"
        explainPrompt="Explain this in plain language."
      />,
    )
    expect(screen.getByText('Explain this in plain language.')).toBeInTheDocument()
  })

  it('shows the instruction to avoid jargon', () => {
    render(
      <PeerClarificationView
        {...BASE_PROPS}
        peerName="Carol"
        peerResponse="Confusion"
        explainPrompt="Explain"
      />,
    )
    expect(screen.getByText(/no jargon/i)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// EvidenceAnalysisView
// ---------------------------------------------------------------------------
describe('EvidenceAnalysisView', () => {
  it("shows the peer name and their interpretation", () => {
    render(
      <EvidenceAnalysisView
        {...BASE_PROPS}
        peerName="Dan"
        peerResponse="The data shows a clear causal relationship."
        gapPrompt="Where is the inferential gap?"
      />,
    )
    expect(screen.getByText(/Dan's interpretation/i)).toBeInTheDocument()
    expect(screen.getByText(/causal relationship/i)).toBeInTheDocument()
  })

  it('shows the inferential leap instruction', () => {
    render(
      <EvidenceAnalysisView
        {...BASE_PROPS}
        peerName="Dan"
        peerResponse="Interpretation"
        gapPrompt="Gap prompt"
      />,
    )
    expect(screen.getByText(/inferential leap/i)).toBeInTheDocument()
  })

  it('passes the gap prompt to ResponsePanel', () => {
    render(
      <EvidenceAnalysisView
        {...BASE_PROPS}
        peerName="Dan"
        peerResponse="Interpretation"
        gapPrompt="Find the inferential gap in this argument."
      />,
    )
    expect(screen.getByText('Find the inferential gap in this argument.')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// SocraticView
// ---------------------------------------------------------------------------
describe('SocraticView', () => {
  const SOCRATIC_BASE = {
    ...BASE_PROPS,
    previousResponse: 'I argued that free trade reduces poverty.',
    round: 2,
  }

  it('shows loading spinner when loading=true', () => {
    render(
      <SocraticView {...SOCRATIC_BASE} followUpPrompt={null} loading={true} />,
    )
    expect(screen.getByText(/generating your follow-up/i)).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('shows spinner when no prompt and not timed out', () => {
    render(
      <SocraticView {...SOCRATIC_BASE} followUpPrompt={null} loading={false} timedOut={false} />,
    )
    expect(screen.getByText(/generating your follow-up/i)).toBeInTheDocument()
  })

  it('renders the follow-up prompt when provided', () => {
    render(
      <SocraticView
        {...SOCRATIC_BASE}
        followUpPrompt="Why does free trade reduce poverty specifically in developing nations?"
        loading={false}
      />,
    )
    expect(screen.getByText(/specifically in developing nations/i)).toBeInTheDocument()
  })

  it("shows the student's previous response", () => {
    render(
      <SocraticView
        {...SOCRATIC_BASE}
        followUpPrompt="Follow-up question"
        loading={false}
      />,
    )
    expect(screen.getByText(/free trade reduces poverty/i)).toBeInTheDocument()
    expect(screen.getByText(/Your Round 1 response/i)).toBeInTheDocument()
  })

  it('uses fallback prompt and shows warning banner when timedOut=true', () => {
    render(
      <SocraticView
        {...SOCRATIC_BASE}
        followUpPrompt={null}
        loading={false}
        timedOut={true}
      />,
    )
    expect(screen.getByText(/timed out/i)).toBeInTheDocument()
    // Should still have a ResponsePanel with the fallback prompt
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('calls onSubmit when student responds', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      <SocraticView
        {...SOCRATIC_BASE}
        onSubmit={onSubmit}
        followUpPrompt="Why does this hold?"
        loading={false}
      />,
    )
    await userEvent.type(screen.getByRole('textbox'), 'Because markets are efficient.')
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
  })
})
