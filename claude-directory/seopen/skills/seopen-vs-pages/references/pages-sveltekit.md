# Adding a page in SvelteKit

Read the installed versions of `svelte` and `@sveltejs/kit` in `package.json` first, and copy the syntax the repository already uses (runes or not, `$app/state` or `$app/stores`). If it has its own notes or docs, they win over this page. The editing rules from `seopen-fix` still hold: tags in `<svelte:head>` in one place, the site's real address in canonicals rather than `page.url.origin`, and no pages with server rendering turned off.

## 1. Find how pages are made here

Copy the pattern the repo already uses. Don't invent a new one.

- A plain page is a folder in `src/routes/` with a `+page.svelte`, and often a `+page.ts` or `+page.server.ts` that loads its data. Route groups such as `(marketing)` don't appear in the URL. Find the nearest page like the one you're adding and copy its shape.
- Blog posts usually come from one dynamic route, such as `src/routes/blog/[slug]/`, reading content from somewhere else. Find where:
  - Markdown files compiled by mdsvex (look for it in `svelte.config.js`, and which extensions it handles, such as `.md` or `.svx`), often gathered with `import.meta.glob`;
  - a `+page.svx` or `+page.md` per post, when mdsvex handles route files;
  - a CMS or database. Then the post is written there, not in the repo: tell the user.
- Read two or three existing posts. Copy their frontmatter fields exactly, including the date format and any draft field.
- Check prerendering. If the site prerenders (`export const prerender = true` in a layout, or `adapter-static`), a dynamic route needs the new slug to be found by the crawler from a link, or listed in an `entries` export. Check which the repo does.

## 2. Title, description, canonical, Open Graph

Find where existing posts get their tags: `<svelte:head>` in the post route, or a shared `Seo.svelte` given props. Usually the frontmatter feeds it, so filling that in is enough.

```svelte
<svelte:head>
  <title>{data.meta.title}</title>
  <meta name="description" content={data.meta.description} />
  <link rel="canonical" href={`https://example.com/blog/${data.slug}`} />
  <meta property="og:type" content="article" />
  <meta property="og:title" content={data.meta.title} />
</svelte:head>
```

Field names like `data.meta` above are only an example; use what the route's `load` returns. Lengths and wording: follow `references/writing.md`.

## 3. Sitemap

- Most SvelteKit sites have a `src/routes/sitemap.xml/+server.ts` endpoint. If it builds the list from the same source as the posts (the same `import.meta.glob`, or the same CMS call), a new post appears by itself. Check that it does.
- If it lists pages by hand, add the new URL in the same form as the others.
- A sitemap package, such as one that reads the routes, may need the new route's parameters. Check its config in the repo's version.
- A static `static/sitemap.xml` is edited by hand like any XML file.
- Keep drafts out of the sitemap with the same filter the blog index uses.

## 4. Structured data

Use what similar pages already render. If posts have none, add a `BlogPosting` (or `Article` for a guide) with only fields the page shows or the frontmatter holds, inside `<svelte:head>`:

```svelte
<script>
  let { data } = $props();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: data.meta.title,
    datePublished: data.meta.date,
    mainEntityOfPage: `https://example.com/blog/${data.slug}`,
  };
</script>

<svelte:head>
  {@html `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`}
</svelte:head>
```

On an older Svelte, `export let data;` replaces `$props()`. Add `author`, `image` or `dateModified` only if the page has them. Never add ratings, reviews or prices the page doesn't show.

## 5. Internal links

Add links from existing pages or posts with a plain `<a href>` or the Markdown link syntax, following the link rules in `references/writing.md`. Match the site's `trailingSlash` setting. On a prerendered site, these links are also how the crawler finds the new page.

## 6. Check the built output

Run the build with the package manager the lockfile shows. With `adapter-static` the pages land in `build/` (or the adapter's `pages` option); otherwise run the preview command and fetch the page.

```sh
curl -s http://localhost:4173/blog/oak-desk-lead-times > /tmp/page.html
grep -c "<h1" /tmp/page.html                       # 1
grep -o "<title>[^<]*</title>" /tmp/page.html
grep -o '<link rel="canonical"[^>]*>' /tmp/page.html
grep -c "application/ld+json" /tmp/page.html
curl -s http://localhost:4173/sitemap.xml | grep -c "oak-desk-lead-times"
```

Check the tags are in the HTML the server sent (not added later in the browser), there's one `<title>`, the JSON-LD parses, and the page is in the sitemap. Say what you checked in your report.
