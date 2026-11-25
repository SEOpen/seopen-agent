# Adding a page in Next.js App Router

Read the installed `next` version in `package.json` first. If the repository has its own Next.js notes or docs, they win over this page. The editing rules from `seopen-fix` still hold for a new page: the root layout's title template, `metadataBase`, canonicals carried down from a layout, metadata only in server components, and one way of writing tags rather than two.

## 1. Find how pages are made here

Copy the pattern the repo already uses. Don't invent a new one.

- Look under `app/` or `src/app/`. Route groups such as `(marketing)` don't appear in the URL.
- A plain page is a folder with a `page.tsx`. Find the nearest page like the one you're adding and copy its shape: imports, layout, components, how it sets metadata.
- Blog posts usually come from one dynamic route, such as `app/blog/[slug]/page.tsx`, reading content from somewhere else. Find where:
  - MDX or Markdown files in a folder such as `content/` or `posts/`, read with `fs`, a content library, or `@next/mdx`;
  - a `page.mdx` per post, when `@next/mdx` is set up with `pageExtensions`;
  - a CMS or database. Then the post is written there, not in the repo: tell the user.
- Read two or three existing posts. Copy their frontmatter fields exactly, including the date format, author, tags and any draft or publish-date field.
- A dynamic route usually has `generateStaticParams`. If it lists slugs by hand, add the new one.

## 2. Title, description, canonical, Open Graph

A static page exports `metadata`. A post gets it from `generateMetadata`, which reads the post's frontmatter. If the dynamic route already does this, filling in the frontmatter is enough.

```tsx
export const metadata: Metadata = {
  title: "How long does an oak desk take to make?",
  description: "Each desk is built to order in our workshop and ships six weeks after you order it. Here is what happens in those six weeks.",
  alternates: { canonical: "/guides/oak-desk-lead-times" },
  openGraph: { type: "article", url: "/guides/oak-desk-lead-times" },
};
```

- Check what the root layout's `openGraph` already sets. Open Graph from a layout is replaced, not merged, by a page's `openGraph`, so copy any fields the page still needs, such as `siteName` or `images`.
- A social image is either `openGraph.images` or an `opengraph-image` file beside the page. Use whichever the repo uses.
- Lengths and wording: follow `references/writing.md`.

## 3. Sitemap

- `app/sitemap.ts` returns the list. If it builds it from the same content source as the posts, a new post appears by itself. Check that it does.
- If it lists pages by hand, add the new URL in the same form as the others (full address or path, trailing slash or not, `lastModified` if the others have it).
- A `next-sitemap` config writes `public/sitemap.xml` after the build. New pages are picked up unless an `exclude` rule matches them.
- A draft or unpublished post must stay out of the sitemap. Check how the repo filters drafts, and that the new page passes or fails that filter as intended.

## 4. Structured data

Use what similar pages in the repo already render. If posts have none, a `BlogPosting` (or `Article` for a guide) is enough. Add only fields the page shows or the frontmatter holds:

```tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.title,
  description: post.description,
  datePublished: post.date,
  author: { "@type": "Person", name: post.author },
  mainEntityOfPage: `https://example.com/blog/${slug}`,
};
// In the page: <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
```

Leave out `image`, `dateModified` or `publisher` unless the page has them. Never add ratings, reviews or prices the page doesn't show.

## 5. Internal links

Add links from existing pages with `next/link` or the Markdown link syntax the content uses, following the link rules in `references/writing.md`. Use the path the site serves, matching `trailingSlash` in `next.config`.

## 6. Check the built output

Run the build with the package manager the lockfile shows. Then serve it (`next start`, or open `out/` if the site uses `output: "export"`) and fetch the new page:

```sh
curl -s http://localhost:3000/guides/oak-desk-lead-times > /tmp/page.html
grep -c "<h1" /tmp/page.html                       # 1
grep -o "<title>[^<]*</title>" /tmp/page.html
grep -o '<link rel="canonical"[^>]*>' /tmp/page.html
grep -c "application/ld+json" /tmp/page.html
curl -s http://localhost:3000/sitemap.xml | grep -c "oak-desk-lead-times"
```

Check that the title has the template's suffix only once, the canonical is the full address you meant, the JSON-LD parses, and the page is in the sitemap. Say what you checked in your report.
