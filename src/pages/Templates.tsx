import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { TEMPLATES, DISCIPLINES, type ActivityTemplate } from '../lib/templates'
import { ACTIVITY_META } from '../lib/activity-meta'
import type { ActivityType } from '../lib/types'
import { ArrowLeft, Search, Sparkles } from 'lucide-react'

const TYPE_FILTERS: { value: ActivityType | 'all'; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'scenario_multi', label: 'Scenario Multi' },
  { value: 'scenario_solo', label: 'Scenario Solo' },
  { value: 'peer_critique', label: 'Peer Critique' },
  { value: 'socratic_chain', label: 'Socratic Chain' },
  { value: 'peer_clarification', label: 'Peer Clarification' },
  { value: 'evidence_analysis', label: 'Evidence Analysis' },
]

export function Templates() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all')
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    let result: ActivityTemplate[] = TEMPLATES
    if (typeFilter !== 'all') result = result.filter((t) => t.type === typeFilter)
    if (disciplineFilter !== 'all') result = result.filter((t) => t.discipline === disciplineFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.discipline.toLowerCase().includes(q)
      )
    }
    return result
  }, [search, typeFilter, disciplineFilter])

  function selectTemplate(template: ActivityTemplate) {
    try { window.plausible?.('Template Used', { props: { template: template.id, discipline: template.discipline } }) } catch { /* non-critical */ }
    navigate('/instructor/create', { state: { template } })
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => navigate('/instructor')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Templates</h1>
          <p className="text-sm text-slate-500">
            {TEMPLATES.length} ready-to-use activities across {DISCIPLINES.length} disciplines. Click to customise and create.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-kiln-400 transition-colors"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ActivityType | 'all')}
          className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-kiln-400 transition-colors"
        >
          {TYPE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <select
          value={disciplineFilter}
          onChange={(e) => setDisciplineFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-kiln-400 transition-colors"
        >
          <option value="all">All disciplines</option>
          {DISCIPLINES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400">No templates match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {filtered.map((template) => {
            const meta = ACTIVITY_META[template.type]
            return (
              <div
                key={template.id}
                className="group bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 leading-snug">{template.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${meta?.color.badge ?? 'bg-slate-100 text-slate-600'}`}>
                        {meta?.shortLabel ?? template.type}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{template.discipline}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed flex-1 mb-4">
                  {template.description}
                </p>
                {template.config.learning_objectives && template.config.learning_objectives.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Learning objectives</p>
                    <ul className="flex flex-wrap gap-1.5">
                      {template.config.learning_objectives.slice(0, 3).map((obj, i) => (
                        <li key={i} className="text-xs bg-slate-50 text-slate-600 px-2.5 py-1 rounded-full">
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  onClick={() => selectTemplate(template)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-kiln-600 text-white text-sm font-semibold rounded-xl hover:bg-kiln-700 transition-all shadow-sm active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Use this template
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
