import type { ActivityType } from './types'

export interface ActivityMeta {
  label: string
  shortLabel: string
  description: string
  rounds: readonly { round: number; label: string; emoji: string; text: string }[]
  color: {
    bg: string
    text: string
    border: string
    badge: string
    accent: string
  }
}

export const ACTIVITY_META: Record<ActivityType, ActivityMeta> = {
  peer_critique: {
    label: 'Peer Critique',
    shortLabel: 'Peer Critique',
    description:
      "Students write claims, critique each other's arguments, and respond to criticism in timed rounds.",
    rounds: [
      { round: 1, label: 'Make your case', emoji: '✍️', text: 'Everyone responds to the opening prompt with an original argument. Timed.' },
      { round: 2, label: 'Find the weakness', emoji: '🔍', text: "Each student is assigned a peer's argument and must identify its weakest assumption." },
      { round: 3, label: 'Defend your position', emoji: '⚔️', text: 'Students receive the critique of their own work and write a rebuttal.' },
    ],
    color: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-700',
      accent: 'from-blue-500 to-blue-600',
    },
  },

  socratic_chain: {
    label: 'Socratic Chain',
    shortLabel: 'Socratic Chain',
    description:
      "AI reads each student's specific response and generates a personalised follow-up that targets the gap in their reasoning.",
    rounds: [
      { round: 1, label: 'Initial response', emoji: '✍️', text: 'Everyone answers the opening question in their own words.' },
      { round: 2, label: 'Personalised AI follow-up', emoji: '🤖', text: "Claude reads each student's answer and generates a follow-up that probes the weakest point in their reasoning." },
      { round: 3, label: 'Deepen the argument', emoji: '💡', text: 'Students respond to their personal challenge. Each one confronts exactly what their argument left unanswered.' },
    ],
    color: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
      badge: 'bg-purple-100 text-purple-700',
      accent: 'from-purple-500 to-purple-600',
    },
  },

  peer_clarification: {
    label: 'Peer Clarification',
    shortLabel: 'Peer Clarification',
    description:
      "Students surface their own confusion; then explain a classmate's confusion in plain language.",
    rounds: [
      { round: 1, label: 'Name your confusion', emoji: '🤔', text: "Each student identifies the single most confusing point from today's material and describes it precisely." },
      { round: 2, label: 'Explain it to them', emoji: '💬', text: "Each student receives a different classmate's confusion and must explain it in plain language — no jargon." },
    ],
    color: {
      bg: 'bg-teal-50',
      text: 'text-teal-600',
      border: 'border-teal-200',
      badge: 'bg-teal-100 text-teal-700',
      accent: 'from-teal-500 to-teal-600',
    },
  },

  evidence_analysis: {
    label: 'Evidence Analysis',
    shortLabel: 'Evidence Analysis',
    description:
      "Students interpret a piece of evidence revealed live; then identify the inferential gap in a peer's interpretation.",
    rounds: [
      { round: 1, label: 'Interpret the evidence', emoji: '🔬', text: 'The instructor reveals a piece of data, quote, or case not in the assigned readings. Students interpret what it means.' },
      { round: 2, label: 'Find the gap', emoji: '🧩', text: "Each student receives a peer's interpretation and must identify its biggest inferential gap or unsupported leap." },
    ],
    color: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-700',
      accent: 'from-amber-500 to-amber-600',
    },
  },
}
