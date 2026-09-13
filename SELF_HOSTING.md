# Self-hosting OneBox

This guide walks through running OneBox yourself: locally for development, and on your own server for production. It assumes basic familiarity with Docker, a reverse proxy (nginx, Caddy, Traefik) and the Google Cloud console.

## 1. Overview

OneBox has three moving parts:

- **Next.js app**: the inbox UI, authentication (Auth.js with Google), and the API routes that connect Gmail accounts and serve the realtime token.
- **Supabase (Postgres)**: stores users, connected Gmail accounts (with encrypted OAuth tokens), processed emails, and categorization rules. Row Level Security scopes every read to its owner, and Realtime pushes new rows to the browser.
- **n8n**: two workflows that do the actual email processing outside the request/response cycle of the app.

Message flow, end to end:

```
Gmail account ──watch()──> Google Pub/Sub topic ──push (OIDC)──> n8n webhook
                                                                     │
                                                     verify JWT, decode notification
                                                                     │
                                                     fetch new messages (Gmail API)
                                                                     │
                                                     ask Gemini for summary / reply / category
                                                                     │
                                                     apply the user's own rules
                                                                     │
                                                     upsert into Supabase (emails table)
                                                                     │
                                                     Realtime ──> browser (Next.js app)
```

A second, scheduled n8n workflow renews each account's Gmail `watch()` every week, since a watch subscription expires after 7 days.

## 2. Requirements

| Component | What you need |
|---|---|
| Node.js | version 22 (see `.nvmrc`) |
| Docker | for local Supabase, the app image, and n8n |
| A Google Cloud project | Gmail API, Pub/Sub, OAuth consent screen |
| A Supabase project | free tier is enough for personal use |
| An n8n instance | reachable over HTTPS from the public internet |
| A domain (or subdomain) per public service | app and n8n need their own hostnames |

## 3. Local development

```bash
git clone <your-fork-url> onebox
cd onebox
npm ci
cp .env.example .env.local
```

Start the local Supabase stack (Docker) and apply the versioned migrations:

```bash
npm run db:start
```

This runs the Supabase CLI in Docker and applies everything under `supabase/migrations/` automatically. Fill in `.env.local` with the values it prints (API URL, anon key, service role key, JWT secret), plus `NEXTAUTH_SECRET` and `TOKEN_ENCRYPTION_KEY` (`openssl rand -base64 32` for both). You can leave the Google and Gemini variables as placeholders for now; `src/instrumentation.ts` checks all required variables at startup and refuses to boot listing whichever are missing, so the app will tell you if something is missing.

Seed some example data and generate the TypeScript types:

```bash
npm run seed
npm run gen:types
```

Both target the local stack by default. Then run the app:

```bash
npm run dev
```

Run the tests:

```bash
npm test               # unit tests, no database needed
npm run test:integration   # queries, search, RLS isolation between two users, against local Supabase
```

**Important limitation**: none of this exercises the Gmail pipeline. `history.list`, `watch()` and the Pub/Sub push notification all require a real Google Cloud project and an n8n instance reachable over public HTTPS, since Google needs to be able to reach the webhook. Local development covers the app and the database; testing the pipeline itself requires following sections 4 to 6 as well, even for a throwaway setup.

To point any of the scripts at a hosted Supabase project instead of the local stack, pass `-- --prod` (for example `npm run db:push -- --prod`, `npm run seed -- --prod`, `npm run gen:types -- --prod`). These read `SUPABASE_DB_URL`, `SUPABASE_ACCESS_TOKEN` and `SUPABASE_URL` from `.env.local`. Keep a separate Supabase project for development so a stray `--prod` run never touches your real data.

## 4. Google Cloud

1. Create a project and enable the **Gmail API** and the **Cloud Pub/Sub API**.
2. **OAuth consent screen**: type External. For personal self-hosting you can leave it in Testing mode, without submitting for Google's verification. Add every email address that will use the app as a test user. When configuring the Gmail scope, there's an optional checkbox tied to Gmail access: make sure it's checked, otherwise `watch()` calls fail with a 403 later even though the scope was granted.
3. **OAuth client (type: Web application)**, created under APIs & Services → Credentials. Register both redirect URIs, since there are two separate OAuth flows (sign-in via Auth.js, and connecting an additional Gmail account via a manual flow):
   ```
   https://app.example.com/api/auth/callback/google
   https://app.example.com/api/accounts/callback
   ```
   In local development, the equivalent with `http://localhost:3000`.
4. **Pub/Sub topic**: create one (for example `gmail-notifications`), full name `projects/<gcp-project>/topics/<topic-name>`, stored in `GMAIL_PUBSUB_TOPIC`.
5. Grant the **Pub/Sub Publisher** role on that topic to `gmail-api-push@system.gserviceaccount.com`. Without it, `watch()` fails to create the notification subscription.
6. **Push subscription**, authenticated with OIDC:
   - Create a dedicated service account for this (not the `gmail-api-push@...` one above, that one only publishes to the topic).
   - Create the subscription on the topic with "Enable authentication", pointing at that service account and leaving the audience at its default, the push endpoint URL.
   - Endpoint: `https://n8n.example.com/webhook/onebox-gmail`. The path is fixed and has no secret suffix; the subscription's OIDC authentication is what keeps it from being invoked by anyone else.

## 5. Supabase (hosted)

1. Create a project in the Supabase dashboard. The free tier works for personal use, but note that free projects are suspended after roughly a week of inactivity: a suspended project's hostname starts resolving to nothing, and the schema has to be reapplied from the migrations after recreating it (all data, including connected accounts' OAuth tokens, is lost).
2. Under **Settings → API**, collect `SUPABASE_URL`, the anon key (`SUPABASE_ANON_KEY`) and the service role key (`SUPABASE_SERVICE_ROLE_KEY`, server only, never expose it to the browser).
3. Under **Settings → API → JWT Settings**, collect the JWT secret into `SUPABASE_JWT_SECRET`. Supabase Auth itself is not used for user sessions, Auth.js handles that entirely; the app signs its own short-lived (1 hour) tokens with this secret, `sub` set to the user's id, served through `/api/realtime-token` to already-authenticated sessions. The browser's Supabase client uses that token for Realtime, and it's what `auth.uid()` reads in the RLS policies.
4. Get the **Session pooler** connection string from the dashboard's Connect button (not the direct connection string: new projects only expose a direct connection over IPv6, which fails in most local and CI environments). Percent-encode the password in the URI, and store it as `SUPABASE_DB_URL`.
5. Apply the migrations:
   ```bash
   npm run db:push -- --prod
   ```
6. Generate a personal access token under **Account → Access Tokens**, store it as `SUPABASE_ACCESS_TOKEN`, and generate the TypeScript types:
   ```bash
   npm run gen:types -- --prod
   ```
7. Realtime for the `emails` table is enabled by one of the migrations; there is nothing to toggle in the dashboard.
8. Recommended order: create the project, apply migrations, generate types, run the seed if you want sample data, only then start the app against it.

## 6. n8n

**Environment variables the container needs:**

```
SUPABASE_URL
TOKEN_ENCRYPTION_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GEMINI_API_KEY
GMAIL_PUBSUB_TOPIC
PUBSUB_PUSH_AUDIENCE
PUBSUB_PUSH_SERVICE_ACCOUNT
N8N_BLOCK_ENV_ACCESS_IN_NODE=false
NODE_FUNCTION_ALLOW_BUILTIN=crypto
```

`TOKEN_ENCRYPTION_KEY` must be the same value the app uses: tokens are decrypted inside n8n. `PUBSUB_PUSH_AUDIENCE` is the push endpoint URL and `PUBSUB_PUSH_SERVICE_ACCOUNT` is the service account email you created in step 4.6; the pipeline's first node verifies the Google-signed JWT in the `Authorization` header (signature against Google's public keys, `iss`, `aud`, `email`, `email_verified`, `exp`) and stops the execution if it doesn't check out, before touching the Gmail API or Gemini. Without `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`, the Code nodes can't read `$env` at all; without `NODE_FUNCTION_ALLOW_BUILTIN=crypto`, the node that decrypts tokens can't `require('crypto')`.

**Supabase credential**: create it inside n8n itself (credential type "Supabase API") using `SUPABASE_URL` and the service role key, entered directly through the n8n UI or a command run inside the container, rather than copying files in from outside. If you do copy a file in with `docker cp`, watch out for ownership: the file lands owned by `root`, and the n8n process usually runs as an unprivileged user that can't read it.

**Importing the workflows:**

```bash
docker exec -i <n8n-container> sh -c "cat > /tmp/wf.json" < n8n/pipeline-gmail.json
docker exec <n8n-container> n8n import:workflow --input=/tmp/wf.json
```

Repeat for `n8n/renovacao-watch.json`. After importing `pipeline-gmail.json`, open the **Gravar email** node and update the Supabase project URL in its parameters: it's written into the node itself and isn't read from the environment.

Importing a workflow doesn't activate it. Activate both manually in the editor (or via the CLI) and restart the n8n service afterwards, so the webhook route and the weekly schedule actually get registered.

**Exposing n8n**: only proxy `/webhook/*` through your reverse proxy; reach the editor itself through an SSH tunnel instead of exposing it publicly. If you do expose the editor, make sure the instance owner account is already claimed first: an unclaimed instance lets whoever loads the UI create that account and get access to every credential and environment variable.

## 7. Deploying the app

The production image is built by CI as `ghcr.io/<owner>/onebox`. Example `docker-compose.yml`:

```yaml
services:
  onebox:
    image: ghcr.io/<owner>/onebox:latest
    restart: unless-stopped
    env_file: .env
    ports:
      - "127.0.0.1:3000:3000"
```

Bind the port to `127.0.0.1` and let the reverse proxy handle the public side: Docker manipulates `iptables` directly and ignores UFW rules, so a port published without an address (or on `0.0.0.0`) is reachable from the internet regardless of your firewall.

Put nginx, Caddy or Traefik in front with a TLS certificate (Let's Encrypt is the common choice) and proxy to the container's internal port. The Next.js server itself doesn't terminate TLS.

Auth.js needs `trustHost: true` to work behind a reverse proxy (already set in `src/lib/auth.ts`); without it, the request arrives with a different host than Auth.js expects and every sign-in gets rejected.

## 8. Environment variable reference

| Variable | Used by | Where to get it |
|---|---|---|
| `GOOGLE_CLIENT_ID` | app, n8n | Google Cloud → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | app, n8n | same |
| `NEXTAUTH_SECRET` | app | generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | app | `http://localhost:3000` in dev, your app's public URL in production |
| `SUPABASE_URL` | app, n8n | Supabase dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | app | same |
| `SUPABASE_SERVICE_ROLE_KEY` | app, n8n | same (server only) |
| `SUPABASE_JWT_SECRET` | app | Supabase dashboard → Settings → API → JWT Settings |
| `SUPABASE_DB_URL` | local scripts only | Supabase dashboard → Connect → Session pooler |
| `SUPABASE_ACCESS_TOKEN` | local scripts only | Supabase dashboard → Account → Access Tokens |
| `GEMINI_API_KEY` | app, n8n | https://aistudio.google.com/apikey |
| `TOKEN_ENCRYPTION_KEY` | app, n8n | generate with `openssl rand -base64 32`; must match on both |
| `GMAIL_PUBSUB_TOPIC` | app, n8n | `projects/<gcp-project>/topics/<topic-name>` |
| `PUBSUB_PUSH_AUDIENCE` | n8n only | the push subscription's endpoint URL |
| `PUBSUB_PUSH_SERVICE_ACCOUNT` | n8n only | the service account created for the push subscription |
| `N8N_BLOCK_ENV_ACCESS_IN_NODE` | n8n only | set to `false` |
| `NODE_FUNCTION_ALLOW_BUILTIN` | n8n only | set to `crypto` |

## 9. Troubleshooting

**`watch()` fails with 403 even though the scope was granted.**
Cause: the optional Gmail access checkbox on the OAuth consent screen wasn't checked when the scope was added.
Fix: revisit the consent screen configuration, check that option, and try `watch()` again.

**A reconnected Gmail account has no `refresh_token`.**
Cause: `access_type=offline` only returns a refresh token on the first consent for a given account; later logins don't repeat it unless `prompt: consent` is also sent.
Fix: the app already sends both on every OAuth flow, so this normally shows up when testing with a token that was issued before that. Revoke the app's access on the Google account and reconnect.

**Connected accounts stop updating after about a week.**
Cause: while the OAuth consent screen is in Testing mode, Google expires refresh tokens after 7 days; separately, the Gmail `watch()` subscription itself also expires every 7 days regardless of token state.
Fix: the token side requires reconnecting the account manually, or publishing the OAuth app and going through Google's verification to lift the limit. The watch side is handled automatically by the weekly renewal workflow, as long as it's active in n8n.

**A Supabase project suddenly returns NXDOMAIN.**
Cause: free-tier projects are suspended after roughly a week without activity.
Fix: recreate the project, reapply the migrations (`npm run db:push -- --prod`), and reconnect every Gmail account, since the stored tokens are gone with the old project.

**`db:push` or `gen:types` fail to connect from CI or some local networks.**
Cause: a new Supabase project's direct database connection is IPv6-only, which fails on IPv4-only networks.
Fix: always use the Session pooler connection string (`SUPABASE_DB_URL`), never the direct one.

**The app container is reachable from the internet despite firewall rules.**
Cause: Docker writes its own `iptables` rules and bypasses UFW when a port is published without binding an address.
Fix: publish the port as `127.0.0.1:3000:3000`, never `0.0.0.0:3000:3000` or `-p 3000:3000`.

**n8n Code nodes throw "undefined" style errors around `$env` or `require`.**
Cause: `N8N_BLOCK_ENV_ACCESS_IN_NODE` or `NODE_FUNCTION_ALLOW_BUILTIN` wasn't set before the workflows were imported and run.
Fix: set both environment variables and restart the n8n container.

**An n8n node that reads a Supabase table seems to silently stop the workflow.**
Cause: a node with zero input items simply doesn't run in n8n, it doesn't run with an empty list. This is deliberate for accounts that were disconnected (the lookup returns nothing and the workflow ends cleanly), but it can also mask a real bug upstream.
Fix: whenever a node "disappears" with no visible error, check whether the previous node actually returned any rows.

**A copied-in n8n credential file can't be read by the process.**
Cause: `docker cp` leaves the file owned by `root`, while the n8n process usually runs as an unprivileged user.
Fix: create credentials through the n8n UI, or run the command that creates them from inside the container instead of copying files in.

**`npm run test:integration`, `seed` or `gen:types` fail with a `supabase status` error.**
Cause: without `-- --prod` these read the connection details from the local Supabase stack, which isn't running.
Fix: run `npm run db:start` first. Integration tests never run against a hosted project.

## 10. Security notes

- **Tokens at rest**: Gmail access and refresh tokens are encrypted with AES-256-GCM using `TOKEN_ENCRYPTION_KEY` before being stored, and are never returned in any API response to the frontend, encrypted or not. Rotating this key requires either re-encrypting existing tokens or reconnecting every account from scratch.
- **Row Level Security**: the `authenticated` role can only read its own rows, matched via `auth.uid()` against the `sub` claim of the short-lived token the app issues. Token columns on `email_accounts` are excluded from the select grant entirely, even for the row's own owner. Most writes (AI summary, suggested category, and so on) are only possible with the service role; the user can only change a handful of specific columns (state, manual category, snooze).
- **Webhook authentication**: the Pub/Sub push subscription uses OIDC, and the pipeline verifies the signed JWT (signature, issuer, audience, service account email, expiry) before doing any real work. Without that check, anyone who finds the webhook path could trigger Gmail API and Gemini calls at your expense.
- **Service role key**: only ever used server-side, in the app's backend and inside the n8n container. It must never reach the browser or a client-side bundle.
- **Docker and the host firewall**: Docker manages its own `iptables` rules and does not respect UFW. Always bind published ports to `127.0.0.1` and let the reverse proxy be the only public entry point, both for the app and for n8n's admin editor.
