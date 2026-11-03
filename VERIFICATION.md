# Verification log

How the five library guides were checked, what changed, and what is still unverified.
Anything marked **TODO(human)** can only be filled in by a person doing the real setup. No test results here are invented.

## How the library was produced

The five guides were written before the live agent had keys configured, so they were **researched by hand from the providers' official docs** on 2026-11-03. The research was done by the coding assistant that built the app, reading each page listed under "Sources".
Every non-`uncertain` claim cites at least one of those pages. `pnpm validate:library` enforces this: it runs the same deterministic verifier the agent output goes through, and a library guide must pass with **zero** downgrades.

What this does **not** cover yet:

1. A hands-on setup by a person, which would turn claims into `tested`.
2. A full comparison of the live agent's output against these guides. A first live run on an app outside the library (Calendly, 2026-11-04) took about 80 s: 3 searches, 5 page reads, 1 console probe, 26 claims (24 documented, 2 uncertain), 0 verifier downgrades. Its claims have not been checked by hand yet.

Both have TODO(human) slots below.

## Aggregate (2026-11-03)

| | Claims | Documented | Uncertain | Tested | Sources |
|---|---:|---:|---:|---:|---:|
| GitHub | 28 | 26 | 2 | 0 | 4 |
| Notion | 20 | 19 | 1 | 0 | 3 |
| Slack | 19 | 17 | 2 | 0 | 3 |
| Google (Gmail) | 30 | 29 | 1 | 0 | 6 |
| LinkedIn | 22 | 20 | 2 | 0 | 2 |
| **Total** | **119** | **111** | **8** | **0** | **18** |

- Every "uncertain" claim is listed in that guide's "What we couldn't confirm" section.
- Most uncertain claims are hands-on setup times, which no provider documents.
- TODO(human): after the hands-on checks, update this to read: of N claims checked, X confirmed, Y corrected, Z unverifiable.

## Where the docs differed from the brief's expectations

The project brief described each app in one line. The docs we read refined those descriptions as follows:

| Guide | Brief's expectation | What the docs say | Effect on the guide |
|---|---|---|---|
| Slack | "Marketplace/public distribution review" | Unlisted public distribution needs **no** review. Only Marketplace listing is reviewed. | `approvalWait.required = for_public_use`, with a note explaining the split |
| Slack | (not mentioned) | Since 2025-05-29, new unlisted commercial apps get **1 req/min** on `conversations.history` and `conversations.replies` | Added a nuance and a high-severity blocker. This matters a lot for agents that read messages. |
| Notion | "Public integration needs extra fields" | The docs we read list only name, workspace, redirect URIs, installation scope and capabilities. Listing fields are managed separately. | Field list kept to what's documented. TODO(human): confirm the real form. |
| LinkedIn | "Many products require partner approval" | Confirmed: only 3 permissions are self-serve, and Compliance is closed | Rated `gated` |
| Gmail | "Hard: verification, sensitive/restricted scopes, possible security assessment" | Confirmed. All Gmail read scopes are restricted, and the assessment is annual. | Rated `hard`, with a 3–42 day approval range citing the FAQ |

Other issues found during review:

- **LinkedIn Page requirement.** Believed to be required, but not stated in the docs we read, so it's kept as `uncertain` with a TODO(human) instead of `documented`.
- **Display bug.** Durations rendered as "30–2 h" and "<1–6 wk". Fixed in `lib/format.ts`, with tests.

## Spot-check against the live docs (2026-11-04)

After the library was written, I re-fetched the provider pages and checked a sample of the specific, numeric claims against what the pages say today. This was a docs re-check, **not** a hands-on setup: nothing here is marked `tested`.

| Guide | Claim | Result |
|---|---|---|
| GitHub | Up to 10 callback URLs | Confirmed ("up to 10 callback URLs") |
| GitHub | 100 OAuth apps per user or org | Confirmed |
| GitHub | PKCE supports S256 only | Confirmed (`plain` is not supported) |
| GitHub | Expiring tokens: access 8 h, refresh 6 months | Confirmed. The docs say "six months **without use**", which is slightly more precise than the guide |
| GitHub | 10 tokens per user, app and scope | Confirmed |
| GitHub | No review step for OAuth apps | Consistent: the page describes none. This is an absence, so it is not proof |
| GitHub | Authorization code lifetime | **Gap:** docs say 10 minutes; the guide doesn't mention it |
| Slack | 1 request/min and max 15 objects on `conversations.history` and `.replies` for unlisted commercial apps | Confirmed |
| Slack | Which apps are hit | **Corrected.** The guide said "new apps". The changelog says new apps **and new installations of existing apps**, and that existing installations are not affected. Fixed in `slack.json` |
| Gmail | Unverified apps with sensitive or restricted scopes capped at 100 new users | Confirmed |
| Gmail | The cap is lifetime and can't be reset | Confirmed in the FAQ ("entire lifetime of the project... cannot be reset or changed"). The Unverified Apps page alone only says "in total", so this relies on the FAQ |
| Gmail | Testing status: refresh tokens expire after 7 days, except for name, email and profile only | Confirmed on the OAuth overview page. The other cited page (Unverified apps) does **not** mention it, so only one of the two citations backs this claim |
| Gmail | Verification estimates | Confirmed as estimates: brand 2-3 business days, sensitive 10 business days, restricted 6 weeks. Google says they are not guaranteed |
| LinkedIn | Only `profile`, `email`, `w_member_social` are self-serve | Confirmed |
| LinkedIn | Marketing, Sales Navigator and Talent need approval; Compliance is closed | Confirmed |
| LinkedIn | Access tokens last 60 days | Confirmed ("all access tokens are issued with a 60-day lifespan") |
| LinkedIn | Authorization code lasts 30 minutes | Confirmed |
| LinkedIn | Programmatic refresh only for some partners | Confirmed |
| LinkedIn | Members accept all scopes or none | Confirmed |
| LinkedIn | A LinkedIn Page is required to create an app | **Still unverifiable.** Neither page says so. It stays `uncertain` |

**Totals:** 19 claims checked. 16 confirmed as written, 1 corrected (Slack), 1 gap found (GitHub code lifetime), 1 unverifiable (LinkedIn Page).

**What I learned:** the numbers held up well. The errors were in *scope and wording* (who a limit applies to, which page backs which claim), not in the numbers. I also noticed LinkedIn's own flow page shows an example with the deprecated `liteprofile` scope next to a table that lists `profile` as the open permission, so the docs disagree with themselves. Providers' docs are not always consistent, which is why the guides label evidence and don't just assert.

## Per-guide checks

### GitHub (`data/guides/github.json`)
- **Sources:**
  - [Creating an OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
  - [Authorizing OAuth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
  - [Scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)
  - [OAuth app access restrictions](https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions)
- **Confirmed from docs:**
  - No GitHub review step.
  - Up to 10 callback URLs and 100 apps per owner.
  - PKCE supports S256 only.
  - Expiring tokens last 8 h and refresh tokens 6 months.
  - Limit of 10 tokens per user, app and scope.
  - Org access restrictions are on by default for new orgs.
- **Unverified:** the active setup time, and the client-secret UI.
- TODO(human): create a real OAuth App. Record the date, minutes taken, and any form fields that differ from the guide. Then set `evidence: "tested"` and `lastVerifiedAt` on the claims you confirmed.

### Notion (`data/guides/notion.json`)
- **Sources:**
  - [Authorization](https://developers.notion.com/docs/authorization)
  - [Getting started](https://developers.notion.com/docs/getting-started)
  - [Public integrations overview](https://developers.notion.com/guides/connections-and-tokens/public-integrations/overview)
- **Confirmed from docs:**
  - The portal path to create a connection.
  - The installation scope can't be changed after creation.
  - Users pick pages in a page picker, and each user authorizes separately.
  - Refreshing returns a new token pair.
  - Marketplace listing requires a security review.
- **Unverified:**
  - Whether creating a public connection needs the workspace-owner role.
  - The access-token lifetime.
  - The active setup time.
- TODO(human): create a public connection. Record the fields the form actually requires (company name? privacy URL?), the minutes taken, and the date.

### Slack (`data/guides/slack.json`)
- **Sources:**
  - [Installing with OAuth](https://docs.slack.dev/authentication/installing-with-oauth)
  - [Distribution](https://docs.slack.dev/app-management/distribution)
  - [Rate-limit changelog](https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps)
- **Confirmed from docs:**
  - HTTPS redirect URLs with no `#`.
  - Tokens don't expire unless rotation is enabled.
  - Installing in another workspace without distribution fails with `invalid_team_for_non_distributed_app`.
  - Marketplace listing is reviewed.
  - The 1 req/min limit for unlisted commercial apps.
- **Unverified:**
  - The Marketplace review timeline, which isn't published.
  - Whether localhost redirects work.
  - The active setup time.
- TODO(human): create an app, install it in a second workspace, and record whether a localhost redirect is accepted.

### Google (Gmail) (`data/guides/gmail.json`)
- **Sources:**
  - [OAuth 2.0 overview](https://developers.google.com/identity/protocols/oauth2)
  - [Verification](https://support.google.com/cloud/answer/13463073)
  - [Requirements](https://support.google.com/cloud/answer/13464321)
  - [FAQ](https://support.google.com/cloud/answer/13463817)
  - [Unverified apps](https://support.google.com/cloud/answer/7454865)
  - [Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)
- **Confirmed from docs:**
  - The Gmail scope tiers.
  - Restricted scopes need an annual security assessment.
  - Testing-status refresh tokens last 7 days.
  - A lifetime cap of 100 new users for unverified apps.
  - 100 refresh tokens per account per client.
  - Verification timelines as estimates.
  - Domains must be verified in Search Console.
- **Unverified:**
  - The test-user limit in Testing status.
  - Security assessment duration and cost, which depend on the assessor.
  - The active setup time.
- TODO(human): set up a Testing-mode client with `gmail.readonly`. Record the time taken, the test-user limit shown in the console, and the consent screens.

### LinkedIn (`data/guides/linkedin.json`)
- **Sources:**
  - [Getting access](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access)
  - [3-legged OAuth flow](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- **Confirmed from docs:**
  - Only `profile`, `email` and `w_member_social` are self-serve.
  - Marketing, Sales Navigator and Talent need approval.
  - Compliance access is closed.
  - Access tokens last 60 days.
  - Programmatic refresh is only for some partners.
  - Members must accept all scopes or none.
  - Authorization codes expire in 30 minutes.
- **Unverified:**
  - Whether a LinkedIn Page is required.
  - Partner-approval timelines and criteria.
  - The active setup time.
- TODO(human): create an app. Record whether a Page is required and the minutes taken. If you apply for any partner product, record the date and the outcome.

## Live agent runs

Library slugs always return the reviewed library guide, so the agent can't be run against those apps and compared directly. Instead I ran it on apps outside the library:

| App | Date | Time | Notes |
|---|---|---|---|
| Zoom | 2026-11-03 | 62 s | 14 findings, console probed, 25 of 28 claims documented |
| Calendly | 2026-11-04 | about 80 s | 3 searches, 5 page reads, 1 console probe; 26 claims (24 documented, 2 uncertain); 0 verifier downgrades |

The verifier found nothing to downgrade on the Calendly run. That means every claim had a citation, not that every claim is true. I have not checked the Calendly or Zoom claims against the docs by hand.

TODO(human), still open:
1. Do one real setup, for example a GitHub OAuth App, and record the date, the minutes taken and any form fields that differ from the guide. Then mark the confirmed claims `tested`.
2. Hand-check a sample of an agent-generated guide (Calendly) the way I checked the library above.
