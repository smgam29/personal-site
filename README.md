# scottgamble.co.uk (source)

Static Vite site for [smgam29.github.io/personal-site](https://smgam29.github.io/personal-site/).

## Local

```bash
npm install
npm run dev
```

## Deploy (GitHub Pages)

Pushes to `main` build and publish via `.github/workflows/deploy-pages.yml`.

1. Push this repo to `smgam29/personal-site` on `main`
2. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. Site URL: https://smgam29.github.io/personal-site/

Optional custom domain later: add a `CNAME` and set Vite `base` to `/`.
