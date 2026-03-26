import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MediaDisplay } from './MediaDisplay'

describe('MediaDisplay', () => {
  it('renders an image for image type', () => {
    render(<MediaDisplay url="https://example.com/photo.jpg" type="image" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
    expect(img).toHaveAttribute('alt', 'Activity media')
  })

  it('renders a PDF link for pdf type', () => {
    render(<MediaDisplay url="https://example.com/doc.pdf" type="pdf" />)
    const link = screen.getByRole('link', { name: /view attached document/i })
    expect(link).toHaveAttribute('href', 'https://example.com/doc.pdf')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('applies compact styling when compact=true', () => {
    const { container } = render(
      <MediaDisplay url="https://example.com/photo.jpg" type="image" compact />,
    )
    const img = container.querySelector('img')
    expect(img?.className).toContain('max-h-32')
  })

  it('applies full-size styling when compact=false', () => {
    const { container } = render(
      <MediaDisplay url="https://example.com/photo.jpg" type="image" />,
    )
    const img = container.querySelector('img')
    expect(img?.className).toContain('max-h-80')
  })
})
