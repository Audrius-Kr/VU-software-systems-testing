# Gmail API — Postman, Newman, GitHub Actions

Course deliverable: OAuth 2.0 + Gmail REST (`https://gmail.googleapis.com`), Postman collection, Newman CLI, scheduled CI with artifacts.

## Prerequisites

- [Postman](https://www.postman.com/downloads/)
- Node.js 20+ and npm (local Newman)
- Google Cloud project with Gmail API + OAuth (see [docs/GCP_OAUTH_SETUP.md](docs/GCP_OAUTH_SETUP.md))

## Repository layout

| Path | Purpose |
|------|---------|
| [postman/Gmail_API.postman_collection.json](postman/Gmail_API.postman_collection.json) | Collection (generated; run `npm run build:collection` after editing [scripts/build-postman-collection.mjs](scripts/build-postman-collection.mjs)) |
| [postman/Gmail_API.postman_environment.json](postman/Gmail_API.postman_environment.json) | Environment template (`from_email` / `to_email` — replace placeholders) |
| [postman/Gmail_API.postman_environment.example.json](postman/Gmail_API.postman_environment.example.json) | Copy starter for a local, gitignored file if you prefer |
| [scripts/get-access-token.mjs](scripts/get-access-token.mjs) | Refresh token → access token (used by CI) |
| [.github/workflows/gmail-newman.yml](.github/workflows/gmail-newman.yml) | Daily Newman run (**08:00 UTC**), `workflow_dispatch` for manual proof |

## Exercise 1 (Postman)

1. **Task 1.1 — OAuth 2.0 in Postman:** Import the collection and environment. Open folder **Exercise_1** (or the **Send email (Gmail API)** request). In **Authorization**, choose **OAuth 2.0** and configure Google ([Postman OAuth 2.0 docs](https://learning.postman.com/docs/sending-requests/authorization/#oauth-2-0)): Auth URL `https://accounts.google.com/o/oauth2/v2/auth`, Access Token URL `https://oauth2.googleapis.com/token`, client ID/secret, scopes from [docs/GCP_OAUTH_SETUP.md](docs/GCP_OAUTH_SETUP.md). Use **Get New Access Token** → **Use Token**. For graded exports, avoid saving secrets inside the collection JSON; use Bearer + `access_token` in the environment for Newman instead.
2. **Task 1.2 — Send + verify:** Run **Send email (Gmail API)**. Tests assert HTTP 200 and a non-empty `id`.

## Exercise 2 (Newman)

1. Set `from_email` and `to_email` in the environment JSON (same mailbox is fine).
2. Install and run the **Exercise_2** folder only:

```bash
npm install
set GCP_OAUTH_CLIENT_ID=...
set GCP_OAUTH_CLIENT_SECRET=...
set GMAIL_REFRESH_TOKEN=...
for /f "delims=" %t in ('node scripts/get-access-token.mjs') do set ACCESS_TOKEN=%t
npx newman run postman/Gmail_API.postman_collection.json -e postman/Gmail_API.postman_environment.json --folder "Exercise_2" --env-var access_token=%ACCESS_TOKEN%
```

On PowerShell, set env vars with `$env:NAME = '...'` and capture the token similarly.

Scenario: send email → create label → add label to message → list messages with that label → trash message → delete label. Each request has at least two tests. Preconditions use randomized `runId` / label name (collection + environment variable scopes).

## GitHub Actions (scheduled proof)

1. Push this repo to GitHub.
2. Add secrets: `GCP_OAUTH_CLIENT_ID`, `GCP_OAUTH_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` (see [docs/GCP_OAUTH_SETUP.md](docs/GCP_OAUTH_SETUP.md)).
3. Edit [postman/Gmail_API.postman_environment.json](postman/Gmail_API.postman_environment.json) so committed `from_email` / `to_email` match the mailbox authorized for that refresh token (or keep placeholders and override only in a private fork).
4. **Schedule:** workflow runs at **08:00 UTC** daily (`cron: "0 8 * * *"`). Use **Actions → Gmail API Newman → Run workflow** for an immediate run.
5. **Proof:** open the workflow run → **Summary** → downloaded artifact **newman-gmail-proof** (`newman.log`, `report.json`).

## Scripts

- `npm run build:collection` — regenerate `postman/Gmail_API.postman_collection.json`
- `npm run get-token` — print access token (requires the three GCP/Gmail env vars)
- `npm run newman` — **Exercise_2** scenario (default); `npm run newman:all` — entire collection including Exercise_1
