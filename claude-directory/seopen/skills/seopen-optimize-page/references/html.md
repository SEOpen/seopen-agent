# Plain HTML, and finding the real source

## Find the real source first

Before editing an HTML file, make sure it isn't generated. Changes to generated files vanish at the next build.

- Folders such as `dist/`, `build/`, `out/`, `_site/`, `public/` beside a generator's config, or `.next/` are output. Don't edit them. Check `.gitignore`, too.
- `_config.yml` means Jekyll, `hugo.toml` or `config.toml` means Hugo, and `.eleventy.js` or `eleventy.config.*` means Eleventy. Edit the templates and each page's front matter.
- A WordPress or other CMS site keeps its content outside the repository. Tell the user the change has to be made there.

## Where things live

| Finding | Where |
|---|---|
| Title, description, Open Graph, canonical, noindex | `<head>` of each page, or the shared include or template |
| Sitemap | `sitemap.xml` at the site root |
| Robots | `robots.txt` at the site root |
| Favicon | `favicon.ico` at the root, or a `<link rel="icon">` |
| JSON-LD | `<script type="application/ld+json">` in the page |
| Alt text | The `alt` attribute on `<img>` |

## The head of a page

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Handmade oak desks, built to order</title>
  <meta name="description" content="Oak desks made in our workshop in any size, delivered in six weeks." />
  <link rel="canonical" href="https://example.com/desks" />
</head>
```

## Gotchas

- With no shared template, the same fix may need making in every file. Find them all with a search before starting.
- A canonical needs the full address, in the form the site really serves: `https`, with or without `www`, with or without a trailing slash.
- In `sitemap.xml`, list only pages that answer 200 and should be in Google.
- With no build, there's nothing to run. Open the changed pages or check them for broken markup instead, and say that's what you did.
