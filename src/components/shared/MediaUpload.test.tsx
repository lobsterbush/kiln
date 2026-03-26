import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MediaUpload } from './MediaUpload'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
  },
}))

import { supabase } from '../../lib/supabase'

beforeEach(() => vi.clearAllMocks())

describe('MediaUpload — upload zone', () => {
  it('renders upload zone when no media is set', () => {
    render(
      <MediaUpload instructorId="inst-1" mediaUrl={undefined} mediaType={undefined} onChange={vi.fn()} />,
    )
    expect(screen.getByText(/drop a file/i)).toBeInTheDocument()
    expect(screen.getByText(/max 5 MB/i)).toBeInTheDocument()
  })

  it('shows error for files exceeding 5MB', async () => {
    const onChange = vi.fn()
    render(
      <MediaUpload instructorId="inst-1" mediaUrl={undefined} mediaType={undefined} onChange={onChange} />,
    )
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const bigFile = new File(['x'.repeat(6 * 1024 * 1024)], 'big.png', { type: 'image/png' })
    await userEvent.upload(input, bigFile)
    expect(screen.getByText(/file too large/i)).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('uploads a valid file and calls onChange', async () => {
    const onChange = vi.fn()
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://storage.com/photo.png' } }),
    } as never)

    render(
      <MediaUpload instructorId="inst-1" mediaUrl={undefined} mediaType={undefined} onChange={onChange} />,
    )
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['pixels'], 'photo.png', { type: 'image/png' })
    await userEvent.upload(input, file)
    expect(onChange).toHaveBeenCalledWith('https://storage.com/photo.png', 'image')
  })
})

describe('MediaUpload — preview', () => {
  it('renders image preview when mediaUrl and mediaType=image are set', () => {
    render(
      <MediaUpload
        instructorId="inst-1"
        mediaUrl="https://example.com/photo.png"
        mediaType="image"
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByAltText('Uploaded media')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument()
  })

  it('renders PDF preview when mediaType=pdf', () => {
    render(
      <MediaUpload
        instructorId="inst-1"
        mediaUrl="https://example.com/doc.pdf"
        mediaType="pdf"
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByText('PDF document')).toBeInTheDocument()
  })

  it('calls onChange with undefined when remove button is clicked', async () => {
    const onChange = vi.fn()
    vi.mocked(supabase.storage.from).mockReturnValue({
      remove: vi.fn().mockResolvedValue({ error: null }),
    } as never)

    render(
      <MediaUpload
        instructorId="inst-1"
        mediaUrl="https://storage.com/activity-media/inst-1/abc.png"
        mediaType="image"
        onChange={onChange}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(onChange).toHaveBeenCalledWith(undefined, undefined)
  })
})
