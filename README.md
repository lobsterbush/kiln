# Kiln — AI-Resilient Active Learning for Higher Education

Kiln is a real-time active learning platform for university classrooms. Students join with a 6-character code — no accounts, no downloads — and participate in timed, peer-dependent activities that resist AI shortcuts by design.

**Author**: Charles Crabtree, Senior Lecturer, School of Social Sciences, Monash University and K-Club Professor, University College, Korea University.

---

## Six activity types

| Type | How it works |
|---|---|
| **Peer Critique** | Claim → Critique → Rebuttal in timed rounds. Each round depends on a peer's work that didn't exist until the session started. |
| **Socratic Chain** | AI reads each student's response and generates a personalised follow-up targeting the weakest point in *their* reasoning. |
| **Peer Clarification** | Students name what confuses them, then explain a classmate's specific confusion in plain language. |
| **Evidence Analysis** | Evidence is revealed live. Students interpret it cold, then identify the inferential gap in a peer's reading. |
| **Scenario Solo** | Each student negotiates with a single AI persona in a branching conversation. |
| **Scenario Multi** | Each student faces a cast of AI personas — an orchestrator routes each turn to the most relevant stakeholder. |

---

## Quick start

### Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) project (free tier works)
- [Anthropic API key](https://console.anthropic.com) (for AI-powered features)

### Local development

```bash
git clone https://github.com/lobsterbush/kiln.git
cd kiln
npm install
cp .env.example .env   # fill in your Supabase and Anthropic credentials
npm run dev
```

### Environment variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-...   # used by edge functions, not the frontend
```

### Supabase setup

1. Link your project: `supabase link --project-ref <your-project-ref>`
2. Apply all migrations: `supabase db push`
3. Deploy edge functions:
   ```bash
   supabase functions deploy generate-followup
   supabase functions deploy generate-scenario-turn
   supabase functions deploy generate-feedback
   supabase functions deploy generate-debrief
   supabase functions deploy evaluate-scenario
   supabase functions deploy demo-turn
   supabase functions deploy send-welcome-email
   supabase functions deploy notify-feedback
   supabase functions deploy lti-launch
   supabase functions deploy lti-grade
   ```
4. Set the Anthropic key: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
5. (Optional) Enable Google/Microsoft OAuth in Supabase Auth settings.

### Deployment

Push to `main` to deploy via GitHub Actions (GitHub Pages).

GitHub repo secrets required:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Key commands

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build (TypeScript + Vite) |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit + component tests (266 tests) |
| `npm run test:coverage` | Tests with V8 coverage report |
| `npm run typecheck` | TypeScript type check |
| `deno test supabase/functions/**/*.test.ts --no-check` | Edge function tests (107 tests) |

---

## Project structure

```
src/
  pages/              Route-level page components (lazy-loaded)
  components/
    shared/            Reusable UI (Timer, SessionLobby, ErrorBoundary, etc.)
    student/           Student-facing views (ResponsePanel, ScenarioChat, etc.)
    instructor/        Instructor monitors (LiveMonitor, ScenarioMonitor)
    marketing/         Landing page components (DemoPlayer)
  lib/                 Supabase client, auth, i18n, utilities, types
  locales/             Translation files (en, ko, ja)
  test/                Test setup
supabase/
  functions/           Edge functions (AI generation, LTI, email)
    _shared/           Shared helpers (Anthropic retry, LTI JWT)
  migrations/          Database schema (001–016)
```

---

## Tech stack

- **Frontend**: React 19 + TypeScript + TailwindCSS 4 + Vite 7
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **AI**: Anthropic Claude API (Sonnet for generation, Haiku for orchestration)
- **PWA**: vite-plugin-pwa with prompt-based service worker updates
- **iOS/Android**: Capacitor 8
- **Hosting**: GitHub Pages (static SPA)
- **Analytics**: Plausible (privacy-respecting)
- **i18n**: English, Korean (한국어), Japanese (日本語)

---

## Testing

- **266 Vitest tests** across 29 test files (components, pages, lib)
- **107 Deno tests** across 10 test files (edge functions)
- 0 ESLint errors/warnings
- 0 TypeScript errors

---

We will make all data and code used to generate our results available at a figshare repository at the time of publication.

## License

MIT
