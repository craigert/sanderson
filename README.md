# The Worldhopper's Codex

An interactive, antique-star-chart PWA of Brandon Sanderson's Cosmere (and the
worlds beyond it). Pan and zoom the parchment, watch worlds live their own
ambient life, fly into a world to read its Shards / magic / books, search
everything with ⌘K, keep a spoiler-safe reading log, and — if you're lucky —
find Hoid.

It ships as a **fully static site** (no backend): the catalog is baked into
`client/public/data/catalog.json` and `client/public/covers/`, and the app is a
Vue 3 + Vite SPA.

## Develop

```
cd client
npm install
npm run dev
```

The dev server serves the static data straight from `client/public/` — no API
process required.

## Regenerate the static data

The source of truth is the SQLite seed in `server/`. After changing it, re-bake
the static files:

```
cd server && npm install    # first time only (needs sqlite3)
npm run data                # from the repo root — writes catalog.json + covers
```

`npm run data` runs `server/export-static.js`, which reads `server/catalog.db`
and writes `client/public/data/catalog.json` plus `client/public/covers/<id>.jpg`.

## Deploy (Cloudflare Workers + Static Assets)

Config lives in [`wrangler.jsonc`](./wrangler.jsonc); the built site is served
from `client/dist`.

Auto-publish on every push to `main`:

1. Cloudflare dashboard → **Workers & Pages → Create → Workers → Connect to Git**.
2. Pick the `craigert/sanderson` repo.
3. Set **Build command** to `npm run build` and leave the deploy command as the
   default `npx wrangler deploy`. Root directory `/`.
4. Save. Every push to `main` now builds and deploys automatically.

Locally you can deploy with `npm run build && npm run deploy` (needs
`wrangler login`).

## Structure

- `client/` — Vue 3 + Vite SPA (the whole app). Static data in `client/public/`.
- `server/` — the seed database and `export-static.js` (used only to regenerate
  the static data; not deployed).
