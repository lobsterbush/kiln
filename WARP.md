# Kiln

**Status**: Active (Open Beta)

AI-resistant active learning platform for higher education classrooms.

**Authors**: Charles Crabtree (Monash University / Korea University)

## Tech Stack
- Frontend: React 19 + TypeScript + TailwindCSS + Vite → GitHub Pages
- Backend: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- AI: Anthropic Claude API (Sonnet for scenarios, Haiku for orchestration)
- PWA: vite-plugin-pwa with prompt-based service worker updates
- iOS: Capacitor 7 + @capacitor/push-notifications → App Store
- Android: Capacitor 7 → Google Play

## Key Commands
- `npm run dev` — local dev server
- `npm run build` — production build (code-split, ~485 KB core)
- `npm run lint` — ESLint (0 errors, 58 floating-promise warnings in existing code)
- `npm test` — Vitest unit + component tests (162 tests)
- `npm run test:e2e` — Playwright E2E tests (requires `npm run build` first)
- `deno test supabase/functions/**/*.test.ts --no-check` — edge function tests (52 tests)
- `npx tsc --noEmit` — type check
- `npm run build && npx cap sync ios` — build + sync to iOS project
- `npm run build && npx cap sync android` — build + sync to Android project
- `npx cap open ios` — open Xcode workspace
- `npx cap open android` — open Android Studio
- Push to `main` to deploy web via GitHub Actions

## Edge Functions (deployed)
- `generate-scenario-turn` — solo/multi-stakeholder scenario AI turns
- `generate-followup` — Socratic Chain personalised follow-up questions (full prior response chain passed for context)
- `demo-turn` — stateless demo scenario (no auth, no DB) for landing page conversion
- `generate-feedback` — per-student feedback generation
- `evaluate-scenario` — scenario performance evaluation
- `generate-debrief` — session debrief (themes, gaps, notable quotes)
- `send-welcome-email` — onboarding email via Resend API (triggered on signup)
- `lti-launch` — Canvas LTI 1.3 OIDC login + JWT launch handler (stores context in `lti_launches`)
- `lti-grade` — AGS grade passback (OAuth2 client_credentials → score post)
- AI functions use `_shared/anthropic.ts` retry helper; LTI functions use `_shared/lti.ts` (JWT, CORS)

## Architecture Notes
- Pages are code-split via `React.lazy()` (14 lazy chunks)
- `ErrorBoundary` wraps both `<Layout>` outlet and standalone `ProjectorView`
- Student auth uses participant tokens (localStorage), not Supabase Auth
- Realtime: broadcast channels for round events, postgres_changes for responses/participants
- Response dedup: `submit_response` RPC + UNIQUE constraint (migration 012)
- Peer assignment auto-recovery: 15s timeout falls back to DB query via RPC
- Auto-advance: `InstructorSession` automatically advances round 1.5s after all participants submit
- Peer assignment: done client-side in `InstructorSession` (`assignPeers`, `assignRebuttals`) — no edge function needed; inserts into `peer_assignments` and broadcasts `peer:assigned` realtime events
- Push notifications: register on instructor sign-in, store APNs token in `device_tokens` table
- Capacitor iOS: bundle ID `org.usekiln.app`, deployment target iOS 16.0
- Capacitor Android: same bundle ID `org.usekiln.app`
- Activity templates: 20 pre-built activities across 7 disciplines in `src/lib/templates.ts`
- Templates page: `/instructor/templates` — filterable grid, one-click to CreateActivity with pre-fill
- Demo mode: `/demo` — 4-turn Foreign Policy Crisis scenario, no auth needed, CTA to signup; canned FALLBACK_RESPONSES for turns 1–4 when edge function is unavailable
- Analytics: `/instructor/analytics` — sessions/week, word count trend, retention metric, summary cards, activity usage
- Plausible analytics: privacy-respecting tracking (session created, demo started, template used)
- Social proof: testimonial section on landing page (between How it Works and Activity Types)
- Onboarding email: welcome email with template link via Resend API
- Empty state: new instructors see Templates as primary CTA, not just "Create"
- Offline resilience: `src/lib/offline-queue.ts` — queues failed responses in localStorage, flushes on reconnect
- Accessibility (WCAG 2.1 AA): skip-to-main link, visible focus-visible indicators, aria-labels, role=status on live regions
- Canvas LTI 1.3: OIDC login → JWT launch → grade passback via edge functions; `src/lib/lti.ts` client types
- i18n: `src/lib/i18n-constants.ts` + `src/lib/i18n.tsx` — English, Korean (한국어), Japanese (日本語); language switcher in footer
- Usage limits: `src/lib/usage-limits.ts` — free tier (30 students/session, 50 sessions/semester); warning banners + session creation block
- Landing page: DemoPlayer carousel (`src/components/marketing/DemoPlayer.tsx`) showing all six activity types

## Migrations (all applied)
- 001–011: schema, RLS, indexes, RPC auth, activity types, scenarios, feedback
- 012: `UNIQUE(session_id, participant_id, round)` on responses
- 013: `device_tokens` table for APNs push notification tokens (pending deploy)
- 014: `lti_launches` table for Canvas LTI 1.3 context storage (pending deploy)

## Pending manual steps
- Deploy migrations 013–014: `supabase db push`
- Set LTI secrets: `supabase secrets set LTI_PLATFORM_ISSUER=... LTI_PLATFORM_JWKS_URL=... LTI_CLIENT_ID=... LTI_OIDC_AUTH_URL=... LTI_PLATFORM_TOKEN_URL=... LTI_CLIENT_SECRET=... KILN_BASE_URL=https://usekiln.org`
- Set RESEND_API_KEY secret: `supabase secrets set RESEND_API_KEY=re_xxxxx`
- Set up Supabase Database Webhook: auth.users INSERT → send-welcome-email
- Set up Plausible account: sign up at plausible.io, verify `usekiln.org` domain
- Set up Cloudflare Email Routing: `feedback@usekiln.org` → `charles.crabtree@monash.edu`
- Set up Cloudflare Email Routing: `welcome@usekiln.org` for Resend sending domain
- Replace placeholder testimonial quotes with real ones from pilot instructors
- Xcode: select signing team, enable Push Notifications capability
- Apple Developer: create APNs key (Keys → + → Apple Push Notifications service)
- App Store Connect: create app listing with screenshots, description, privacy URL
- Archive + submit: Xcode → Product → Archive → Distribute App
