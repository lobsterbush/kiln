import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Session, Activity, Participant, Response as KilnResponse, PeerAssignment } from '../lib/types'
import { Download, ArrowLeft } from 'lucide-react'

export function Results() {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [activity, setActivity] = useState<Activity | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [responses, setResponses] = useState<KilnResponse[]>([])
  const [assignments, setAssignments] = useState<PeerAssignment[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/instructor')
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (!id || !user) return
    loadData()
  }, [id, user])

  async function loadData() {
    const [sessResult, partsResult, respsResult, assignsResult] = await Promise.all([
      supabase.from('sessions').select('*, activity:activities(*)').eq('id', id!).eq('instructor_id', user!.id).single(),
      supabase.from('participants').select('*').eq('session_id', id!),
      supabase.from('responses').select('*').eq('session_id', id!)
        .order('round', { ascending: true }).order('submitted_at', { ascending: true }),
      supabase.from('peer_assignments').select('*').eq('session_id', id!),
    ])

    if (!sessResult.data) {
      setLoadError('Session not found or you do not have permission to view it.')
      return
    }
    if (partsResult.error || respsResult.error || assignsResult.error) {
      setLoadError('Could not load session data. Please refresh.')
      return
    }

    setSession(sessResult.data)
    setActivity(sessResult.data.activity as Activity)
    if (partsResult.data) setParticipants(partsResult.data)
    if (respsResult.data) setResponses(respsResult.data)
    if (assignsResult.data) setAssignments(assignsResult.data)
  }

  function exportCSV() {
    const headers = ['participant', 'round', 'type', 'responding_to', 'content', 'time_taken_ms', 'submitted_at']
    const rows = responses.map((r) => {
      const p = participants.find((p) => p.id === r.participant_id)
      // Peer context: who did this participant respond to?
      const asReviewer = assignments.find((a) => a.reviewer_id === r.participant_id && a.round === r.round)
      const asAuthor = assignments.find((a) => a.author_id === r.participant_id && a.round === r.round - 1)
      let respondingTo = ''
      if (asReviewer) {
        const author = participants.find((q) => q.id === asReviewer.author_id)
        respondingTo = author?.display_name ?? ''
      } else if (asAuthor && r.response_type === 'rebuttal') {
        const reviewer = participants.find((q) => q.id === asAuthor.reviewer_id)
        respondingTo = reviewer?.display_name ?? ''
      }
      return [
        p?.display_name ?? 'Unknown',
        r.round,
        r.response_type,
        respondingTo,
        `"${r.content.replace(/"/g, '""')}"`,
        r.time_taken_ms ?? '',
        r.submitted_at,
      ].join(',')
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kiln-session-${session?.join_code ?? id}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (authLoading) {
    return <div className="flex justify-center py-20 text-slate-500">Loading...</div>
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-red-500">{loadError}</p>
        <Link to="/instructor" className="text-sm text-kiln-600 hover:underline">Back to dashboard</Link>
      </div>
    )
  }

  if (!session || !activity) {
    return <div className="flex justify-center py-20 text-slate-500">Loading results...</div>
  }

  const TYPE_LABELS: Record<string, string> = {
    initial: 'Initial',
    critique: 'Critique',
    rebuttal: 'Rebuttal',
    followup_answer: 'Follow-up',
  }

  // Summary stats
  const totalResponses = responses.length
  const avgWords = totalResponses > 0
    ? Math.round(responses.reduce((sum, r) => sum + r.content.trim().split(/\s+/).length, 0) / totalResponses)
    : 0

  // Group responses by participant, with peer context inline
  // Filter out participants who never submitted (e.g. joined then left)
  const byParticipant = participants.map((p) => {
    const chain = responses
      .filter((r) => r.participant_id === p.id)
      .sort((a, b) => a.round - b.round)

    // For each response, find what the student was responding TO
    const withContext = chain.map((r) => {
      // Was this participant a reviewer in this round? If so, show whose work they critiqued.
      const asReviewer = assignments.find((a) => a.reviewer_id === p.id && a.round === r.round)
      // Was this participant the author being critiqued in this round? Show who critiqued them.
      const asAuthor = assignments.find((a) => a.author_id === p.id && a.round === r.round - 1)

      let context: string | null = null
      if (asReviewer) {
        const author = participants.find((q) => q.id === asReviewer.author_id)
        context = `→ critiqued ${author?.display_name ?? 'a classmate'}`
      } else if (asAuthor && r.response_type === 'rebuttal') {
        const reviewer = participants.find((q) => q.id === asAuthor.reviewer_id)
        context = `→ rebutted ${reviewer?.display_name ?? 'a classmate'}’s critique`
      }

      return { ...r, context }
    })

    return { participant: p, chain: withContext }
  }).filter(({ chain }) => chain.length > 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/instructor" className="text-sm text-slate-400 hover:text-kiln-600 flex items-center gap-1 mb-3 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{activity.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Session <span className="font-mono font-semibold">{session.join_code}</span> · {participants.length} participants · {activity.config.rounds} rounds
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-600 font-medium rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary stats */}
      {(participants.length > 0 || totalResponses > 0) && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{byParticipant.length}<span className="text-base font-normal text-slate-400">/{participants.length}</span></p>
            <p className="text-xs text-slate-500 mt-0.5">Participated</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{totalResponses}</p>
            <p className="text-xs text-slate-500 mt-0.5">Responses</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{avgWords}</p>
            <p className="text-xs text-slate-500 mt-0.5">Avg. words</p>
          </div>
        </div>
      )}

      {byParticipant.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-10">No responses were submitted this session.</p>
      )}
      {participants.length > byParticipant.length && byParticipant.length > 0 && (
        <p className="text-xs text-slate-400">
          {participants.length - byParticipant.length} participant{participants.length - byParticipant.length !== 1 ? 's' : ''} joined but did not submit.
        </p>
      )}
      <div className="flex flex-col gap-4 stagger-children">
        {byParticipant.map(({ participant, chain }) => (
          <div key={participant.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
            <h3 className="font-semibold text-slate-900 mb-4">{participant.display_name}</h3>
            <div className="flex flex-col gap-3">
              {chain.map((r) => (
                <div key={r.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-mono text-slate-400 bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                      {r.round}
                    </span>
                    {r.round < activity.config.rounds && (
                      <div className="w-px flex-1 bg-slate-200 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-400">{TYPE_LABELS[r.response_type] ?? r.response_type}</span>
                      {r.context && (
                        <span className="text-xs text-kiln-500 font-medium">{r.context}</span>
                      )}
                      {r.time_taken_ms != null && (
                        <span className="text-xs text-slate-300">{(r.time_taken_ms / 1000).toFixed(1)}s</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 mt-0.5 leading-relaxed">{r.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
