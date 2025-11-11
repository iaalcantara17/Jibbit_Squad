# Job Application Tracker

A comprehensive job application tracking system built with React, TypeScript, and Supabase.

## Quickstart

**Prerequisites**: Node 18+, npm, Supabase project

**Setup**:
```bash
# 1. Clone and install
git clone <repo-url>
cd <repo-dir>
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)
# Configure Edge function secrets in Supabase dashboard or via CLI

# 3. Run development server
npm run dev

# 4. Deploy edge functions (if using Supabase CLI)
supabase functions deploy email-poller
supabase functions deploy calendar-sync
supabase functions deploy resume-share-resolve
supabase functions deploy resume-share-comment
supabase functions deploy ai-company-news
supabase functions deploy ai-optimize-skills
supabase functions deploy ai-tailor-experience
# ... deploy other functions as needed
```

## Testing & Coverage

**Run tests**:
```bash
npm run test              # Run all tests
npm run test -- --coverage  # Run with coverage report
```

**Coverage gates** (enforced in CI):
- **Global**: ≥55% (lines, branches, functions, statements)
- **Sprint-2 components**: ≥90% lines/functions/statements, ≥85% branches
  - `src/components/jobs/**`
  - `src/components/analytics/**`
  - `src/components/automation/**`
  - `src/components/resumes/**`
  - `src/components/cover-letters/**`
  - `supabase/functions/**`

**Coverage reports**: `coverage/lcov.info`, `coverage/index.html`

## Security Model

**⚠️ IMPORTANT: If you cloned this repo before [DATE], rotate all secrets immediately. A `.env` file was briefly committed and has been removed.**

**Row-Level Security (RLS)**:
- All user data tables enforce `auth.uid() = user_id` policies
- No anonymous table reads on private data (profiles, jobs, resumes, email_tracking, etc.)
- Public access only via tokenized edge functions (e.g., resume sharing uses share_token validation)

**Secrets & API keys**:
- Edge functions access secrets via `Deno.env.get()` (stored in Supabase vault)
- Client code uses only publishable keys (`VITE_SUPABASE_PUBLISHABLE_KEY`)
- Never commit secrets to Git

## Documentation

- **Demo Script**: [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) - Step-by-step walkthrough of all features
- **Sprint Status**: [SPRINT2_FINAL_STATUS.md](./SPRINT2_FINAL_STATUS.md) - UC status table and coverage summary
- **Known Issues**: [Known_Issues_Backlog.md](./Known_Issues_Backlog.md) - Backlog and open issues

## Project Structure

```
src/
  components/       # React components
    jobs/          # Job tracking UI
    resumes/       # Resume builder
    cover-letters/ # Cover letter generator
    analytics/     # Analytics dashboards
    automation/    # Automation rules
  lib/             # Shared utilities
  pages/           # Route pages
  test/            # Test files
supabase/
  functions/       # Edge functions
  migrations/      # Database migrations
```

## Edge Function Failure Modes

- **Rate Limits**: 429 errors are normalized and surfaced to client; backoff logic recommended
- **Token Expiry**: OAuth tokens refresh automatically on 401; edge functions retry once
- **Network Failures**: All edge functions return `{ error: { code, message } }` on failure

## Cache & Rate-Limit Strategy

- **Company Research**: Cached in DB for 30 days; re-fetched on demand
- **Email Polling**: 14-day lookback window; dedupe by `provider_msg_id`
- **Calendar Sync**: Token refresh on 401; normalized error responses for 404/500

## License

MIT
