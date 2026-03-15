# Kiln

**Status**: Active (Open Beta)

AI-resistant active learning platform for higher education classrooms.

**Authors**: Charles Crabtree (Monash University / Korea University)

## Tech Stack
- Frontend: React 19 + TypeScript + TailwindCSS + Vite → GitHub Pages
- Backend: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- AI: Anthropic Claude API for Socratic Chain follow-ups

## Key Commands
- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- Push to `main` to deploy via GitHub Actions

## Edge Functions (deployed)
- `generate-scenario-turn`
- `generate-followup`
- `generate-feedback`
- `evaluate-scenario`
- `generate-debrief`

## Pending manual steps
- Apply `supabase/migrations/010_feedback.sql` in Supabase Studio
- Set up Cloudflare Email Routing: `feedback@usekiln.org` → `charles.crabtree@monash.edu`
- Install Capacitor for iOS App Store: `npm install @capacitor/core @capacitor/cli @capacitor/ios && npx cap init && npx cap add ios`

## Recent fixes (pre-App Store audit)
- CORS headers added to all edge function `catch` blocks
- iOS meta tags, safe-area insets, input auto-zoom prevention
- `KILN_ORIGIN` constant for Capacitor-safe QR/join URLs
- Join code + QR display added to `ScenarioMonitor` lobby
- `ScenarioChat` restores chat history on page refresh from DB
- `EditActivity` hides rounds/duration fields for scenario activities
- Clipboard copy fallback for non-HTTPS contexts
