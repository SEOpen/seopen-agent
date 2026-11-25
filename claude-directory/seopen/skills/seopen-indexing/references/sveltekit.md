# SvelteKit

Read the installed versions of `svelte` and `@sveltejs/kit` in `package.json` first, and copy the syntax the repository already uses. If it has its own notes or docs, they win over this page.

## Where things live

| Finding | Where |
|---|---|
| Title, description, Open Graph | `<svelte:head>` in the route's `+page.svelte`, or a shared component such as `Seo.svelte` |
| Values that come from data | `+page.ts` or `+page.server.ts` |
| Site-wide defaults | `src/routes/+layout.svelte`, `src/app.html` |
| Canonical | `<link rel="canonical">` in `<svelte:head>` |
| Noindex | `<meta name="robots">` in `<svelte:head>`, `static/robots.txt`, or a header in `hooks.server.ts` |
| Sitemap | `src/routes/sitemap.xml/+server.ts` |
| Robots | `static/robots.txt` |
| Favicon | `static/`, linked from `src/app.html` |
| JSON-LD | `{@html}` of a script tag inside `<svelte:head>` |
| Alt text | The `alt` attribute on `<img>` or `enhanced:img` |

Route groups such as `(marketing)` don't appear in the URL, and `[slug]` folders serve many URLs. Search for them when the path from `likely_files` doesn't exist.

## Metadata

```svelte
<svelte:head>
  <title>Handmade oak desks, built to order</title>
  <meta name="description" content="Oak desks made in our workshop in any size, delivered in six weeks." />
</svelte:head>
```

A self-referencing canonical. Newer versions read `page` from `$app/state`, and older ones read the `$page` store from `$app/stores`.

```svelte
<script>
  import { page } from "$app/state";
</script>

<svelte:head>
  <link rel="canonical" href={`https://example.com${page.url.pathname}`} />
</svelte:head>
```

Use the site's real address. During prerendering `page.url.origin` can't be trusted to be it.

A sitemap route:

```ts
export const prerender = true;

export function GET() {
  const pages = ["/", "/desks"];
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages
    .map((p) => `<url><loc>https://example.com${p}</loc></url>`)
    .join("")}</urlset>`;
  return new Response(body, { headers: { "Content-Type": "application/xml" } });
}
```

## Gotchas

- A `<title>` in both a layout and a page can both render. Keep it in one place, or the page's only.
- A page that turns off server rendering (`ssr = false`) has no tags in its HTML for a crawler to read. Tell the user, because that's the real problem.
- Keep the sitemap's list from the same source as the routes when the site has one.
- Put an `<h1>` in the page, not the layout.
