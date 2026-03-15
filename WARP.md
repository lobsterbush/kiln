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

## Pending manual steps
- Apply `supabase/migrations/010_feedback.sql` in Supabase Studio
- Set up Cloudflare Email Routing: `feedback@usekiln.org` → `charles.crabtree@monash.edu`
- Install Capacitor for iOS App Store: `npm install @capacitor/core @capacitor/cli @capacitor/ios && npx cap init && npx cap add ios`
