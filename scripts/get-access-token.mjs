/**
 * Exchanges a Google OAuth refresh_token for a short-lived access_token.
 * Reads: GCP_OAUTH_CLIENT_ID, GCP_OAUTH_CLIENT_SECRET, GMAIL_REFRESH_TOKEN
 * Prints: single line access token only (for shell capture / GITHUB_ENV).
 */

const clientId = process.env.GCP_OAUTH_CLIENT_ID;
const clientSecret = process.env.GCP_OAUTH_CLIENT_SECRET;
const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

if (!clientId || !clientSecret || !refreshToken) {
  console.error(
    "Missing env: GCP_OAUTH_CLIENT_ID, GCP_OAUTH_CLIENT_SECRET, GMAIL_REFRESH_TOKEN"
  );
  process.exit(1);
}

const body = new URLSearchParams({
  client_id: clientId,
  client_secret: clientSecret,
  refresh_token: refreshToken,
  grant_type: "refresh_token",
});

const res = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body,
});

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  console.error("Token endpoint non-JSON:", text.slice(0, 200));
  process.exit(1);
}

if (!res.ok) {
  console.error("Token error:", json.error || res.status, json.error_description || "");
  process.exit(1);
}

if (!json.access_token) {
  console.error("No access_token in response");
  process.exit(1);
}

process.stdout.write(json.access_token);
