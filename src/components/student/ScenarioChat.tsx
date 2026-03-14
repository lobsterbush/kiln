import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Users, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getStudentToken } from '../../lib/utils'
import type { Activity } from '../../lib/types'

interface Message {
  turn: number
  speaker_type: 'student' | 'ai'
  speaker_name: string
  content: string
}

interface Props {
  sessionId: string
  activity: Activity
  sessionStatus: string
}

export function ScenarioChat({ sessionId, activity, sessionStatus }: Props) {
  const studentToken = getStudentToken()
  const config = activity.config
  const maxTurns = config.max_turns ?? 8
  const personas = config.ai_personas ?? []
  const primaryPersonaName = personas[0]?.name ?? 'Counterpart'

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [studentTurns, setStudentTurns] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [briefVisible, setBriefVisible] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // Lock once session completes
  useEffect(() => {
    if (sessionStatus === 'completed') setCompleted(true)
  }, [sessionStatus])

  async function sendMessage() {
    if (!input.trim() || sending || completed || !studentToken) return
    const userContent = input.trim()
    setInput('')
    setSending(true)
    setError(null)

    // Optimistically add student message
    const studentTurn = messages.length + 1
    const studentMsg: Message = {
      turn: studentTurn,
      speaker_type: 'student',
      speaker_name: studentToken.display_name,
      content: userContent,
    }
    setMessages((prev) => [...prev, studentMsg])

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-scenario-turn', {
        body: {
          session_id: sessionId,
          participant_id: studentToken.participant_id,
          token: studentToken.token,
          content: userContent,
        },
      })

      if (fnError || !data) throw new Error(fnError?.message ?? 'No response')

      const aiMsg: Message = {
        turn: studentTurn + 1,
        speaker_type: 'ai',
        speaker_name: data.speaker_name ?? primaryPersonaName,
        content: data.content,
      }
      setMessages((prev) => [...prev, aiMsg])
      setStudentTurns(data.student_turns_used ?? studentTurns + 1)
      if (data.completed) setCompleted(true)
    } catch (err) {
      setError('Could not send message. Please try again.')
      // Roll back optimistic message
      setMessages((prev) => prev.filter((m) => m.turn !== studentTurn))
      setInput(userContent)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const turnsLeft = maxTurns - studentTurns

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto animate-fade-in">

      {/* Scenario brief — collapsible */}
      {briefVisible && (
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 animate-fade-in">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                activity.type === 'scenario_solo'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-indigo-100 text-indigo-700'
              }`}>
                {activity.type === 'scenario_solo' ? 'Scenario · Solo' : 'Scenario · Multi-Stakeholder'}
              </span>
            </div>
            <button
              onClick={() => setBriefVisible(false)}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
              Hide brief
            </button>
          </div>
          {config.scenario_context && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Scenario</p>
              <p className="text-sm text-slate-700 leading-relaxed">{config.scenario_context}</p>
            </div>
          )}
          {config.student_role && (
            <div className="bg-kiln-50 border border-kiln-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-kiln-600 uppercase tracking-wider mb-1">Your role</p>
              <p className="text-sm text-kiln-900 font-medium">{config.student_role}</p>
            </div>
          )}
          {personas.length > 1 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">You are negotiating with</p>
              <div className="flex flex-wrap gap-2">
                {personas.map((p) => (
                  <div key={p.name} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">{p.name}</span>
                    <span className="text-xs text-slate-400">{p.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Brief hidden — show button to restore */}
      {!briefVisible && (
        <button
          onClick={() => setBriefVisible(true)}
          className="text-xs text-slate-400 hover:text-kiln-600 transition-colors text-left"
        >
          ↑ Show scenario brief
        </button>
      )}

      {/* Chat thread */}
      <div className="flex flex-col gap-3">
        {messages.length === 0 && !sending && (
          <p className="text-sm text-slate-400 text-center py-6">
            {config.initial_prompt
              ? <span className="italic">{config.initial_prompt}</span>
              : 'Type your opening message to begin the simulation.'}
          </p>
        )}

        {messages.map((msg) => {
          const isStudent = msg.speaker_type === 'student'
          return (
            <div key={msg.turn} className={`flex gap-3 ${isStudent ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isStudent ? 'bg-kiln-100' : 'bg-slate-100'
              }`}>
                {isStudent
                  ? <User className="w-4 h-4 text-kiln-600" />
                  : <Users className="w-4 h-4 text-slate-500" />
                }
              </div>
              <div className={`flex flex-col gap-1 max-w-[80%] ${isStudent ? 'items-end' : 'items-start'}`}>
                <span className="text-xs text-slate-400 font-medium">{msg.speaker_name}</span>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  isStudent
                    ? 'bg-kiln-600 text-white rounded-tr-sm'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {sending && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-slate-500" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5 items-center h-4">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* Completed state */}
      {completed && (
        <div className="flex flex-col items-center gap-3 py-8 text-center animate-fade-in">
          <div className="text-3xl">🎭</div>
          <h3 className="font-bold text-slate-900">Simulation complete</h3>
          <p className="text-sm text-slate-500">
            {sessionStatus === 'completed'
              ? 'Your instructor has ended the session. Your transcript has been saved.'
              : "You've used all your turns. Waiting for the session to close."}
          </p>
        </div>
      )}

      {/* Input area */}
      {!completed && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              placeholder="Type your message…"
              rows={3}
              className="flex-1 px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl resize-none focus:outline-none focus:border-kiln-400 transition-colors text-sm leading-relaxed disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="p-3.5 bg-kiln-600 text-white rounded-2xl hover:bg-kiln-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-slate-400">Enter to send · Shift+Enter for new line</p>
            <p className={`text-xs font-medium ${turnsLeft <= 2 ? 'text-amber-500' : 'text-slate-400'}`}>
              {turnsLeft} turn{turnsLeft !== 1 ? 's' : ''} remaining
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
