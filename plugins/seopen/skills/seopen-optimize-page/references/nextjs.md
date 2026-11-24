# Next.js App Router

Read the installed version in `package.json` first. If the repository has its own Next.js notes or docs, they win over this page.

## Where things live

| Finding | Where |
|---|---|
| Title, description, Open Graph | `metadata` or `generateMetadata` in the route's `page.tsx`, or the nearest `layout.tsx` |
| Site-wide title pattern | `title: { template, default }` in the root `app/layout.tsx` |
| Canonical | `alternates.canonical` in metadata, with `metadataBase` set in the root layout |
| Noindex | `robots` in metadata, `app/robots.ts`, or an `X-Robots-Tag` header in `next.config` or `proxy` / `middleware` |
| Sitemap | `app/sitemap.ts` |
| Robots | `app/robots.ts` |
| Favicon | `app/icon.png` or `app/favicon.ico` |
| JSON-LD | A `<script type="application/ld+json">` rendered in the page component |
| Alt text | The `alt` prop of `next/image` or `<img>` |

The folder may be `src/app/`, and route groups such as `(marketing)` don't appear in the URL. Search for them when the path from `likely_files` doesn't exist. A dynamic route such as `app/blog/[slug]/page.tsx` serves many URLs, so the fix there usually belongs in `generateMetadata` or the content it reads.

## Metadata

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Handmade oak desks, built to order",
  description: "Oak desks made in our workshop in any size, delivered in six weeks.",
  alternates: { canonical: "/desks" },
};
```

For a dynamic route, use `generateMetadata`. In current versions `params` is a Promise, so await it. Copy how other routes in the repository read it.

```tsx
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return { title: post.title, description: post.summary, alternates: { canonical: `/blog/${slug}` } };
}
```

## Gotchas

- `metadata` and `generateMetadata` work only in server components. If `page.tsx` has `"use client"`, move the metadata to a `layout.tsx` beside it, or split the client part into its own component.
- You can't export both `metadata` and `generateMetadata` from one file.
- A title in the root layout's `template` is added to every page's title. Count it when shortening one, and use `title: { absolute: "..." }` for a page that shouldn't have it.
- A relative `alternates.canonical` needs `metadataBase`. Without it the canonical can come out wrong.
- Metadata in a layout carries down to its children, including canonicals. A canonical set in a layout makes every page under it point at the same address, which is a common cause of canonical findings.
- A `<title>` or `<meta>` written by hand next to the metadata API is a common cause of `duplicate-meta-tags`.
- Put an `<h1>` in the page, not the layout.
- Escape `<` in JSON-LD: `JSON.stringify(data).replace(/</g, "\\u003c")`.
