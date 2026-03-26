import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { registerPushNotifications, unregisterPushNotifications } from './push-notifications'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsConfirmation?: boolean }>
  sendMagicLink: (email: string) => Promise<{ error: Error | null }>
  signInWithOAuth: (provider: 'google' | 'github' | 'azure') => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      // Register for push notifications if already signed in (app relaunch)
      if (session?.user) void registerPushNotifications(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        // Register on sign-in, handled idempotently
        if (session?.user) void registerPushNotifications(session.user.id)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}instructor`,
      },
    })
    if (error) return { error: error as Error | null }
    // needsConfirmation = no session yet (email confirm required)
    const needsConfirmation = !data.session
    return { error: null, needsConfirmation }
  }

  async function signInWithOAuth(provider: 'google' | 'github' | 'azure') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}instructor`,
      },
    })
    return { error: error as Error | null }
  }

  async function sendMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}instructor`,
      },
    })
    return { error: error as Error | null }
  }

  async function signOut() {
    const uid = user?.id
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    if (uid) void unregisterPushNotifications(uid)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, sendMagicLink, signInWithOAuth, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
