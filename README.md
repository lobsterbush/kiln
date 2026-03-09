# Kiln — The Socratic Method, Scaled

Kiln is a real-time active learning platform for higher education classrooms. In 60 seconds you can have every student writing, arguing, and defending their thinking — while you watch it happen live.

**Author**: Charles Crabtree, Senior Lecturer, School of Social Sciences, Monash University and K-Club Professor, University College, Korea University.

---

## How it works

### Socratic Chain (AI-powered)

1. You post an opening question and optional learning objectives.
2. Every student writes a response simultaneously in a timed round.
3. Claude reads each student's specific argument and generates a **personalized follow-up** targeting the weakest point in *their* reasoning.
4. Students must answer *their own* follow-up — no two students get the same question.
5. You watch comprehension unfold in real time on the live monitor.

No lectures interrupted. No hands raised. Every student pushed, individually.

### Peer Critique

1. Students write a position in response to your prompt.
2. Kiln anonymously pairs each student with a peer's argument.
3. Students critique the argument they received.
4. Students defend their own original claim against the critique they received.

Three rounds of structured argumentation, zero administrative overhead.

---

## Quick start

### Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) project (free tier works)
- [Anthropic API key](https://console.anthropic.com) (for Socratic Chain follow-ups)

### Local development

```bash
git clone https://github.com/YOUR_USERNAME/kiln.git
cd kiln
npm install
cp .env.example .env   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

### Supabase setup

1. Run the migration against your project:
   - Open the SQL Editor in your Supabase dashboard
   - Paste and run `supabase/migrations/001_initial_schema.sql`

2. Deploy the edge function and set the API key:
   ```bash
   supabase functions deploy generate-followup
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```

3. (Optional) Enable Google OAuth in your Supabase Auth settings for Google sign-in.

### GitHub Pages deployment

Push to `main`. GitHub Actions builds and deploys automatically.

Add these secrets to your GitHub repo settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Project structure

```
src/
  pages/          # Route-level page components
  components/     # Shared UI components
  lib/            # Supabase client, auth context, utilities
supabase/
  functions/      # Edge functions (generate-followup)
  migrations/     # Database schema
```

---

## Key commands

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

---

## Tech stack

- **Frontend**: React 19 + TypeScript + TailwindCSS + Vite
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **AI**: Anthropic Claude API (Socratic Chain follow-up generation)
- **Hosting**: GitHub Pages (static SPA)

---

We will make all data and code used to generate our results available at a figshare repository at the time of publication.

## License

MIT
