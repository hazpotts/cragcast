# CragCast Cache Warmer

A lightweight Cloudflare Worker that runs on a cron schedule to keep the CragCast weather cache warm.

## Why?

The main CragCast app fetches weather for 35 UK climbing regions. Without a warm cache, this can take 30+ seconds and timeout. This worker pre-populates the cache every 2 hours so users always get fast responses.

## Setup

1. Install dependencies:
   ```bash
   cd worker-cron
   npm install
   ```

2. Login to Cloudflare:
   ```bash
   npx wrangler login
   ```

3. (Optional) Set the warm secret to match your Pages environment:
   ```bash
   npx wrangler secret put WARM_SECRET
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

## Testing locally

```bash
npm run dev
# In another terminal:
curl -X POST http://localhost:8787
```

## Cron schedule

The worker runs every 2 hours (configured in `wrangler.toml`). You can view execution history in the Cloudflare dashboard under Workers & Pages > cragcast-cache-warmer > Settings > Trigger Events.
