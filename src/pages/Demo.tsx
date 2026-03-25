import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Send, Loader2, ArrowRight, RotateCcw } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Message {
  role: 'user' | 'assistant'
  content: string
  speaker_name?: string
}

const MAX_TURNS = 4

const SCENARIO_CONTEXT =
  'A neighbouring country has just conducted a military incursion into a disputed border region. Three of your citizens — aid workers — are trapped in the conflict zone. The UN Security Council is meeting in 6 hours. Your country has a mutual defence treaty with the invaded state, but your largest trading partner is backing the aggressor. The media is demanding a response.'

const STUDENT_ROLE =
  'Foreign Minister. You are briefing the Prime Minister and must recommend a course of action and justify it.'

// Canned responses used when the edge function is unavailable (not deployed, API key missing, etc.)
const FALLBACK_RESPONSES: Record<number, string> = {
  1: "Minister, that's a principle, not a plan. The Security Council meets in six hours. I need specifics: what resolution language are you proposing, which allies have you contacted, and what's our fallback if the vote fails? Three citizens are waiting.",
  2: "You're still dancing around the trade question. Our largest trading partner backs the aggressor — that's $4.2 billion in annual trade at risk. If we invoke the mutual defence treaty, they retaliate within 48 hours. What's your mitigation strategy, or are you asking the PM to absorb that cost?",
  3: "Better. But you haven't addressed the timeline gap between your diplomatic track and the physical safety of those aid workers. Diplomacy takes weeks; they may have hours. Are you prepared to recommend a parallel extraction operation, and if so, under whose authority?",
  4: "That's the most coherent position I've heard today. I still have serious concerns about the enforcement mechanism and the trade exposure, but at least you've acknowledged the trade-offs honestly. I'll brief the PM with your recommendation — and my reservations. Prepare for hard questions.",
}

export function Demo() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [briefVisible, setBriefVisible] = useState(true)
  // usingFallback tracks whether canned fallback is being used (for analytics)
  const [, setUsingFallback] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const studentTurns = messages.filter((m) => m.role === 'user').length
  const turnsLeft = MAX_TURNS - studentTurns

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
    }
  }, [input])

  async function sendMessage() {
    if (!input.trim() || sending || completed) return
    const userContent = input.trim()
    setInput('')
    setSending(true)
    setError(null)

    const userMsg: Message = { role: 'user', content: userContent }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)

    // Track first demo message only
    if (messages.length === 0) {
      try { window.plausible?.('Demo Started') } catch { /* non-critical */ }
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke('demo-turn', {
        body: {
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        },
      })

      if (fnError || !data) throw new Error(fnError?.message ?? 'No response')

      const aiMsg: Message = {
        role: 'assistant',
        content: data.content,
        speaker_name: data.speaker_name ?? 'Dr. Chen',
      }
      setMessages((prev) => [...prev, aiMsg])
      if (data.completed || studentTurns + 1 >= MAX_TURNS) setCompleted(true)
    } catch {
      // Edge function unavailable — use canned fallback so the demo still works
      const turnNum = studentTurns + 1
      const fallbackContent = FALLBACK_RESPONSES[turnNum] ?? FALLBACK_RESPONSES[4]
      const aiMsg: Message = {
        role: 'assistant',
        content: fallbackContent,
        speaker_name: 'Dr. Chen',
      }
      setMessages((prev) => [...prev, aiMsg])
      setUsingFallback(true)
      if (turnNum >= MAX_TURNS) setCompleted(true)
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

  function handleRestart() {
    setMessages([])
    setCompleted(false)
    setError(null)
    setInput('')
    setBriefVisible(true)
    setUsingFallback(false)
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto animate-fade-in pb-8">
      {/* Demo banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
        <p className="text-sm font-semibold text-slate-700">
          Live Demo — Foreign Policy Crisis Briefing
        </p>
        <p className="text-xs text-slate-500 mt-1">
          This is a real AI-powered scenario. You have {MAX_TURNS} turns.
        </p>
      </div>

      {/* Scenario brief */}
      {briefVisible && (
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 animate-fade-in">
          <div className="flex items-start justify-between gap-3 mb-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
              Scenario · Solo
            </span>
            <button
              onClick={() => setBriefVisible(false)}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
              Hide brief
            </button>
          </div>
          <div className="mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Scenario</p>
            <p className="text-sm text-slate-700 leading-relaxed">{SCENARIO_CONTEXT}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Your role</p>
            <p className="text-sm text-slate-900 font-medium">{STUDENT_ROLE}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">You are briefing</p>
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
                DC
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Dr. Chen</p>
                <p className="text-xs text-slate-500">National Security Advisor</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-slate-500 text-white'
                  : 'bg-white border-2 border-slate-200'
              }`}
            >
              {msg.role === 'assistant' && (
                <p className="text-xs font-semibold text-rose-500 mb-1">{msg.speaker_name ?? 'Dr. Chen'}</p>
              )}
              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'text-white' : 'text-slate-700'}`}>
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start animate-slide-up">
            <div className="bg-white border-2 border-slate-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Dr. Chen is responding…</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Completed state */}
      {completed && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center animate-slide-up">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Demo complete</h3>
          <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto">
            That was one scenario with one AI persona. Kiln offers six AI-resilient activity types,
            multi-stakeholder simulations, peer critique, Socratic questioning, and more —
            all free.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/instructor"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Create your first activity <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-xl transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try again
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      {!completed && (
        <div className="sticky bottom-0 bg-slate-50/80 backdrop-blur-sm pt-2 pb-6 pb-safe">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-2">{error}</p>
          )}
          <div className="flex items-end gap-2 bg-white border-2 border-slate-200 rounded-2xl p-2 focus-within:border-slate-300 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={messages.length === 0 ? 'Brief the PM — what do you recommend?' : 'Respond to Dr. Chen…'}
              rows={1}
              disabled={sending}
              className="flex-1 px-3 py-2.5 text-sm resize-none focus:outline-none bg-transparent leading-relaxed max-h-40 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
            aria-label="Send"
            className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">
            {turnsLeft > 0
              ? `${turnsLeft} turn${turnsLeft !== 1 ? 's' : ''} remaining`
              : 'Send your final response'}
          </p>
        </div>
      )}
    </div>
  )
}
