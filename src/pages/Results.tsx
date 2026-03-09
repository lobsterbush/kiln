import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Session, Activity, Participant, Response as KilnResponse } from '../lib/types'
import { Download, ArrowLeft } from 'lucide-react'

export function Results() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [activity, setActivity] = useState<Activity | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [responses, setResponses] = useState<KilnResponse[]>([])

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  async function loadData() {
    const { data: sess } = await supabase
      .from('sessions')
      .select('*, activity:activities(*)')
      .eq('id', id)
      .single()
    if (sess) {
      setSession(sess)
      setActivity(sess.activity as Activity)
    }

    const { data: parts } = await supabase
      .from('participants')
      .select('*')
      .eq('session_id', id!)
    if (parts) setParticipants(parts)

    const { data: resps } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', id!)
      .order('round', { ascending: true })
      .order('submitted_at', { ascending: true })
    if (resps) setResponses(resps)
  }

  function exportCSV() {
    const headers = ['participant', 'round', 'type', 'content', 'time_taken_ms', 'submitted_at']
    const rows = responses.map((r) => {
      const p = participants.find((p) => p.id === r.participant_id)
      return [
        p?.display_name ?? 'Unknown',
        r.round,
        r.response_type,
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
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!session || !activity) {
    return <div className="flex justify-center py-20 text-slate-500">Loading results...</div>
  }

  // Group responses by participant
  const byParticipant = participants.map((p) => ({
    participant: p,
    chain: responses
      .filter((r) => r.participant_id === p.id)
      .sort((a, b) => a.round - b.round),
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/instructor" className="text-sm text-slate-500 hover:text-orange-600 flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3 h-3" /> Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{activity.title}</h1>
          <p className="text-sm text-slate-500">
            Session {session.join_code} · {participants.length} participants · {activity.config.rounds} rounds
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {byParticipant.map(({ participant, chain }) => (
          <div key={participant.id} className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-3">{participant.display_name}</h3>
            <div className="flex flex-col gap-3">
              {chain.map((r) => (
                <div key={r.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-mono text-slate-400 bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center">
                      {r.round}
                    </span>
                    {r.round < activity.config.rounds && (
                      <div className="w-px h-full bg-slate-200 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <span className="text-xs text-slate-400 capitalize">{r.response_type.replace('_', ' ')}</span>
                    <p className="text-sm text-slate-700 mt-0.5">{r.content}</p>
                    {r.time_taken_ms && (
                      <span className="text-xs text-slate-400">
                        {(r.time_taken_ms / 1000).toFixed(1)}s
                      </span>
                    )}
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
