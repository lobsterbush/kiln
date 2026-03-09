# Kiln — Where Thinking Hardens

Real-time classroom activities designed so AI can't help. Kiln replaces detection-based academic integrity approaches with **structurally AI-resistant pedagogy**: timed peer critique rounds, adaptive Socratic chains, and live annotation exercises where the activity design itself makes AI use infeasible.

## Authors

Charles Crabtree, Senior Lecturer, School of Social Sciences, Monash University and K-Club Professor, University College, Korea University.

## Overview

The academic integrity crisis isn't solvable by detection — 94% of AI-generated work goes undetected, and AI detectors produce a 61% false positive rate for non-native English speakers. Kiln takes a different approach: instead of catching AI use after the fact, it designs activities where AI **can't help** in the first place.

### How it works

1. **Instructor creates an activity** (Peer Critique or Socratic Chain)
2. **Students join via a 6-character code** — no signup required
3. **Timed rounds** (30–90 seconds) keep responses sharp and genuine
4. **Peer-dependent chains** mean each student's work depends on a classmate's specific argument
5. **AI-powered follow-ups** (instructor side only) probe the weakest point in each student's reasoning

### Activity Types

- **Peer Critique**: Claim → Critique → Rebuttal in timed rounds with rotating partners
- **Socratic Chain**: AI generates personalized follow-up questions that probe each student's reasoning

## Requirements

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- An [Anthropic API key](https://console.anthropic.com) (for Socratic Chain activities)

## Setup

1. Clone and install:
   ```bash
   git clone https://github.com/YOUR_USERNAME/kiln.git
   cd kiln
   npm install
   ```

2. Create a Supabase project at [supabase.com](https://supabase.com) and run the migration:
   - Go to SQL Editor in the Supabase dashboard
   - Paste and run `supabase/migrations/001_initial_schema.sql`

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase URL and anon key
   ```

4. For Socratic Chain activities, deploy the Edge Function:
   ```bash
   supabase functions deploy generate-followup
   supabase secrets set ANTHROPIC_API_KEY=your-key
   ```

5. Run locally:
   ```bash
   npm run dev
   ```

## Deployment

Kiln deploys to GitHub Pages via GitHub Actions. Push to `main` to trigger a deploy.

Add these secrets to your GitHub repo settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Stack

- **Frontend**: React 19 + TypeScript + TailwindCSS + Vite
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **AI**: Anthropic Claude API (Socratic Chain follow-ups)
- **Hosting**: GitHub Pages (static SPA)

## Replication

We will make all data and code used to generate our results available at a figshare repository at the time of publication.

## License

MIT
