import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, Users, User, Play, Square, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Participant, Activity } from '../../lib/types'

interface ScenarioMsg {
  turn: number
  speaker_type: 'student' | 'ai'
  speaker_name: string
  content: string
}

interface Props {
  sessionId: string
  activity: Activity
  participants: Participant[]
  sessionStatus: string
  isAdvancing: boolean
  onStart: () => void
  onEnd: () => void
}

export function ScenarioMonitor({
  sessionId,
  activity,
  participants,
  sessionStatus,
  isAdvancing,
  onStart,
  onEnd,
}: Props) {
  const config = activity.config
  const maxTurns = config.max_turns ?? 8
  const [messagesByParticipant, setMessagesByParticipant] = useState<Map<string, ScenarioMsg[]>>(new Map())
  const [expanded, setExpanded] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Initial load of existing messages
  useEffect(() => {
    loadMessages()
  }, [sessionId])

  async function loadMessages() {
    const { data } = await supabase
      .from('scenario_messages')
      .select('participant_id, turn, speaker_type, speaker_name, content')
      .eq('session_id', sessionId)
      .order('turn', { ascending: true })

    if (data) {
      const map = new Map<string, ScenarioMsg[]>()
      for (const msg of data) {
        const existing = map.get(msg.participant_id) ?? []
        map.set(msg.participant_id, [...existing, msg])
      }
      setMessagesByParticipant(map)
    }
  }

  // Subscribe to new scenario_messages
  useEffect(() => {
    const ch = supabase
      .channel(`scenario_monitor:${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'scenario_messages',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        const msg = payload.new as any
        setMessagesByParticipant((prev) => {
          const next = new Map(prev)
          const existing = next.get(msg.participant_id) ?? []
          next.set(msg.participant_id, [...existing, {
            turn: msg.turn,
            speaker_type: msg.speaker_type,
            speaker_name: msg.speaker_name,
            content: msg.content,
          }])
          return next
        })
      })
      .subscribe()

    channelRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [sessionId])

  const participantsWithMessages = participants.filter((p) => (messagesByParticipant.get(p.id)?.length ?? 0) > 0)
  const totalStudentTurns = (pid: string) =>
    (messagesByParticipant.get(pid) ?? []).filter((m) => m.speaker_type === 'student').length

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{activity.title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full mr-2 ${
              activity.type === 'scenario_solo' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
            }`}>
              {activity.type === 'scenario_solo' ? 'Scenario Solo' : 'Scenario Multi'}
            </span>
            {participants.length} participants · {maxTurns} turns each
          </p>
        </div>
        <div className="flex gap-2">
          {sessionStatus === 'lobby' && (
            <button
              onClick={onStart}
              disabled={isAdvancing || participants.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-all"
            >
              {isAdvancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Start Simulation
            </button>
          )}
          {sessionStatus === 'active' && (
            <button
              onClick={onEnd}
              disabled={isAdvancing}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-50 border-2 border-red-200 text-red-700 font-semibold rounded-xl hover:bg-red-100 disabled:opacity-40 transition-all"
            >
              {isAdvancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
              End Session
            </button>
          )}
        </div>
      </div>

      {/* Scenario context snippet */}
      {config.scenario_context && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-700">Scenario: </span>
          {config.scenario_context.length > 200
            ? config.scenario_context.slice(0, 200) + '…'
            : config.scenario_context}
        </div>
      )}

      {/* Progress grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{participants.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Participants</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{participantsWithMessages.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Active</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {participants.filter((p) => totalStudentTurns(p.id) >= maxTurns).length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Completed</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {participants.length > 0
              ? Math.round(
                  participants.reduce((sum, p) => sum + totalStudentTurns(p.id), 0) /
                  participants.length
                )
              : 0}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Avg turns used</p>
        </div>
      </div>

      {/* Per-participant rows */}
      {sessionStatus === 'lobby' && (
        <p className="text-sm text-slate-400 text-center py-8">
          Waiting for students to join… ({participants.length} so far)
        </p>
      )}

      {sessionStatus !== 'lobby' && (
        <div className="flex flex-col gap-3">
          {participants.map((p) => {
            const msgs = messagesByParticipant.get(p.id) ?? []
            const turns = msgs.filter((m) => m.speaker_type === 'student').length
            const pct = Math.round((turns / maxTurns) * 100)
            const isOpen = expanded === p.id

            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <button
                  className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                >
                  <div className="w-8 h-8 rounded-full bg-kiln-50 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-kiln-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{p.display_name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[120px]">
                        <div
                          className="h-full bg-kiln-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">{turns}/{maxTurns} turns</span>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 p-4 flex flex-col gap-3 max-h-[400px] overflow-y-auto">
                    {msgs.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">No messages yet.</p>
                    ) : (
                      msgs.map((msg) => {
                        const isStudent = msg.speaker_type === 'student'
                        return (
                          <div key={msg.turn} className={`flex gap-2.5 ${isStudent ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                              isStudent ? 'bg-kiln-100' : 'bg-slate-100'
                            }`}>
                              {isStudent
                                ? <User className="w-3 h-3 text-kiln-600" />
                                : <Users className="w-3 h-3 text-slate-500" />
                              }
                            </div>
                            <div className={`flex flex-col gap-0.5 max-w-[85%] ${isStudent ? 'items-end' : 'items-start'}`}>
                              <span className="text-xs text-slate-400">{msg.speaker_name}</span>
                              <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                                isStudent
                                  ? 'bg-kiln-600 text-white rounded-tr-sm'
                                  : 'bg-slate-50 border border-slate-200 text-slate-700 rounded-tl-sm'
                              }`}>
                                {msg.content}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
