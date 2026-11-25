# Redirect config by host

How to write a permanent redirect on each host this skill meets, checked against the hosts' docs in November 2026. Limits change: check the host's current docs before relying on a number here.

Search engines treat 301 and 308 the same: both pass the old page's standing to the new one. 302 and 307 are temporary and keep the old URL in the index, so never use them for a move.

## Which file to edit

Write the redirects where the site already keeps them. Look in this order:

1. The framework config: `next.config.*` (`redirects()`), `astro.config.*` (`redirects`), `svelte.config.*` and `src/hooks.server.*` for SvelteKit.
2. The host's file: `vercel.json`, `netlify.toml`, `_redirects` (Netlify and Cloudflare Pages, in the folder that gets published, such as `public/` or `static/`), `.htaccess`, an nginx site file.
3. Nothing yet: use the framework config if it has one, otherwise the host's file. Ask the user which host serves production if the repo doesn't say.

Never put the same redirect in two places. Two layers that disagree cause chains and loops.

## One to one, or a pattern

- **One to one**: one line per old URL. Clear, easy to check, and the right choice when the new paths don't follow a rule.
- **Pattern**: one rule for a whole folder, such as `/blog/:slug` to `/articles/:slug`. Use it only when every URL under the old path really has a page at the matching new path. A pattern that sends pages to URLs that don't exist turns every one into a 404 behind a redirect.
- Mixed: put the one-to-one exceptions first and the pattern last. Every host here reads rules top to bottom and the first match wins.
- A domain move is usually one pattern: every path on the old host to the same path on the new host, plus one-to-one lines for pages whose path also changed. Put those lines first, so they don't take two hops.

## Next.js

In `next.config.ts` (or `.js`, `.mjs`):

```ts
const nextConfig = {
  async redirects() {
    return [
      { source: "/old-pricing", destination: "/pricing", permanent: true },
      { source: "/blog/:slug", destination: "/articles/:slug", permanent: true },
      { source: "/docs/:path*", destination: "/help/:path*", permanent: true },
    ];
  },
};
```

- `permanent: true` sends 308. `permanent: false` sends 307: never use it for a move.
- `:slug` matches one segment; `:path*` matches zero or more.
- With `basePath` set, `source` and `destination` get it added unless the rule has `basePath: false`.
- A domain move on the same app: a rule with `has: [{ type: "host", value: "old.example.com" }]` and an absolute `destination`.
- `redirects()` runs before `proxy.ts` (the file Next.js 16 calls proxy; older versions call it middleware). For thousands of one-to-one redirects, the Next.js docs suggest a lookup in proxy instead of a huge array.
- On Vercel, the number of redirects in one deployment's config has a limit (2,048 in Vercel's docs in November 2026; older Next.js docs say 1,024). Check the current limit. Vercel's Bulk Redirects take CSV or JSON for more.

## Astro

In `astro.config.mjs`:

```js
export default defineConfig({
  redirects: {
    "/old-pricing": "/pricing",
    "/blog/[...slug]": "/articles/[...slug]",
    "/legacy": { status: 308, destination: "/new" },
  },
});
```

- The status is 301 by default. Old and new routes in a pattern need the same params.
- A file route wins: `/old-pricing` doesn't redirect while `src/pages/old-pricing.astro` still exists.
- **Static output without an adapter writes HTML pages with a meta refresh, not a real redirect.** With the host's adapter (Vercel, Netlify, Cloudflare), Astro writes real redirects into the host's config. Without one, put the redirects in the host's own file below and check them as [check-redirects.md](check-redirects.md) shows.

## SvelteKit

Redirects usually go in the host's file (below), since `svelte.config.js` has no redirect list. In code, for a server-rendered route:

```ts
// src/hooks.server.ts
import { redirect, type Handle } from "@sveltejs/kit";

const moved: Record<string, string> = { "/old-pricing": "/pricing" };

export const handle: Handle = async ({ event, resolve }) => {
  const to = moved[event.url.pathname];
  if (to) redirect(308, to);
  return resolve(event);
};
```

- Older SvelteKit versions need `throw redirect(...)`; match what the repo does.
- With `adapter-static` there's no server in production, so the hook never runs: use the host's file.

## Vercel (`vercel.json`)

For a site on Vercel that isn't Next.js:

```json
{
  "redirects": [
    { "source": "/old-pricing", "destination": "/pricing", "permanent": true },
    { "source": "/blog/:slug", "destination": "/articles/:slug", "permanent": true },
    { "source": "/legacy", "destination": "/new", "statusCode": 301 }
  ]
}
```

- `permanent: true` sends 308 (`permanent` is true when left out). `statusCode: 301` sends a 301 instead; don't set both.
- Patterns: `:slug`, `:path*`, and regex groups such as `/:path((?!uk/).*)`.
- `source` matches the path only. The query string passes through to the destination.

## Netlify

`_redirects` in the publish folder, one rule per line, source then destination then status:

```
/old-pricing     /pricing           301
/blog/:slug      /articles/:slug    301
/docs/*          /help/:splat       301
```

The same in `netlify.toml`:

```toml
[[redirects]]
  from = "/old-pricing"
  to = "/pricing"
  status = 301
```

- The status defaults to 301 when left out. Write it anyway.
- A rule does not run when a file exists at the old path (shadowing). After a move the old file is usually gone, but if the build still emits it, add `!` to the status (`301!`), or `force = true` in `netlify.toml`.
- `*` only at the end of a path, used as `:splat` in the destination. `:name` matches one segment.
- `_redirects` is read before `netlify.toml`. Netlify states no fixed rule count, but a very large set can fail the deploy; their docs suggest patterns for 10,000 or more.

## Cloudflare Pages

`_redirects` in the build output folder:

```
/old-pricing     /pricing           301
/blog/:slug      /articles/:slug    301
/docs/*          /help/:splat       301
```

- **The status defaults to 302.** Always write 301 or 308.
- Limits in Cloudflare's docs in November 2026: 2,000 static rules, 100 with splats or placeholders, 1,000 characters per line. Static rules go before dynamic ones. Above that, use Cloudflare's Bulk Redirects. Check the current limits.
- `_redirects` doesn't apply to paths a Pages Function handles.
- A domain move on Cloudflare is usually a Redirect Rule or Bulk Redirect in the dashboard, which the user sets up. Give them the list.

## nginx

Inside the `server` block for the old URLs:

```nginx
location = /old-pricing { return 301 /pricing; }
location ~ ^/blog/(.+)$ { return 301 /articles/$1; }
```

A whole domain to a new one, keeping the path and query:

```nginx
server {
  listen 443 ssl;
  server_name old.example.com www.old.example.com;
  # ssl_certificate lines stay as they are
  return 301 https://new.example.com$request_uri;
}
```

- For many one-to-one redirects, a `map` keeps them in one place:

```nginx
map $uri $new_uri {
  /old-pricing  /pricing;
  /old-about    /about;
}
server {
  if ($new_uri) { return 301 $new_uri; }
}
```

- Run `nginx -t` before reloading. The old domain still needs a valid certificate, or https visitors get an error before the redirect.

## Apache (`.htaccess`)

```apache
Redirect 301 /old-pricing /pricing
RedirectMatch 301 ^/blog/(.+)$ /articles/$1
```

A whole domain with mod_rewrite:

```apache
RewriteEngine On
RewriteCond %{HTTP_HOST} ^(www\.)?old\.example\.com$ [NC]
RewriteRule ^(.*)$ https://new.example.com/$1 [R=301,L]
```

- `Redirect` matches the start of the path, so `Redirect 301 /blog /articles` also sends `/blog/post` to `/articles/post`. Use `RedirectMatch` with `^...$` for an exact match.
- Don't mix `Redirect` and `RewriteRule` for the same paths: they run in different modules and the order is hard to predict.

## Static hosts without redirects

GitHub Pages and some plain file hosts can't send a 301. A meta refresh or JavaScript redirect is a weak substitute that search engines may or may not follow. Tell the user; the fix is a host or CDN in front that can send real redirects.

## Mistakes that cost traffic

- Chains: A to B to C. Point A straight at C, and update older redirects when a page moves again.
- Every old URL sent to the home page. Search engines treat that as a missing page.
- Trailing slashes that don't match the site's setting, which adds a hop on every URL. Map to the exact URL the new site serves.
- http to https and www to bare done as separate hops before the move redirect. Fold them into one rule where the host allows it.
- Redirects removed after a few months. Keep them at least a year, longer for pages with backlinks.
