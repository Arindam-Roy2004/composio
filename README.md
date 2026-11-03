# OAuth Navigator

**Live:** https://composio-five-wheat.vercel.app · **Repo:** https://github.com/Arindam-Roy2004/composio

Look up an app, get a guide for creating its OAuth app and getting it approved, and know what to do next.

A developer building an AI agent that lets users connect an app often has to register an OAuth app with the provider first, and sometimes wait for approval. It's hard to tell up front whether that is an hour of clicking or weeks of review. OAuth Navigator answers that, per app:

- **How hard is it?** A difficulty rating (easy → gated, or *Not rated* when there are no sources).
- **How long?** Active setup time and approval wait, shown separately.
- **What could block me?** Scope tiers, verification, security assessments, rate limits, ownership of review.
- **Who does what?** What an agent can do for you, and where you have to take over.
- **How sure are we?** Every claim carries an evidence label.

## What's in it

- **Library:** five hand-researched guides chosen for different challenges: GitHub (easy, no review), Notion (public connection), Slack (distribution rules, rate limits), Gmail (restricted scopes, annual assessment), LinkedIn (mostly partner-gated).
- **Live generation:** type an app name or website on the home page. An agent researches it and streams a guide in real time. Works for apps outside the library; results are cached and shareable at `/guide/<slug>`.
- **Directory** (`/guides`): every guide, with server-side search, filters and paging.

## How the agent works

`POST /api/generate` (SSE) runs a bounded pipeline:

1. **Identify** the app and its official domain.
2. **Research loop** (LLM with tools): web search, page reads, and `note`. Budget: 10 tool calls, 6 page reads, 2 reserved for probes, 120 s deadline.
3. **Console probe:** fetches the provider's developer-console URL and records only what is publicly visible (login wall? visible fields?). It never signs in, submits forms or creates accounts.
4. **Structured synthesis** into a strict `GuideSchema`.
5. **Deterministic verify:** no LLM. Claims citing no source, or a page the agent took no notes from, are downgraded to `uncertain`. A guide with no sources is forced to *Not rated*.

Evidence labels: **Official docs**, **Seen by agent** (probed page), **Unofficial**, **Unconfirmed**. A `tested` label exists for claims a human confirmed hands-on; currently none are marked.

## Key decisions

- **Evidence over confidence.** The product's value is knowing what is verified. The verifier is deterministic code, not another model call, and library guides must pass it with zero downgrades (`pnpm validate:library`).
- **No logging in on the user's behalf.** Probing is read-only. Setup the agent can't safely do is listed under "You take over".
- **Library guides are fixed; generated guides are cached.** Library slugs are never regenerated, so reviewed content can't drift.
- **Honest not-found.** An app with no findable OAuth docs gets a "Not rated" guide, not an invented one.
- **Untrusted pages.** Fetched content is fenced from instructions, and every model-chosen URL goes through an SSRF guard.
- **Fast default model.** Synthesis timed out on slower models (116 s vs ~10 s), so the default is a fast OpenRouter model. Change it with `LLM_MODEL`.

## Setup

Requires Node 20+ and pnpm.

```bash
pnpm install
cp .env.example .env.local   # fill in values
pnpm dev                     # http://localhost:3000
```

| Variable | Purpose |
|---|---|
| `TAVILY_API_KEY` | web search |
| `CONTEXT_DEV_API_KEY` | page scraping / console probe |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | guide storage and rate limits |
| `LLM_PROVIDER` (`openrouter` or `anthropic`), `LLM_MODEL` | model |
| `OPENROUTER_API_KEY` or `ANTHROPIC_API_KEY` | model credentials |
| `IP_HASH_SALT` | optional, salts hashed IPs in rate-limit keys |
| `NEXT_PUBLIC_SITE_URL` | public URL, for share and OG links |

Without the keys, the library and directory still work; live generation returns a clear 503.

Scripts: `pnpm test` (unit), `pnpm test:e2e` (Playwright), `pnpm typecheck`, `pnpm lint`, `pnpm validate:library`.

## Deploying

Deploy to Vercel and set the variables above. A live run takes roughly 60–90 s; the route allows up to 300 s, so a plan that supports long functions is needed (lower `maxDuration` in `app/api/generate/route.ts` to 120 otherwise).

## Limitations

- **Nothing is hands-on tested yet.** I re-checked 19 claims against the live provider docs (16 confirmed, 1 corrected, 1 gap, 1 unverifiable), but I haven't completed a real provider setup myself.
- **Library guides** were researched from official docs only. Library guides were researched from official docs and cite them; no claim is marked `tested` yet. `VERIFICATION.md` lists what was checked and what remains open.
- **Setup times are mostly uncertain.** Providers don't publish them.
- **Approval timelines** (Slack Marketplace, LinkedIn partner products, Google security assessment) are estimates or unknown.
- **Generated guides are only as good as findable public docs** and can be wrong; the verifier checks citations, not truth.
- **Rate limits:** 20 fresh runs per IP per hour in production (50 in dev). Cached guides don't count.
- Five library guides, not 100.
