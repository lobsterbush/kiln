import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Flame, X, Monitor } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Session, Activity, Participant, Response as KilnResponse } from '../lib/types'

export function ProjectorView() {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [session, setSession] = useState<Session | null>(null)
  const [activity, setActivity] = useState<Activity | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [responses, setResponses] = useState<KilnResponse[]>([])
  const [featured, setFeatured] = useState<string | null>(null)
  const [showNames, setShowNames] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) navigate('/instructor')
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (!id || !user) return
    loadData()
  }, [id, user])

  async function loadData() {
    const [sessResult, partsResult, respsResult] = await Promise.all([
      supabase.from('sessions').select('*, activity:activities(*)')
        .eq('id', id!).eq('instructor_id', user!.id).single(),
      supabase.from('participants').select('*').eq('session_id', id!),
      supabase.from('responses').select('*').eq('session_id', id!),
    ])
    if (!sessResult.data) { navigate('/instructor'); return }
    setSession(sessResult.data)
    setActivity(sessResult.data.activity as Activity)
    if (partsResult.data) setParticipants(partsResult.data)
    if (respsResult.data) setResponses(respsResult.data)
  }

  useEffect(() => {
    if (!id) return

    const responseSub = supabase
      .channel(`projector:responses:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'responses',
        filter: `session_id=eq.${id}`,
      }, (payload) => {
        setResponses((prev) => [...prev, payload.new as KilnResponse])
      })
      .subscribe()

    // Listen on the same channel name that InstructorSession broadcasts on
    const bc = supabase.channel(`session:${id}`)
      .on('broadcast', { event: 'round:start' }, ({ payload }) => {
        setSession((prev) =>
          prev ? { ...prev, current_round: payload.round, status: 'active', round_started_at: payload.server_timestamp } : null
        )
        setFeatured(null)
      })
      .on('broadcast', { event: 'session:status' }, ({ payload }) => {
        setSession((prev) => prev ? { ...prev, status: payload.status } : null)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(responseSub)
      supabase.removeChannel(bc)
    }
  }, [id])

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setFeatured(null)
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  if (authLoading || (!user && !authLoading)) return null

  if (!session || !activity) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 animate-pulse">Loading…</p>
      </div>
    )
  }

  const currentRound = session.current_round ?? 1
  const roundResponses = responses.filter((r) => r.round === currentRound)
  const featuredResponse = featured ? roundResponses.find((r) => r.id === featured) : null
  const featuredParticipant = featuredResponse
    ? participants.find((p) => p.id === featuredResponse.participant_id)
    : null

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col select-none">

      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-br from-kiln-400 to-kiln-600 rounded-lg shadow-sm">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">{activity.title}</p>
            <p className="text-xs text-slate-500">
              Round {currentRound}
              {' · '}
              <span className="text-kiln-400 font-medium">{roundResponses.length}</span>
              <span className="text-slate-600">/{participants.length}</span> submitted
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowNames((v) => !v)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              showNames
                ? 'bg-kiln-900 text-kiln-400 hover:bg-kiln-800'
                : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
            }`}
          >
            {showNames ? 'Names on' : 'Names off'}
          </button>
          <button
            onClick={() => window.close()}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" /> Close
          </button>
        </div>
      </div>

      {/* Featured response overlay */}
      {featuredResponse && (
        <div
          className="fixed inset-0 bg-slate-950/95 z-50 flex items-center justify-center p-12"
          onClick={() => setFeatured(null)}
        >
          <div
            className="max-w-3xl w-full bg-slate-800 rounded-3xl p-10 shadow-2xl border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            {showNames && featuredParticipant && (
              <p className="text-sm font-bold text-kiln-400 mb-6 uppercase tracking-wider">
                {featuredParticipant.display_name}
              </p>
            )}
            <p className="text-2xl text-slate-100 leading-relaxed font-light">
              {featuredResponse.content}
            </p>
            <p className="mt-8 text-xs text-slate-600">
              Press <kbd className="bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded text-xs">Esc</kbd> or click outside to close
            </p>
          </div>
        </div>
      )}

      {/* Response grid */}
      <div className="flex-1 p-8 overflow-auto">
        {roundResponses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Monitor className="w-10 h-10 text-slate-700" />
            <p className="text-slate-600 text-lg animate-pulse">Waiting for responses…</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {roundResponses.map((r) => {
              const participant = participants.find((p) => p.id === r.participant_id)
              return (
                <button
                  key={r.id}
                  onClick={() => setFeatured(r.id)}
                  className="break-inside-avoid w-full text-left bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-kiln-500/60 rounded-2xl p-5 transition-all duration-150 group"
                >
                  {showNames && participant && (
                    <p className="text-xs font-semibold text-kiln-500 mb-2">{participant.display_name}</p>
                  )}
                  <p className="text-sm text-slate-300 leading-relaxed group-hover:text-slate-200">
                    {r.content}
                  </p>
                  <p className="text-xs text-slate-700 mt-3 group-hover:text-slate-500 transition-colors">
                    Click to expand
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
