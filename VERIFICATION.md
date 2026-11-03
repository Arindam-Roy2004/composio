# Verification log

How the five library guides were checked, what changed, and what is still unverified.
No test results here are invented. **No hands-on provider setup was completed**, so no claim is marked `tested`; every non-`uncertain` claim is backed by a cited source. The two docs passes below closed the open questions that public documentation could answer and list the rest explicitly.

**Who did what:** the coding assistant built the app and ran the documentation checks and agent comparisons described here under my direction. I did not personally complete a provider setup. `documented` means an official provider page says it; it does not mean the flow was run.

## How the library was produced

The five guides were written before the live agent had keys configured, so they were **researched from the providers' official docs** on 2026-11-03. The research was done by the coding assistant that built the app, reading each page listed under "Sources".
Every non-`uncertain` claim cites at least one of those pages. `pnpm validate:library` enforces this: it runs the same deterministic verifier the agent output goes through, and a library guide must pass with **zero** downgrades.

What has been done since:

1. A spot-check of 19 claims against the live docs (2026-11-04).
2. A second docs pass over every remaining open question (2026-11-04), recorded below.
3. A comparison of the live agent with the library on all five apps.
4. A hand-check of one agent-only guide (Calendly), against the pages it cited.

What has **not** been done: a hands-on setup with a real provider account. Every claim is backed by official docs, not by completing the setup, so the `Tested` column stays at 0. A hands-on pass is the only thing that can move a claim to `tested`.

## Aggregate (updated 2026-11-04)

| | Claims | Documented | Uncertain | Tested | Sources |
|---|---:|---:|---:|---:|---:|
| GitHub | 29 | 28 | 1 | 0 | 5 |
| Notion | 20 | 19 | 1 | 0 | 4 |
| Slack | 21 | 19 | 2 | 0 | 4 |
| Google (Gmail) | 30 | 29 | 1 | 0 | 7 |
| LinkedIn | 22 | 21 | 1 | 0 | 3 |
| **Total** | **122** | **116** | **6** | **0** | **23** |

The library snapshot on 2026-11-03 was 119 claims, 111 documented, 8 uncertain and 18 sources. The two docs passes added 3 claims and 5 sources and moved 2 uncertain claims to documented. No claim moved to `tested`.

- Every "uncertain" claim is listed in that guide's "What we couldn't confirm" section.
- Five of the six uncertain claims are hands-on setup times, which no provider documents. The sixth is Slack's `chat:write` review status.
- Docs checks since: the first pass checked 19 claims (16 confirmed, 1 corrected, 1 gap, 1 unverifiable). The second pass closed 7 of the remaining questions and left 5 categories open.

## Where the docs differed from the brief's expectations

The project brief described each app in one line. The docs we read refined those descriptions as follows:

| Guide | Brief's expectation | What the docs say | Effect on the guide |
|---|---|---|---|
| Slack | "Marketplace/public distribution review" | Unlisted public distribution needs **no** review. Only Marketplace listing is reviewed. | `approvalWait.required = for_public_use`, with a note explaining the split |
| Slack | (not mentioned) | Since 2025-05-29, new unlisted commercial apps get **1 req/min** on `conversations.history` and `conversations.replies` | Added a nuance and a high-severity blocker. This matters a lot for agents that read messages. |
| Slack | (not mentioned) | Marketplace review is published: preliminary feedback up to **10 business days**, then functional review up to **10 weeks** for new submissions (6 weeks for updates) | Approval note corrected; a nuance now gives the timeline |
| Notion | "Public integration needs extra fields" | The public-connection docs list only connection name, development workspace, redirect URI(s), installation scope and capabilities. Listing fields are managed separately. | Field list kept to what's documented. The exact live form is not hands-on checked. |
| LinkedIn | "Many products require partner approval" | Confirmed: only 3 permissions are self-serve, Compliance is closed, and a default LinkedIn Page is required to create an app | Rated `gated`; the Page prerequisite is now `documented` |
| Gmail | "Hard: verification, sensitive/restricted scopes, possible security assessment" | Confirmed. All Gmail read scopes are restricted, and the assessment is annual. | Rated `hard`, with a 3–42 day approval range citing the FAQ |

Other issues found during review:

- **LinkedIn Page requirement.** Originally kept `uncertain` because the OAuth pages did not mention it. LinkedIn Help does: API products available to individual developers must have a default Page, and you must select it to proceed. The prerequisite is now `documented` with that source.
- **Display bug.** Durations rendered as "30–2 h" and "<1–6 wk". Fixed in `lib/format.ts`, with tests.

## First spot-check against the live docs (2026-11-04)

After the library was written, I re-fetched the provider pages and checked a sample of the specific, numeric claims against what the pages say today. This was a docs re-check, **not** a hands-on setup: nothing here is marked `tested`.

| Guide | Claim | Result |
|---|---|---|
| GitHub | Up to 10 callback URLs | Confirmed ("up to 10 callback URLs") |
| GitHub | 100 OAuth apps per user or org | Confirmed |
| GitHub | PKCE supports S256 only | Confirmed (`plain` is not supported) |
| GitHub | Expiring tokens: access 8 h, refresh 6 months | Confirmed. The docs say "six months **without use**", slightly more precise than the guide |
| GitHub | 10 tokens per user, app and scope | Confirmed |
| GitHub | No review step for OAuth apps | Consistent: the page describes none. This is an absence, so it is not proof |
| GitHub | Authorization code lifetime | **Gap (now filled).** Docs say 10 minutes; the guide did not mention it. Added as a nuance in the second pass |
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
| LinkedIn | A LinkedIn Page is required to create an app | **Resolved in the second pass.** LinkedIn Help says a default Page must be selected to proceed. It is now `documented` |

**Totals at the time of this first pass:** 19 claims checked. 16 confirmed as written, 1 corrected (Slack), 1 gap found (GitHub code lifetime), 1 unverifiable (LinkedIn Page). The gap and the unverifiable item were closed in the second pass below.

**What I learned:** the numbers held up well. The errors were in *scope and wording* (who a limit applies to, which page backs which claim), not in the numbers. I also noticed LinkedIn's own flow page shows an example with the deprecated `liteprofile` scope next to a table that lists `profile` as the open permission, so the docs disagree with themselves. Providers' docs are not always consistent, which is why the guides label evidence and don't just assert.

## Second docs pass: the remaining questions (2026-11-04)

The first pass left a handful of open questions. I re-fetched the provider's own page for each one and recorded what it says. This is still **documentation evidence, not hands-on testing**: a page saying "the form asks for X" is weaker than filling in the form yourself.

| Guide | Open question | What the official source says | Effect |
|---|---|---|---|
| GitHub | Authorization code lifetime | "The temporary code will expire after 10 minutes." ([Authorizing OAuth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)) | Added a nuance; gap closed |
| GitHub | Client-secret generation | The best-practices guide says client secrets are required, must be stored securely, and a new secret must be generated if the old one is compromised. ([Best practices](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/best-practices-for-creating-an-oauth-app)) | The step moved from `uncertain` to `documented`; the guide describes the action, not the exact button label |
| Notion | Public-connection form fields | The public-integrations guide lists connection name, development workspace, redirect URI(s), installation scope and capabilities. Listing details are separate. ([Public integrations](https://developers.notion.com/guides/connections-and-tokens/public-integrations/overview)) | Field list confirmed from docs; the exact live form is still not hands-on checked |
| Notion | Workspace-owner role for a public connection | The internal-connection docs require a Workspace Owner. The public-connection guide lists the form fields but does not state a role requirement. ([Authorization](https://developers.notion.com/guides/authorization/overview)) | Remains unknown for public connections |
| Notion | Access-token lifetime | The authorization guide and token reference return an access token and a rotating refresh token, but publish no lifetime. ([Create a token](https://developers.notion.com/reference/create-a-token)) | Remains unknown; the guide says to persist both tokens |
| Slack | Marketplace review timeline | Preliminary feedback takes up to 10 business days; functional review takes up to 10 weeks for new submissions and 6 weeks for updates. ([Review process](https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide)) | Corrected the "no timeline published" note; approval range now 2–12 weeks |
| Slack | localhost redirect URLs | Redirect URLs must use HTTPS. The docs' GOOD/BAD examples show every plain `http://` URL as BAD. ([Installing with OAuth](https://docs.slack.dev/authentication/installing-with-oauth)) | Added a nuance: use a TLS tunnel; no localhost exception is documented |
| Gmail | Test-user limit in Testing status | Testing is limited to up to 100 test users listed on the OAuth consent screen; their authorizations expire after 7 days. ([Manage App Audience](https://support.google.com/cloud/answer/15549945)) | Filled the unknown; added to the Testing step and nuance |
| Gmail | Security-assessment duration and cost | The assessment is annual. Google charges nothing; cost is agreed with the CASA assessor. Google publishes no duration. ([FAQ](https://support.google.com/cloud/answer/13463817)) | Remains unknown, but the cost model is now stated |
| LinkedIn | Is a LinkedIn Page required? | "API Products available to individual developers must have a default page associated with them and you must select that default page to proceed with the app creation process." ([Associate an app with a LinkedIn Page](https://www.linkedin.com/help/linkedin/answer/a548360)) | Prerequisite changed from `uncertain` to `documented` |
| LinkedIn | Partner-approval timelines and criteria | Most permissions and partner programmes need explicit approval; no timeline or acceptance criteria are published. ([Getting access](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access)) | Remains unknown; the guide says approval isn't guaranteed |
| All five | Active setup time | No provider publishes how long the setup takes. | Stays an estimate and is labelled `uncertain` |

**Closed with official docs (7):** GitHub code lifetime, GitHub client-secret generation, Notion public-connection form fields, Slack Marketplace review timeline, Slack localhost redirects, Gmail test-user limit, LinkedIn Page requirement.

**Still open (5):** Notion's owner role for public connections, Notion's access-token lifetime, Gmail's assessment duration/cost, LinkedIn's partner timelines/criteria, and every active setup time.

## Per-guide checks

### GitHub (`data/guides/github.json`)
- **Sources:**
  - [Creating an OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
  - [Authorizing OAuth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
  - [Scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)
  - [OAuth app access restrictions](https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions)
  - [Best practices for creating an OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/best-practices-for-creating-an-oauth-app)
- **Confirmed from docs:**
  - No GitHub review step.
  - Up to 10 callback URLs and 100 apps per owner.
  - PKCE supports S256 only.
  - Expiring tokens last 8 h and refresh tokens 6 months without use.
  - Limit of 10 tokens per user, app and scope.
  - Org access restrictions are on by default for new orgs.
  - Authorization codes expire after 10 minutes.
  - A client secret is required for the token exchange and can be regenerated if compromised.
- **Unverified:** the active setup time, and the exact wording of the client-secret button in the current UI.
- **Hands-on status:** a real OAuth App was **not** created. A person would register one at `github.com/settings/developers` (about 10 minutes), record the date and any fields that differ, then set `evidence: "tested"` and `lastVerifiedAt` on the claims confirmed.

### Notion (`data/guides/notion.json`)
- **Sources:**
  - [Authorization](https://developers.notion.com/docs/authorization)
  - [Getting started](https://developers.notion.com/docs/getting-started)
  - [Public integrations overview](https://developers.notion.com/guides/connections-and-tokens/public-integrations/overview)
  - [Marketplace listing](https://developers.notion.com/guides/connections-and-tokens/public-integrations/marketplace-listing)
- **Confirmed from docs:**
  - The portal path to create a connection.
  - The required fields: connection name, development workspace, redirect URI(s), installation scope and capabilities.
  - The installation scope can't be changed after creation.
  - Users pick pages in a page picker, and each user authorizes separately.
  - Refreshing returns a new token pair.
  - Marketplace listing requires a security review and says to expect an email within 5–10 business days.
- **Unverified:**
  - Whether creating a public connection needs the workspace-owner role (documented for internal connections, not stated for public ones).
  - The access-token lifetime.
  - The exact live form and the active setup time.
- **Hands-on status:** a public connection was **not** created. A person would create one in the developer portal, record the fields the form actually requires, the minutes taken and the date, then mark the confirmed claims `tested`.

### Slack (`data/guides/slack.json`)
- **Sources:**
  - [Installing with OAuth](https://docs.slack.dev/authentication/installing-with-oauth)
  - [Distribution](https://docs.slack.dev/app-management/distribution)
  - [Rate-limit changelog](https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps)
  - [Marketplace review process](https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide)
- **Confirmed from docs:**
  - HTTPS redirect URLs with no `#`; plain `http://` URLs are shown as invalid.
  - Tokens don't expire unless rotation is enabled.
  - Installing in another workspace without distribution fails with `invalid_team_for_non_distributed_app`.
  - Marketplace listing is reviewed; preliminary feedback takes up to 10 business days and functional review up to 10 weeks (6 weeks for updates).
  - The 1 req/min limit for unlisted commercial apps.
- **Unverified:**
  - How long a specific review will actually take (the published figures are upper bounds).
  - The active setup time.
- **Hands-on status:** an app was **not** created or installed in a second workspace. A person would create one, install it in a second workspace, and record whether an HTTPS tunnel is needed for the local redirect.

### Google (Gmail) (`data/guides/gmail.json`)
- **Sources:**
  - [OAuth 2.0 overview](https://developers.google.com/identity/protocols/oauth2)
  - [Verification](https://support.google.com/cloud/answer/13463073)
  - [Requirements](https://support.google.com/cloud/answer/13464321)
  - [FAQ](https://support.google.com/cloud/answer/13463817)
  - [Unverified apps](https://support.google.com/cloud/answer/7454865)
  - [Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)
  - [Manage App Audience](https://support.google.com/cloud/answer/15549945)
- **Confirmed from docs:**
  - The Gmail scope tiers.
  - Restricted scopes need an annual security assessment.
  - Testing status allows up to 100 test users, and their authorizations expire after 7 days.
  - A lifetime cap of 100 new users for unverified apps.
  - 100 refresh tokens per account per client.
  - Verification timelines as estimates.
  - Domains must be verified in Search Console.
- **Unverified:**
  - Security-assessment duration and cost, which depend on the assessor.
  - The active setup time.
- **Hands-on status:** a Testing-mode client with `gmail.readonly` was **not** set up. A person would record the time taken, the test-user list shown in the console, and the consent screens.

### LinkedIn (`data/guides/linkedin.json`)
- **Sources:**
  - [Getting access](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access)
  - [3-legged OAuth flow](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
  - [Associate an app with a LinkedIn Page](https://www.linkedin.com/help/linkedin/answer/a548360)
- **Confirmed from docs:**
  - Only `profile`, `email` and `w_member_social` are self-serve.
  - Marketing, Sales Navigator and Talent need approval.
  - Compliance access is closed.
  - A default LinkedIn Page is required to create an app, and the app is permanently tied to it.
  - Access tokens last 60 days.
  - Programmatic refresh is only for some partners.
  - Members must accept all scopes or none.
  - Authorization codes expire in 30 minutes.
- **Unverified:**
  - Partner-approval timelines and criteria.
  - The active setup time.
- **Hands-on status:** an app was **not** created, and no partner product was applied for. A person would record whether a Page was required, the minutes taken, and the outcome of any partner application.

## Agent vs library comparison (2026-11-04)

Library slugs always return the reviewed guide, so I asked the agent about each app with a different query (for example "Notion public integration" instead of "notion") to force a fresh run, then compared the result with the library guide. All runs used the production pipeline on my machine.

| App (query) | Run | Claims (documented / community / probed / uncertain) | Verifier downgrades | Difficulty: agent vs library |
|---|---|---|---|---|
| GitHub ("GitHub OAuth apps") | 77 s, 10 tool calls (first attempt failed) | 39 (5 / 33 / 0 / 1) | 33 | easy vs easy: same |
| Notion ("Notion public integration") | 106 s, 9 calls | 47 (43 / 0 / 2 / 2) | 0 | **gated vs easy: differs** |
| Slack ("Slack API app") | 78 s, 9 calls | 38 (35 / 0 / 1 / 2) | 0 | moderate vs moderate: same |
| Gmail ("Gmail OAuth Google") | first attempt failed; retry succeeded | 45 (39 / 0 / 3 / 3) | 0 | hard vs hard: same |
| LinkedIn ("LinkedIn API") | 92 s, 8 calls | 23 (17 / 0 / 3 / 3) | 0 | **moderate vs gated: differs** |

Earlier runs on apps with no library guide: Zoom (62 s, 25 of 28 claims documented) and Calendly (about 80 s, 24 documented and 2 uncertain, 0 downgrades). Those have no reviewed guide to compare against, and I have not hand-checked their claims.

**Overall:** the agent agreed with the library on difficulty for 3 of 5 apps. 2 of 7 attempts failed outright ("the model could not produce a valid guide"), and both succeeded on retry. A failure shows the user an error and asks them to try again.

### What the comparison showed

**The agent caught a real error in my library guide (Notion).** The library said Notion's Marketplace review has "no timeline published". The agent found a page I had not read, and I confirmed it against the official Marketplace listing page: Notion says to expect an email within 5-10 business days, and listings can be rejected. I corrected `notion.json` and added that page as a source.

**Where the agent was worse than the library:**
- **Slack:** it never mentions the 1 request/min limit on message history for unlisted commercial apps. That is the single most useful nuance in the library guide. It also extracted no permission scopes, and left the approval wait as "unknown".
- **Notion:** its summary says public OAuth needs no review, yet it still rates the app "gated" because it folded the optional Marketplace review into the difficulty. The library rating (easy, with the Marketplace review as an optional step) is more defensible.
- **LinkedIn:** it rates the app "moderate", but LinkedIn's own page says most permissions need explicit approval, so "gated" fits better. It also missed the 60-day access token and the 30-minute authorization code.
- **Gmail:** it estimates the approval wait at 0-3 days (brand verification only), while Google's FAQ gives 6 weeks for restricted scopes. It also ties the security assessment to sensitive scopes, but Google ties it to restricted ones.

**Where the agent was better:** it read console pages and recorded what it saw (the `probed` claims), and it found documentation I had not, as with Notion above.

**A verifier weakness (GitHub):** the agent read GitHub's docs from `raw.githubusercontent.com` (the markdown source in GitHub's own docs repo). The verifier does not recognise that host as official, so it downgraded 33 claims to "community". The claims themselves were drawn from real GitHub documentation, so this was over-cautious. The failure is safe (it under-claims) but it makes the guide look weaker than it is.

## Hand-check of an agent-only guide: Calendly (2026-11-04)

Calendly has no library guide, so the only way to judge the agent's guide is to check it against the pages it cited. I fetched those three pages again and checked 17 claims.

**Confirmed (15):**
- Sandbox allows `https` and `http` on localhost; Production allows `https` only; exactly one redirect URI.
- Client ID, client secret and webhook signing key cannot be viewed again after creation.
- PKCE with `S256` is mandatory, and a request without a code challenge fails.
- If the Developer menu item is missing, use developer.calendly.com/login.
- No approval or review step is stated for Production apps, which matches the agent's `uncertain` rating on approval time.
- A privacy policy is required, and developers must not conceal their identity or their app's identity when requesting authorization.
- A `:write` scope implicitly includes the matching `:read` scope.
- Users can decline scopes during install; a 403 can mean a missing scope; existing installs may need reauthorization.
- The scope descriptions for scheduled events, webhooks, activity log and meeting recaps.

**Imprecise or unconfirmed (2):**
- The guide says `data_compliance:write` "implicitly includes the corresponding read scope". The scopes page lists no `data_compliance:read`, so that statement is wrong or at least misleading.
- The guide gives `developer.calendly.com/console/apps` as the place to manage apps. The page only names `developer.calendly.com/login`, so the `/console/apps` path is not confirmed.

**Omission (not an error):** the page documents 23 scopes and the guide lists 8. It leaves out `users:read`, `event_types:read`, `availability:read` and others that an integration is most likely to need first. A reader would have to open the docs for the rest.

**What this says about the agent:** on this guide the facts it did state were right (15 of 17), the two slips were over-reach in wording, and the main weakness was coverage. It also correctly refused to claim anything about approval time. I only checked one agent-only guide, so this is a sample, not a measured accuracy.

## Fixes made after the comparison

Two weaknesses from the comparison above are fixed in code, each with a unit test (172 tests pass):

1. **Docs mirror recognised as official.** A page in the provider's own docs repository on GitHub (for example `raw.githubusercontent.com/github/docs/...`) is now classed as official docs when the GitHub org matches the provider's official domain and the repo is a docs repo. Other repos stay unofficial. This is meant to stop the 33-claim downgrade seen on GitHub. A live re-run (`GitHub OAuth app setup`, 44 s) had 0 downgrades, but the agent read docs.github.com directly that time, so the mirror path was not exercised live. The unit test is the evidence for this fix.
2. **Synthesis retry.** Both failed runs were synthesis timeouts, not invalid output: the model call hung and was cut off at the end of the run deadline. The first attempt is now capped at part of the remaining time, and a second attempt gets the rest. A new test covers one retry and giving up after two failures. I have not yet seen a real run hit the retry.

## Remaining gaps

These are the things a reviewer should not assume are solved:

1. **No hands-on provider setup.** Nothing is `tested`. The cheapest first check is a GitHub OAuth App (about 10 minutes at `github.com/settings/developers`), but it needs a logged-in browser; GitHub has no API for creating one. A hands-on pass would also create a Notion public connection, install a Slack app in a second workspace, set up a Gmail Testing client with `gmail.readonly`, and create a LinkedIn app with a Page. Record the date, minutes and any fields that differ, then change only the claims that were confirmed to `tested`.
2. **Setup times are estimates.** No provider publishes how long the forms take, and none was timed hands-on. The ranges in the guides are forecasts, marked `uncertain`.
3. **Notion's public-connection owner role and access-token lifetime.** Notion documents the owner role for internal connections but not for public ones, and it publishes no token lifetime.
4. **Gmail security-assessment duration and cost.** The assessment is annual and paid to the assessor; Google publishes neither a duration nor a price.
5. **LinkedIn partner timelines and criteria.** Most permissions need approval and approval isn't guaranteed; no timeline or acceptance criteria are published.
6. **Agent judgment gaps.** The Slack agent still misses the 1 request/min history limit, and the Notion/LinkedIn difficulty disagreements are not fixed. They are model-judgment problems, not plumbing, and I did not want to tune prompts to the five apps I compared against.
7. **Generated guides are only as good as findable public docs.** The verifier checks citations, not truth.
