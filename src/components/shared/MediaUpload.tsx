import { useState, useRef } from 'react'
import { Upload, X, Loader2, FileText, Image as ImageIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { MediaType } from '../../lib/types'

const MAX_SIZE_MB = 5
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
const ACCEPTED = '.png,.jpg,.jpeg,.gif,.webp,.pdf'

interface MediaUploadProps {
  instructorId: string
  mediaUrl: string | undefined
  mediaType: MediaType | undefined
  onChange: (url: string | undefined, type: MediaType | undefined) => void
}

function inferMediaType(fileName: string): MediaType {
  return fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'
}

export function MediaUpload({ instructorId, mediaUrl, mediaType, onChange }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)

    if (file.size > MAX_SIZE_BYTES) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is ${MAX_SIZE_MB} MB.`)
      return
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const id = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')
    const path = `${instructorId}/${id}.${ext}`

    setUploading(true)
    const { error: uploadError } = await supabase.storage
      .from('activity-media')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      setError('Upload failed. Please try again.')
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('activity-media')
      .getPublicUrl(path)

    onChange(urlData.publicUrl, inferMediaType(file.name))
    setUploading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  async function handleRemove() {
    if (!mediaUrl) return
    // Extract storage path from public URL
    const match = mediaUrl.match(/activity-media\/(.+)$/)
    if (match) {
      await supabase.storage.from('activity-media').remove([match[1]])
    }
    onChange(undefined, undefined)
  }

  // Preview of already-uploaded media
  if (mediaUrl) {
    return (
      <div className="flex flex-col gap-2">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Attached media
        </label>
        <div className="relative inline-block">
          {mediaType === 'pdf' ? (
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
              <FileText className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">PDF document</span>
            </div>
          ) : (
            <img
              src={mediaUrl}
              alt="Uploaded media"
              className="max-h-40 rounded-xl border border-slate-200 object-contain bg-white"
            />
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
            aria-label="Remove media"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // Upload zone
  return (
    <div className="flex flex-col gap-2">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Attach an image or document{' '}
        <span className="normal-case font-normal text-slate-400">(optional — students see this alongside the prompt)</span>
      </label>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center gap-2 px-6 py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:border-kiln-300 hover:bg-kiln-50/30 transition-colors cursor-pointer"
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 text-kiln-500 animate-spin" />
        ) : (
          <>
            <div className="flex items-center gap-2 text-slate-400">
              <ImageIcon className="w-5 h-5" />
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-sm text-slate-500">
              Drop a file or <span className="text-kiln-600 font-medium">browse</span>
            </p>
            <p className="text-xs text-slate-400">PNG, JPG, GIF, WebP, or PDF · max {MAX_SIZE_MB} MB</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleInputChange}
        className="hidden"
      />
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
