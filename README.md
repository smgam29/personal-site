# scottgamble.co.uk (source)

Static Vite site for [scottgamble.co.uk](https://scottgamble.co.uk/) (GitHub Pages). Fallback project URL: [smgam29.github.io/personal-site](https://smgam29.github.io/personal-site/).

## Local

```bash
npm install
npm run dev
```

## Deploy (GitHub Pages)

Pushes to `main` build and publish via `.github/workflows/deploy-pages.yml`.

1. Push this repo to `smgam29/personal-site` on `main`
2. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. Repo → **Settings → Pages → Custom domain** → `scottgamble.co.uk` → Save → later tick **Enforce HTTPS**
4. DNS is at **Krystal** (see `docs` / internal Krystal DNS notes). Apex uses GitHub Pages `A`/`AAAA` records; `www` is a `CNAME` to `smgam29.github.io`.

`public/CNAME` ships `scottgamble.co.uk` into `dist` for documentation; with Actions publishing, GitHub ignores that file — the Pages **Custom domain** setting is authoritative. Vite `base` is `/` for the apex domain.
