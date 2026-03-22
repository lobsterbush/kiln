import { useState } from 'react'
import { CheckCircle, MessageSquare } from 'lucide-react'
import { supabase } from '../lib/supabase'

type Category = 'bug' | 'feature' | 'general' | 'other'

const CATEGORIES: { value: Category; label: string; description: string }[] = [
  { value: 'bug',     label: '🐛 Bug report',    description: 'Something is broken or behaving unexpectedly' },
  { value: 'feature', label: '✨ Feature request', description: 'An idea for something new or improved' },
  { value: 'general', label: '💬 General',        description: 'Thoughts, questions, or anything else' },
  { value: 'other',   label: '📎 Other',          description: 'Something that doesn\'t fit above' },
]

export function Feedback() {
  const [category, setCategory] = useState<Category>('general')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError(null)
    const { error: dbError } = await supabase.from('feedback').insert({
      category,
      message: message.trim(),
      email: email.trim() || null,
    })
    if (dbError) {
      setError('Something went wrong. Please try again or email us directly at feedback@usekiln.org.')
      setSubmitting(false)
      return
    }
    setDone(true)
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center animate-fade-in">
        <div className="p-4 bg-kiln-50 rounded-2xl w-fit mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-kiln-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Thanks — received.</h1>
        <p className="text-slate-500 text-sm">
          Your feedback helps shape what gets built next. If you left an email, we'll follow up.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-kiln-50 rounded-xl">
          <MessageSquare className="w-5 h-5 text-kiln-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Send feedback</h1>
          <p className="text-sm text-slate-400">Your input shapes the roadmap.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`text-left px-3.5 py-3 rounded-xl border-2 transition-all ${
                  category === c.value
                    ? 'border-kiln-400 bg-kiln-50 text-kiln-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <p className="text-sm font-semibold">{c.label}</p>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{c.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what happened, what you expected, or what you'd love to see…"
            rows={5}
            required
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-kiln-400 transition-colors resize-none"
          />
        </div>

        {/* Email (optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Your email <span className="font-normal text-slate-400">(optional — so we can follow up)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@institution.edu"
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-kiln-400 transition-colors"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !message.trim()}
          className="px-6 py-3.5 bg-gradient-to-r from-kiln-500 to-kiln-600 text-white font-semibold rounded-xl hover:from-kiln-600 hover:to-kiln-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-kiln-200 active:scale-95"
        >
          {submitting ? 'Sending…' : 'Send feedback'}
        </button>
      </form>
    </div>
  )
}
