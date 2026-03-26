import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Privacy } from './Privacy'

describe('Privacy', () => {
  it('renders the page title', () => {
    render(<MemoryRouter><Privacy /></MemoryRouter>)
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
  })

  it('includes key sections', () => {
    render(<MemoryRouter><Privacy /></MemoryRouter>)
    expect(screen.getByText('What is Kiln?')).toBeInTheDocument()
    expect(screen.getByText('What data we collect')).toBeInTheDocument()
    expect(screen.getByText('How we use your data')).toBeInTheDocument()
    expect(screen.getByText('Third-party processors')).toBeInTheDocument()
    expect(screen.getByText('Data retention')).toBeInTheDocument()
    expect(screen.getByText('Your rights')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('mentions Supabase and Anthropic', () => {
    render(<MemoryRouter><Privacy /></MemoryRouter>)
    expect(screen.getByText('Supabase')).toBeInTheDocument()
    expect(screen.getByText('Anthropic')).toBeInTheDocument()
  })

  it('has a contact email link', () => {
    render(<MemoryRouter><Privacy /></MemoryRouter>)
    const link = screen.getByRole('link', { name: 'feedback@usekiln.org' })
    expect(link).toHaveAttribute('href', 'mailto:feedback@usekiln.org')
  })
})
