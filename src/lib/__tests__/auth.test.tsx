import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../auth'

// Capture the onAuthStateChange callback so we can trigger it in tests
let authStateCallback: (event: string, session: unknown) => void

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn((cb: (event: string, session: unknown) => void) => {
        authStateCallback = cb
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOtp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

vi.mock('../push-notifications', () => ({
  registerPushNotifications: vi.fn(),
  unregisterPushNotifications: vi.fn(),
}))

import { supabase } from '../supabase'
import { registerPushNotifications, unregisterPushNotifications } from '../push-notifications'

function TestConsumer() {
  const { user, loading, signIn, signOut } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user?.email ?? 'none'}</span>
      <button onClick={() => signIn('a@b.com', 'pass')}>Sign In</button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null } } as never)
})

describe('AuthProvider', () => {
  it('starts in loading state and resolves', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    // Initially loading
    expect(screen.getByTestId('loading').textContent).toBe('true')
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(screen.getByTestId('user').textContent).toBe('none')
  })

  it('sets user when session exists on mount', async () => {
    const fakeSession = { user: { id: 'u1', email: 'test@test.com' } }
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: fakeSession },
    } as never)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('test@test.com'))
    expect(registerPushNotifications).toHaveBeenCalledWith('u1')
  })

  it('updates user on auth state change', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))

    act(() => {
      authStateCallback('SIGNED_IN', { user: { id: 'u2', email: 'new@test.com' } })
    })

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('new@test.com'))
  })

  it('signIn calls supabase.auth.signInWithPassword', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ error: null } as never)
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    await userEvent.click(screen.getByText('Sign In'))
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pass',
    })
  })

  it('signOut clears user and calls unregister', async () => {
    const fakeSession = { user: { id: 'u1', email: 'test@test.com' } }
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: fakeSession },
    } as never)
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as never)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('test@test.com'))
    await userEvent.click(screen.getByText('Sign Out'))
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('none'))
    expect(unregisterPushNotifications).toHaveBeenCalledWith('u1')
  })
})

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within AuthProvider')
    spy.mockRestore()
  })
})
