import { FileText } from 'lucide-react'
import type { MediaType } from '../../lib/types'

interface MediaDisplayProps {
  url: string
  type: MediaType
  /** Compact mode for instructor monitor thumbnails */
  compact?: boolean
}

export function MediaDisplay({ url, type, compact = false }: MediaDisplayProps) {
  if (type === 'pdf') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors ${compact ? 'text-xs' : 'text-sm'}`}
      >
        <FileText className={compact ? 'w-4 h-4 text-red-500' : 'w-5 h-5 text-red-500'} />
        <span className="font-medium text-slate-700">View attached document (PDF)</span>
      </a>
    )
  }

  // Image
  return (
    <img
      src={url}
      alt="Activity media"
      className={`rounded-xl border border-slate-200 object-contain bg-white ${
        compact ? 'max-h-32' : 'max-h-80 w-full'
      }`}
    />
  )
}
