export type ActivityType = 'peer_critique' | 'socratic_chain' | 'peer_clarification' | 'evidence_analysis' | 'scenario_solo' | 'scenario_multi'

export type SessionStatus = 'lobby' | 'active' | 'between_rounds' | 'completed'

export type ResponseType = 'initial' | 'critique' | 'rebuttal' | 'followup_answer' | 'clarification' | 'evidence_gap'

export interface ScenarioPersona {
  name: string
  role: string
  goals: string
  personality?: string
}

export interface ActivityConfig {
  rounds: number
  round_duration_sec: number
  initial_prompt: string
  learning_objectives: string[]
  material_ids?: string[]
  source_material?: string
  critique_prompt?: string | null
  rebuttal_prompt?: string | null
  explain_prompt?: string | null
  gap_prompt?: string | null
  auto_advance?: boolean
  // Scenario types only
  scenario_context?: string
  student_role?: string
  ai_personas?: ScenarioPersona[]
  max_turns?: number
  evaluation_rubric?: string[]
}

export interface Activity {
  id: string
  instructor_id: string
  title: string
  type: ActivityType
  config: ActivityConfig
  created_at: string
}

export interface Session {
  id: string
  activity_id: string
  instructor_id: string
  join_code: string
  status: SessionStatus
  current_round: number
  round_started_at: string | null
  created_at: string
  activity?: Activity
}

export interface Participant {
  id: string
  session_id: string
  display_name: string
  token: string
  joined_at: string
  is_active: boolean
}

export interface Response {
  id: string
  session_id: string
  participant_id: string
  round: number
  content: string
  response_type: ResponseType
  submitted_at: string
  time_taken_ms: number | null
  participant?: Participant
}

export interface PeerAssignment {
  id: string
  session_id: string
  round: number
  reviewer_id: string
  author_id: string
  response_id: string
  response?: Response
}

export interface FollowUp {
  id: string
  session_id: string
  participant_id: string
  round: number
  prompt: string
  based_on_response_id: string
  created_at: string
}

export interface ScenarioMessage {
  id: string
  session_id: string
  participant_id: string
  turn: number
  speaker_type: 'student' | 'ai'
  speaker_name: string
  content: string
  created_at: string
}

export interface ScenarioEvaluation {
  id: string
  session_id: string
  participant_id: string
  content: {
    scores: { reasoning: number; communication: number; evidence: number; ethics: number }
    feedback: string
  }
  created_at: string
}

// Realtime event payloads
export interface RoundStartEvent {
  round: number
  duration_sec: number
  prompt: string
  server_timestamp: string
}

export interface PeerAssignedEvent {
  participant_id: string
  response_content: string
  author_name: string
  response_type: 'critique' | 'rebuttal' | 'clarification' | 'evidence_gap'
}

export interface FollowUpReadyEvent {
  participant_id: string
  prompt: string
}

// Student auth stored in localStorage
export interface StudentToken {
  participant_id: string
  token: string
  session_id: string
  display_name: string
}
