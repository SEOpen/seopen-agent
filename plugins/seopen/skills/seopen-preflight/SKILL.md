---
name: seopen-preflight
description: Check a branch for changes that would hurt search traffic before it ships, reading the diff and the built pages for lost titles, noindex, broken canonicals, robots and sitemap changes, removed redirects and broken structured data. Works without SEOpen; with it, also checks the branch doesn't undo a recorded fix. Use when the user asks for an SEO check before deploy, a preflight, whether a change will hurt SEO, or to review a redesign or migration for SEO.
license: MIT
compatibility: Needs git and this site's source code. The SEOpen MCP server is optional.
---

# Preflight

Catch the changes that quietly cost traffic: a template losing its title, a stray noindex, a sitemap left out of the build, redirects dropped in a migration. Read only; change nothing unless the user asks.

## 1. What changed

Find the base branch (usually `main`) and run `git diff --stat <base>...HEAD`. If that's empty because you're on the base branch itself, check the commits not pushed yet (`git diff --stat @{u}...HEAD`) and uncommitted changes (`git diff --stat HEAD`), or ask the user for the commit range. Then read the diff for files that shape what search engines see:

- Page templates, layouts and head or metadata code.
- `robots.txt`, sitemap code, middleware, redirect and rewrite rules (`next.config.*`, `vercel.json`, `_redirects`, `netlify.toml`, `astro.config.*`, `svelte.config.*`).
- Routes added, renamed or removed.
- Structured data, canonical and hreflang code.

If only styles or copy changed in ways that touch none of these, say that and keep the rest short.

## 2. Check each risk

- **Index rules**: any new `noindex`, `nofollow`, `X-Robots-Tag` or robots `Disallow` that reaches production pages. Preview-only rules are fine; check they really are preview-only. A robots rule that blocks a search crawler (Googlebot, Bingbot, OAI-SearchBot, Claude-SearchBot, PerplexityBot) is a risk; one that blocks only training crawlers (GPTBot, ClaudeBot, Google-Extended, CCBot) is the owner's choice, so mention it without flagging it.
- **Titles and descriptions**: still set on every changed template, not blank, not the same on every page.
- **Canonicals**: absolute, pointing at the page itself or a deliberate target, and not at a preview or `localhost` URL.
- **Removed or renamed URLs**: each needs a permanent redirect to the closest page. List any without one.
- **Sitemap**: still generated, still lists the changed routes, no preview URLs.
- **Structured data**: valid JSON, types and fields still right.
- **Internal links**: links pointing at removed or renamed routes.
- **Rendering**: content that used to be in the HTML now loaded only by client JavaScript.
- **Images**: `alt` text still present on changed templates.

## 3. Check the build

Run the project's build. If it can be served locally, fetch a few changed pages and the robots and sitemap files, and check what the HTML really contains: title, meta robots, canonical, structured data. Built output beats reading code.

## 4. With SEOpen (optional)

If the SEOpen server is connected, call `list_projects` and `list_fixes` with `status: ["applied", "live", "measured"]`, and check the branch doesn't undo one of them, such as a title shortened on purpose. For a key page whose canonical or index rules changed, `inspect_url` (free) shows what Google has now, to compare after deploy. Never call a paid tool here.

## 5. Report

Three groups:

- **Blockers**: would cost traffic if shipped. File, line and the fix.
- **Worth a look**: probably fine but check.
- **Checked and fine**: one line each, so the user knows what was covered.

Offer to fix the blockers on this branch. When the branch removes or renames many URLs, or moves the site to a new domain, the `seopen-migration` skill builds the redirect map from every URL with traffic or links and checks the redirects after deploy. Keep the report in chat.
