# Relay worker

Small Cloudflare Worker that gives the static site two things it cannot do on its own:

1. `POST /submit`: turns a contribute-form submission into a pull request on the repo.
2. `/oauth/*`: GitHub OAuth handshake so editors can log in to Decap CMS at `/admin`.

## Deploy

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put GITHUB_TOKEN        # fine-grained PAT: Contents + Pull requests, read/write, this repo only
npx wrangler secret put OAUTH_CLIENT_ID     # GitHub OAuth app, callback URL = https://<worker>/oauth/callback
npx wrangler secret put OAUTH_CLIENT_SECRET
npx wrangler deploy
```

Then:

- set the repository variable `PUBLIC_RELAY_URL` to `https://<worker>/submit` (Settings → Secrets and variables → Actions → Variables) and redeploy the site;
- set `backend.base_url` in `public/admin/config.yml` to `https://<worker>`.

Until the worker exists, the contribute form falls back to opening a prefilled GitHub issue.
