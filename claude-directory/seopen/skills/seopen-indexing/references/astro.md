# Astro

Read the installed version in `package.json` first. If the repository has its own notes or docs, they win over this page.

## Where things live

| Finding | Where |
|---|---|
| Title, description, Open Graph | Usually a layout in `src/layouts/` or a `SEO.astro` / `Head.astro` component, fed by props from the page |
| A blog or docs page | The frontmatter of its file in `src/content/`, and the collection's schema in `src/content.config.ts` or `src/content/config.ts` |
| Canonical | `<link rel="canonical">` in that layout or component |
| Noindex | A `<meta name="robots">` in the layout, or `public/robots.txt` |
| Sitemap | `@astrojs/sitemap` in `astro.config.mjs`, which needs `site` set |
| Robots | `public/robots.txt`, or `src/pages/robots.txt.ts` |
| Favicon | `public/` |
| JSON-LD | `<script type="application/ld+json" set:html={JSON.stringify(data)} />` |
| Alt text | The `alt` prop of `<Image />` from `astro:assets`, or `<img>` |

## Metadata

Pages usually pass their title and description to a layout. Change the value at the page or in its frontmatter, not the layout's fallback, unless the fallback itself is the problem.

```astro
---
import Base from "../layouts/Base.astro";
---
<Base title="Handmade oak desks, built to order" description="Oak desks made in our workshop in any size, delivered in six weeks.">
  <h1>Oak desks</h1>
</Base>
```

A self-referencing canonical, set once in the layout:

```astro
---
const canonical = new URL(Astro.url.pathname, Astro.site);
---
<link rel="canonical" href={canonical} />
```

## Gotchas

- `Astro.site` comes from `site` in `astro.config.mjs`. If it's missing, add it, because the sitemap needs it too.
- Check `trailingSlash` in the config, so canonicals and sitemap entries match the URLs the site really serves.
- A dynamic route such as `src/pages/blog/[...slug].astro` serves every post. The title usually comes from the entry's frontmatter.
- Adding a field to a content collection means updating its schema, or the build fails.
- Adding `@astrojs/sitemap` adds a dependency, so say so to the user before you do it.
- Put an `<h1>` in the page, not the layout, unless the layout takes it as a prop.
