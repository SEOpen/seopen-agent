# Adding a page in Astro

Read the installed `astro` version in `package.json` first, because content collections changed between major versions. If the repository has its own notes or docs, they win over this page. The editing rules from `seopen-fix` still hold: titles and descriptions passed as props to a layout, `site` set in `astro.config.mjs`, `trailingSlash`, and the canonical set once in the layout.

## 1. Find how pages are made here

Copy the pattern the repo already uses. Don't invent a new one.

- A plain page is a file in `src/pages/`: `.astro`, `.md` or `.mdx`. The path is the URL. Find the nearest page like the one you're adding and copy its layout, imports and props.
- Blog posts are usually a content collection:
  - the collection is defined in `src/content.config.ts` (newer versions, with a `loader` such as `glob()`) or `src/content/config.ts` (older ones);
  - its entries are Markdown or MDX files, often in `src/content/blog/`, or wherever the loader's `base` points;
  - one dynamic route, such as `src/pages/blog/[...slug].astro`, renders them through `getStaticPaths` and `getCollection`.
- Read the collection's schema and two or three existing posts. Copy their frontmatter fields exactly. A field the schema requires and the new post lacks fails the build, and a field the schema doesn't know may be stripped or fail.
- Check how drafts work: a `draft` field filtered in `getStaticPaths`, a publish date, or nothing.
- Content from a CMS or an API is written there, not in the repo: tell the user.

## 2. Title, description, canonical, Open Graph

A post usually passes its frontmatter `title` and `description` to the layout, which writes the tags. Filling in the frontmatter is enough when it does. Check the layout to be sure.

```md
---
title: "How long does an oak desk take to make?"
description: "Each desk is built to order in our workshop and ships six weeks after you order it. Here is what happens in those six weeks."
pubDate: 2026-11-18
---
```

- Use the same field names and date format as the other posts. `pubDate` above is only an example.
- If the layout writes Open Graph tags, check which props feed them, such as an image, and pass those too.
- Lengths and wording: follow `references/writing.md`.

## 3. Sitemap

- With `@astrojs/sitemap` in `astro.config.mjs`, every built page is included unless a `filter` option leaves it out. The build writes `sitemap-index.xml` and numbered `sitemap-*.xml` files to the output folder. Check the integration's options in the repo's version.
- Without it, look for a hand-written `public/sitemap.xml` or a `src/pages/sitemap.xml.ts` endpoint, and add the new URL in the same form as the others.
- Adding the integration adds a dependency, so ask the user first.
- A draft must not reach the sitemap. If drafts are built but hidden, check the `filter`.

## 4. Structured data

Use what similar pages already render, usually from the layout or a component such as `SEO.astro`. If posts have none, add a `BlogPosting` (or `Article` for a guide) with only fields the page shows or the frontmatter holds:

```astro
---
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: entry.data.title,
  description: entry.data.description,
  datePublished: entry.data.pubDate.toISOString(),
  mainEntityOfPage: new URL(Astro.url.pathname, Astro.site).href,
};
---
<script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
```

Add `author` or `image` only if the page has them. Never add ratings, reviews or prices the page doesn't show.

## 5. Internal links

Add links from existing pages or posts in their own syntax (an `<a>` in `.astro`, a Markdown link in `.md`), following the link rules in `references/writing.md`. Match the site's `trailingSlash` and `base` settings.

## 6. Check the built output

Run the build with the package manager the lockfile shows. It writes to `dist/` unless `outDir` says otherwise. For a static site, read the files there directly; for a server build, run the preview command and fetch the page.

```sh
f=dist/guides/oak-desk-lead-times/index.html          # or .html, depending on build.format
grep -c "<h1" $f                                      # 1
grep -o "<title>[^<]*</title>" $f
grep -o '<link rel="canonical"[^>]*>' $f
grep -c "application/ld+json" $f
grep -l "oak-desk-lead-times" dist/sitemap-*.xml
```

Check the canonical uses the real site address from `site`, the JSON-LD parses, and the page is in the sitemap. Say what you checked in your report.
