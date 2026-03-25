import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReloadPrompt } from './ReloadPrompt'

// Mock the virtual PWA register module
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(),
}))

async function getHook() {
  const mod = await import('virtual:pwa-register/react')
  return mod.useRegisterSW as ReturnType<typeof vi.fn>
}

describe('ReloadPrompt', () => {
  it('renders nothing when needRefresh is false', async () => {
    const useRegisterSW = await getHook()
    useRegisterSW.mockReturnValue({
      needRefresh: [false],
      updateServiceWorker: vi.fn(),
    })
    const { container } = render(<ReloadPrompt />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the update banner when needRefresh is true', async () => {
    const useRegisterSW = await getHook()
    useRegisterSW.mockReturnValue({
      needRefresh: [true],
      updateServiceWorker: vi.fn(),
    })
    render(<ReloadPrompt />)
    expect(screen.getByText(/new version is available/i)).toBeInTheDocument()
  })

  it('calls updateServiceWorker(true) when Update button is clicked', async () => {
    const updateServiceWorker = vi.fn()
    const useRegisterSW = await getHook()
    useRegisterSW.mockReturnValue({
      needRefresh: [true],
      updateServiceWorker,
    })
    render(<ReloadPrompt />)
    await userEvent.click(screen.getByRole('button', { name: /update/i }))
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })
})
