# Adding a page to a plain HTML or static-generator site

Make sure you're adding to the real source, not to built output: the `seopen-fix` notes on finding the real source still hold. Output folders such as `dist/`, `build/`, `_site/` or `public/` beside a generator's config are rebuilt and lose your file. A WordPress or other CMS site keeps its pages outside the repo: tell the user the page has to be added there.

## 1. Find how pages are made here

Copy the pattern the repo already uses. Don't invent a new one.

- **Plain HTML.** Each page is a file, and its path is the URL: `guides/oak-desk-lead-times.html` or `guides/oak-desk-lead-times/index.html`. Use the same form as the existing pages. Copy the closest existing page as the starting point, so the head, header, footer, styles and scripts match, then replace the content. Change every page-specific tag you copied.
- **Jekyll** (`_config.yml`). Posts go in `_posts/` named `YYYY-MM-DD-slug.md`. Pages are Markdown or HTML files with front matter, using a layout from `_layouts/`.
- **Hugo** (`hugo.toml`, `config.toml`). Content goes in `content/`, usually `content/posts/` or the section the others use. Check `archetypes/` for the front matter a new post starts with.
- **Eleventy** (`eleventy.config.*`, `.eleventy.js`). Content goes where the other posts are, often `posts/` with a directory data file that sets the layout and tags.
- Read two or three existing posts and copy their front matter fields exactly, including the date format, `draft` and tags.

## 2. Title, description, canonical, Open Graph

On a plain HTML page, write them in the `<head>`:

```html
<title>How long does an oak desk take to make?</title>
<meta name="description" content="Each desk is built to order in our workshop and ships six weeks after you order it. Here is what happens in those six weeks." />
<link rel="canonical" href="https://example.com/guides/oak-desk-lead-times" />
<meta property="og:type" content="article" />
<meta property="og:title" content="How long does an oak desk take to make?" />
<meta property="og:url" content="https://example.com/guides/oak-desk-lead-times" />
```

With a generator, the layout writes these from front matter. Set `title` and `description` (or whatever the other posts use) and check the layout reads them. Lengths and wording: follow `references/writing.md`. The canonical is the full address in the form the site serves: `https`, with or without `www`, with or without a trailing slash.

## 3. Sitemap

- **Hand-kept `sitemap.xml`.** Add one `<url>` in the same form as the others, with `<lastmod>` if they have it. Keep the file valid XML.

```xml
<url>
  <loc>https://example.com/guides/oak-desk-lead-times</loc>
  <lastmod>2026-11-18</lastmod>
</url>
```

- **Jekyll** with `jekyll-sitemap`, and **Hugo** by default, generate the sitemap from every page. Check the page isn't excluded (`sitemap: false` in front matter, or a draft).
- **Eleventy** usually has a `sitemap.xml` template that loops over a collection. Check the new page is in that collection.
- If there's no sitemap at all, say so to the user rather than adding one unasked.

## 4. Structured data

Use what similar pages already have. If posts have none, add a `BlogPosting` (or `Article` for a guide) with only fields the page shows:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "How long does an oak desk take to make?",
  "datePublished": "2026-11-18",
  "mainEntityOfPage": "https://example.com/guides/oak-desk-lead-times"
}
</script>
```

Add `author`, `image` or `dateModified` only if the page has them. Never add ratings, reviews or prices the page doesn't show. With a generator, put it in the layout or an include fed by front matter, the way the repo does other tags.

## 5. Internal links

Add links from existing pages, following the link rules in `references/writing.md`. With no shared template, a link in a header or menu has to be added to every file: find them all with a search first. Use the path form the site serves.

## 6. Check the output

For plain HTML, the file is the output. For a generator, run its build and read the file it writes.

```sh
f=guides/oak-desk-lead-times.html                   # or _site/..., public/..., dist/...
grep -c "<h1" $f                                    # 1
grep -o "<title>[^<]*</title>" $f
grep -o '<link rel="canonical"[^>]*>' $f
grep -c "application/ld+json" $f
grep -c "oak-desk-lead-times" sitemap.xml           # or the built one
```

Open the page in a browser or check it for broken markup, check the JSON-LD parses, and check every link you added goes to a page that exists. Say what you checked in your report.
