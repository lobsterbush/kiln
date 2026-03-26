import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Pedagogy } from './Pedagogy'

describe('Pedagogy', () => {
  it('renders the page title', () => {
    render(<MemoryRouter><Pedagogy /></MemoryRouter>)
    expect(screen.getByText(/why active, peer-based, timed learning works/i)).toBeInTheDocument()
  })

  it('renders the table of contents', () => {
    render(<MemoryRouter><Pedagogy /></MemoryRouter>)
    expect(screen.getAllByText(/passive learning/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/peer interaction/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/socratic/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/retrieval practice/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/assessment design/i).length).toBeGreaterThan(0)
  })

  it('includes academic references', () => {
    render(<MemoryRouter><Pedagogy /></MemoryRouter>)
    expect(screen.getAllByText(/Freeman/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Vygotsky/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Roediger/i).length).toBeGreaterThan(0)
  })

  it('has callout blocks', () => {
    render(<MemoryRouter><Pedagogy /></MemoryRouter>)
    expect(screen.getByText(/evidence is no longer debated/i)).toBeInTheDocument()
  })
})
