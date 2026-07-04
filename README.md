# Wander

> A GenAI travel companion that turns any destination into an immersive
> first-person cultural journey — 4–6 story-driven stops with hidden gems,
> heritage notes, and authentic local experiences, all reshaped by the
> narrator you pick.

Built for the **PromptWars** hackathon (Google Antigravity, in-person,
individual entry, 2–3 hour build window). Challenge track: **Destination
Discovery & Cultural Experiences**.

## The challenge, and how Wander answers it

The brief asks for a GenAI platform that helps travelers discover
destinations and engage with local culture in meaningful ways — using AI to
**recommend attractions, uncover hidden gems, generate immersive storytelling,
promote heritage, suggest local events, and connect visitors with authentic
cultural experiences.**

Wander delivers all six in one interaction:

| Challenge requirement | Where it lives in Wander |
|---|---|
| **Recommend attractions** | Every generated journey has 4–6 curated stops for the destination. |
| **Uncover hidden gems** | Each stop has a `hidden_gem_score` (1–5). The system prompt biases the model away from top-10 tourist lists. |
| **Immersive storytelling** | Every stop includes a first-person, sensory narrative (~40 words). Tapping a card fetches a deeper ~120-word extension. |
| **Promote heritage** | Every stop includes a dedicated `heritage_note`. The deepen step returns a longer heritage/cultural-context paragraph. |
| **Suggest local events** | Every stop carries a `nearby_experience` — a local event, market, ritual, workshop, or authentic gathering nearby. |
| **Authentic cultural experiences** | Four narrator personas (Heritage / Food / Arts / Spiritual) reshape the entire journey's voice. The `spiritual` persona centers thresholds and dawn; the `food` persona centers markets and family stalls. Same city, four souls. |

## The elegance hook

One JSON schema. One destination. Four narrator personas. Vibes are
**system-prompt persona swaps** composed at call time — not code branches,
not separate endpoints, not different schemas. Adding a fifth vibe is three
lines of code.

The entire LLM layer fits in three files, ~130 lines combined:

```
src/lib/types.ts        types & vibe guard
src/lib/schemas.ts      OpenAI strict json_schema definitions
src/lib/prompts.ts      base prompt + 4 personas + deepen prompt
```

## Live app

- **Production:** _fills in after Vercel deploy_
- **Repo:** https://github.com/kartik-batta/wander

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | One deploy target, no separate backend |
| Language | TypeScript, `strict: true` | Structured output benefits from typed contracts |
| Styling | Tailwind CSS, custom "Wander" palette | Fastest path to a cohesive editorial UI |
| Fonts | Fraunces (serif) + Inter (sans), via `next/font/google` | Editorial voice for narrative; clean sans for chrome |
| AI | OpenAI **`gpt-4o`** for journey generation; **`gpt-4o-mini`** for deepen | Cost/latency shaping — the deepen task is narrower |
| API surface | Chat Completions with `response_format: json_schema, strict: true` | Every model response is a validated, typed object |
| Deploy | Vercel via GitHub Actions | PRs get preview URLs; `main` deploys to production |
| Tests | Vitest + Testing Library | Fast, TS-native, jsdom-based component testing |

## What's actually deployed

- Home form: destination input + 4 "vibe" chips (radiogroup) + Generate button
- `POST /api/journey` → 4–6 story cards
- Card tap → `POST /api/deepen` → deeper narrative + heritage; result cached client-side
- Regenerate with any vibe from the bottom of the journey
- Error toast (`role="alert"`, `aria-live="assertive"`), loading region (`role="status"`)
- Full keyboard navigation with a skip-to-main-content link
- WCAG AA color contrast across every text/background pair

## Local development

Requirements: Node 20+, an `OPENAI_API_KEY`.

```bash
git clone https://github.com/kartik-batta/wander.git
cd wander
npm install
echo "OPENAI_API_KEY=sk-..." > .env.local
npm run dev
# open http://localhost:3000
```

## Scripts

```bash
npm run dev            # Next.js dev server on :3000
npm run build          # Production build
npm run start          # Serve the production build locally
npm run typecheck      # tsc --noEmit
npm test               # Full Vitest suite (45 tests)
npm run test:coverage  # v8 coverage report
npm run lint           # ESLint (next/core-web-vitals)
```

## Deployment

- Push to `main` → production deploy on Vercel via GitHub Actions.
- Open a PR → preview deploy, URL commented back on the PR.
- Required GitHub Actions secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Required Vercel env: `OPENAI_API_KEY` (Production + Preview).

## Repository layout

```
├── CLAUDE.md                Claude Code project instructions (loaded every session)
├── AGENTS.md                Cross-tool agent instructions
├── docs/                    Foundation docs (PRD, APP_FLOW, TECH_STACK, ...)
├── src/
│   ├── app/
│   │   ├── page.tsx         Home + Journey view + StopCard
│   │   ├── layout.tsx       Root layout + Google fonts
│   │   ├── globals.css      Tailwind entry
│   │   └── api/
│   │       ├── journey/     POST → generate journey (gpt-4o)
│   │       └── deepen/      POST → expand one stop (gpt-4o-mini)
│   └── lib/
│       ├── types.ts         Vibe, Journey, JourneyStop, isVibe guard
│       ├── schemas.ts       Strict json_schema definitions
│       ├── prompts.ts       Base prompt + 4 personas + deepen prompt
│       └── validation.ts    Request-body validators for both API routes
├── tests/
│   ├── unit/                types · schemas · prompts · validation
│   └── component/           Home page render + interaction
├── .claude/                 Subagents + skills
├── .github/workflows/       Vercel deploy pipeline
├── next.config.mjs          Strict CSP + security headers
├── tailwind.config.ts       Wander palette (WCAG AA verified)
└── vitest.config.ts         Test runner config
```

## License

Hackathon submission. All rights reserved by the author.
