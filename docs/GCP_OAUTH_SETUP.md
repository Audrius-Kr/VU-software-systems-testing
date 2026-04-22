# Google Cloud + OAuth for Gmail API (one-time)

Follow these steps before running Postman or Newman. You need a **Google Cloud project**, **Gmail API** enabled, **OAuth consent**, and a **refresh token** for unattended runs.

## 1. Project and Gmail API

1. Open [Google Cloud Console – APIs & Services](https://console.cloud.google.com/apis/dashboard).
2. Create a project (or pick an existing one).
3. **APIs & Services → Library →** search **Gmail API → Enable**.

## 2. OAuth consent screen

1. **APIs & Services → OAuth consent screen**.
2. User type: **External** (typical for coursework).
3. App name, support email, developer contact.
4. **Scopes → Add scopes** (manually or from list). Add at least:

   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.labels`
   - `https://www.googleapis.com/auth/gmail.modify`

5. If the app stays in **Testing**, add your Gmail address under **Test users**.

## 3. OAuth client credentials

1. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type: **Desktop app** (recommended for refresh tokens with local tools).
3. Download the JSON; note **client_id** and **client_secret**.

## 4. Get a refresh token

You only need to do this once (until revoked).

**Option A – Postman OAuth 2.0**

- In Postman, use **Authorization → OAuth 2.0** on a Gmail request or folder.
- Configure:
  - **Auth URL:** `https://accounts.google.com/o/oauth2/v2/auth`
  - **Access Token URL:** `https://oauth2.googleapis.com/token`
  - **Client ID / Client Secret** from the Desktop client
  - **Scope:** space-separated list of the three URLs above
- **Get New Access Token**, complete browser login, then copy **refresh_token** from the token response if shown (some flows return it once).

**Option B – Google OAuth 2.0 Playground**

- Use [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) with your own OAuth credentials (gear icon) and the same scopes, then exchange for refresh token per Playground instructions.

**Option C – Script**

- Any small script that runs the authorization code flow with `access_type=offline` and `prompt=consent` can return a refresh token; store it only in secrets, never in git.

## 5. GitHub Actions secrets

In the repository: **Settings → Secrets and variables → Actions**, add:

| Secret | Description |
|--------|-------------|
| `GCP_OAUTH_CLIENT_ID` | OAuth client ID |
| `GCP_OAUTH_CLIENT_SECRET` | OAuth client secret |
| `GMAIL_REFRESH_TOKEN` | Refresh token from step 4 |

## 6. Postman environment (local)

Copy [postman/Gmail_API.postman_environment.example.json](../postman/Gmail_API.postman_environment.example.json) to `Gmail_API.postman_environment.json` (gitignored), set:

- `from_email` / `to_email` – your Gmail addresses (angle brackets not needed in the value).
- `access_token` – use **Get New Access Token** in Postman, or paste a short-lived token from `npm run get-token` after exporting client env vars.

## Notes

- **Testing** mode: refresh tokens for test users can expire after 7 days unless you publish the app or use a Google Workspace internal app; plan demos accordingly.
- **Base URL** for REST calls: `https://gmail.googleapis.com` (paths like `/gmail/v1/users/me/...`).
