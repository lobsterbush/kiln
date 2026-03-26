/**
 * Push notification registration for Capacitor (iOS native).
 *
 * On the web this is a no-op. On native iOS it:
 *   1. Requests notification permission
 *   2. Registers with APNs
 *   3. Stores the device token in Supabase so we can send notifications later
 *   4. Handles incoming notifications (e.g. deep-linking to a session)
 */

import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { supabase } from './supabase'

let registered = false

/**
 * Call after a user signs in. Safe to call on web — it returns immediately.
 * Idempotent: calling multiple times will not re-register or duplicate tokens.
 */
export async function registerPushNotifications(userId: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || registered) return

  const permResult = await PushNotifications.requestPermissions()
  if (permResult.receive !== 'granted') return

  await PushNotifications.register()

  void PushNotifications.addListener('registration', async (token) => {
    registered = true
    // Upsert: one row per user+platform, updated on each sign-in
    await supabase.from('device_tokens').upsert(
      {
        user_id: userId,
        token: token.value,
        platform: 'ios',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,platform' },
    )
  })

  void PushNotifications.addListener('registrationError', (err) => {
    console.warn('[Kiln] Push registration failed:', err.error)
  })

  // Handle notification taps (app was backgrounded or closed)
  void PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    const data = notification.notification.data
    // Deep-link to session if the notification includes a session_id
    if (data?.session_id) {
      window.location.href = `/instructor/session/${data.session_id}`
    }
  })
}

/**
 * Call on sign-out to remove the device token so we stop sending notifications.
 */
export async function unregisterPushNotifications(userId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  registered = false
  await supabase
    .from('device_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('platform', 'ios')
}
