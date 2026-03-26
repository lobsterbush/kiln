import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { ACTIVITY_META } from '../lib/activity-meta'
import type { ActivityType } from '../lib/types'
import { ArrowLeft, TrendingUp, Users, MessageSquare, BarChart2, Calendar, RefreshCw, FileText } from 'lucide-react'

interface SessionRow {
  id: string
  created_at: string
  status: string
  activity_id: string
  activity: { title: string; type: string }[] | null
  participants: { count: number }[]
  responses: { count: number }[]
}

interface ResponseRow {
  id: string
  session_id: string
  content: string
  submitted_at: string
}

interface WeekBucket {
  label: string
  sessions: number
  students: number
  responses: number
}

export function Analytics() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [allResponses, setAllResponses] = useState<ResponseRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) void navigate('/instructor')
  }, [user, authLoading, navigate])

  const loadData = useCallback(async () => {
    if (!user) return
    const [sessResult, respResult] = await Promise.all([
      supabase
        .from('sessions')
        .select('id, created_at, status, activity_id, activity:activities(title, type), participants:participants(count), responses:responses(count)')
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('responses')
        .select('id, session_id, content, submitted_at')
        .limit(5000),
    ])
    if (sessResult.data) setSessions(sessResult.data as SessionRow[])
    if (respResult.data) setAllResponses(respResult.data as ResponseRow[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    void loadData()
  }, [loadData])

  if (authLoading || loading) {
    return <div className="flex justify-center py-20 text-slate-500">Loading…</div>
  }

  const completedSessions = sessions.filter((s) => s.status === 'completed')
  const completedIds = new Set(completedSessions.map((s) => s.id))
  const totalStudents = completedSessions.reduce((sum, s) => sum + (s.participants?.[0]?.count ?? 0), 0)
  const totalResponses = completedSessions.reduce((sum, s) => sum + (s.responses?.[0]?.count ?? 0), 0)
  const avgStudents = completedSessions.length > 0 ? Math.round(totalStudents / completedSessions.length) : 0

  // Retention: number of activities that have been run more than once
  const activitySessionCount = new Map<string, number>()
  for (const s of completedSessions) {
    activitySessionCount.set(s.activity_id, (activitySessionCount.get(s.activity_id) ?? 0) + 1)
  }
  const reusedActivities = [...activitySessionCount.values()].filter((c) => c > 1).length
  const totalActivities = activitySessionCount.size

  // Word count metrics from actual response content
  const completedResponses = allResponses.filter((r) => completedIds.has(r.session_id))
  const wordCounts = completedResponses.map((r) => r.content.trim().split(/\s+/).filter(Boolean).length)
  const totalWords = wordCounts.reduce((sum, w) => sum + w, 0)
  const avgWordsPerResponse = wordCounts.length > 0 ? Math.round(totalWords / wordCounts.length) : 0

  // Activity usage breakdown
  const activityUsage = new Map<string, { title: string; type: string; count: number; students: number }>()
  for (const s of completedSessions) {
    const title = s.activity?.[0]?.title ?? 'Untitled'
    const type = s.activity?.[0]?.type ?? 'unknown'
    const key = s.activity_id
    const existing = activityUsage.get(key)
    const students = s.participants?.[0]?.count ?? 0
    if (existing) {
      existing.count++
      existing.students += students
    } else {
      activityUsage.set(key, { title, type, count: 1, students })
    }
  }
  const sortedActivities = [...activityUsage.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)

  // Weekly buckets for the bar chart
  const weeks: WeekBucket[] = []
  if (completedSessions.length > 0) {
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - i * 7)
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const weekSessions = completedSessions.filter((s) => {
        const d = new Date(s.created_at)
        return d >= weekStart && d < weekEnd
      })

      weeks.push({
        label,
        sessions: weekSessions.length,
        students: weekSessions.reduce((sum, s) => sum + (s.participants?.[0]?.count ?? 0), 0),
        responses: weekSessions.reduce((sum, s) => sum + (s.responses?.[0]?.count ?? 0), 0),
      })
    }
  }

  const maxSessions = Math.max(...weeks.map((w) => w.sessions), 1)

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto animate-fade-in">
      <div>
        <Link to="/instructor" className="text-sm text-slate-400 hover:text-kiln-600 flex items-center gap-1 mb-3 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">Your teaching activity at a glance.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Sessions', value: completedSessions.length, icon: Calendar, color: 'text-kiln-500 bg-kiln-50' },
          { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-blue-500 bg-blue-50' },
          { label: 'Avg Students/Session', value: avgStudents, icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50' },
          { label: 'Total Responses', value: totalResponses, icon: MessageSquare, color: 'text-purple-500 bg-purple-50' },
          { label: 'Avg Words/Response', value: avgWordsPerResponse, icon: FileText, color: 'text-cyan-500 bg-cyan-50' },
          { label: 'Re-used Activities', value: `${reusedActivities}/${totalActivities}`, icon: RefreshCw, color: 'text-teal-500 bg-teal-50', subtitle: 'run >1 time' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 rounded-xl ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</p>
            {'subtitle' in card && card.subtitle && <p className="text-xs text-slate-400 mt-1">{card.subtitle}</p>}
          </div>
        ))}
      </div>

      {/* Weekly activity chart */}
      {weeks.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Sessions per week</h2>
            <span className="text-xs text-slate-400">(last 12 weeks)</span>
          </div>
          <div className="flex items-end gap-2 h-40">
            {weeks.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-slate-500">{w.sessions || ''}</span>
                <div
                  className="w-full bg-kiln-400 rounded-t-lg transition-all duration-300 min-h-[2px]"
                  style={{ height: `${Math.max((w.sessions / maxSessions) * 100, w.sessions > 0 ? 8 : 2)}%` }}
                />
                <span className="text-[10px] text-slate-400 mt-1 truncate w-full text-center">{w.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Word count trend */}
      {weeks.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <FileText className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Avg words per response</h2>
            <span className="text-xs text-slate-400">(last 12 weeks)</span>
          </div>
          <div className="flex items-end gap-2 h-40">
            {(() => {
              const weekWordAvgs = weeks.map((w) => {
                const weekStart = new Date()
                const idx = weeks.indexOf(w)
                weekStart.setDate(weekStart.getDate() - (11 - idx) * 7)
                weekStart.setHours(0, 0, 0, 0)
                const weekEnd = new Date(weekStart)
                weekEnd.setDate(weekEnd.getDate() + 7)
                const weekResponses = completedResponses.filter((r) => {
                  const d = new Date(r.submitted_at)
                  return d >= weekStart && d < weekEnd
                })
                if (weekResponses.length === 0) return 0
                const words = weekResponses.reduce((sum, r) => sum + r.content.trim().split(/\s+/).filter(Boolean).length, 0)
                return Math.round(words / weekResponses.length)
              })
              const maxWords = Math.max(...weekWordAvgs, 1)
              return weeks.map((w, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-slate-500">{weekWordAvgs[i] || ''}</span>
                  <div
                    className="w-full bg-amber-400 rounded-t-lg transition-all duration-300 min-h-[2px]"
                    style={{ height: `${Math.max((weekWordAvgs[i] / maxWords) * 100, weekWordAvgs[i] > 0 ? 8 : 2)}%` }}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 truncate w-full text-center">{w.label}</span>
                </div>
              ))
            })()}
          </div>
        </div>
      )}

      {/* Activity usage breakdown */}
      {sortedActivities.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Most-used activities</h2>
          <div className="flex flex-col gap-3">
            {sortedActivities.map(([activityId, data]) => {
              const meta = ACTIVITY_META[data.type as ActivityType]
              const maxCount = sortedActivities[0][1].count
              return (
                <div key={activityId} className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-800 truncate">{data.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${meta?.color.badge ?? 'bg-slate-100 text-slate-600'}`}>
                        {meta?.shortLabel ?? data.type}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-kiln-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(data.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-700">{data.count}</p>
                    <p className="text-xs text-slate-400">{data.students} students</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {completedSessions.length === 0 && (
        <div className="text-center py-16">
          <p className="text-slate-400 mb-2">No completed sessions yet.</p>
          <Link to="/instructor" className="text-sm text-kiln-600 hover:text-kiln-700 font-medium">
            Run your first activity →
          </Link>
        </div>
      )}
    </div>
  )
}
