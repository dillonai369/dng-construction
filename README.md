# DNG Construction website

Multi-page static site, built by Studio 7.

- `src/home.html` – homepage sections
- `src/posts.mjs` – blog posts (add an object to publish a new article)
- `src/styles.css`, `src/site.js` – shared styles and behaviour
- `scripts/build.mjs` – page templates, SEO tags, sitemap; writes everything to `dist/`
- `scripts/fetch-images.mjs` – downloads the photos and writes web-sized copies
- `static/` – logo files copied as-is

`npm run build` generates the site. Set `PREVIEW = false` in `scripts/build.mjs` at launch to let search engines index it.
