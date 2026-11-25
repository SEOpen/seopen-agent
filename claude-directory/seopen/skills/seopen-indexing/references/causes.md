# Why Google hasn't indexed a page

Each section is one of Google's coverage states, as `inspect_url` gives it in `coverage` and `get_indexing` gives it in `coverage` for each page. Google's wording shifts a little over time, so match on the main words. For each: what it usually means, how to confirm it, and what to do.

`inspect_url` is Google's last crawl, not the page as it is now. Compare `last_crawl` with the date of the last change to the page before you trust it. A change made after `last_crawl` isn't in the answer.

## URL is unknown to Google

**Usually:** Google has never seen the address. No indexed page links to it, and it isn't in a sitemap Google reads.

**Confirm:**
- The page loads with a 200 (fetch it, or check the route exists in the repo). `inspect_url` adds a `hint` when SEOpen's sitemap list or last audit says the page is missing or broken.
- It's in the sitemap the site serves. `get_indexing` only lists sitemap pages, so a page missing from that list is missing from the sitemap.
- Pages link to it. Search the repo for its path. `get_audit_issues` with `issue: "orphan-page"` lists pages the crawl reached with no internal links.

**Do:** add it to the sitemap if it isn't there, and link to it from a related page Google has indexed (hand the links to `seopen-internal-links`). Then the owner presses Request Indexing.

## Discovered, currently not indexed

**Usually:** Google knows the address but hasn't crawled it yet. It thinks the page isn't worth a crawl soon: few or weak internal links, a new site, or many similar pages queued ahead of it. On a big site it can also mean the server was slow when Google tried.

**Confirm:**
- Internal links in: `get_audit_issues` with `issue: "orphan-page"`, `"single-inlink"` and `"deep-page"`. Search the repo for links to the path.
- Is this one of many near-identical pages (tag pages, filters, thin location pages)? That is a site-wide pattern, not a single page.
- Server speed: `get_audit_issues` with `issue: "slow-server-response"`.

**Do:** links from strong, related pages (`seopen-internal-links`). Then Request Indexing. If it's one of hundreds of thin pages made from a template, say so: the fix is fewer, better pages, which is the user's decision.

## Crawled, currently not indexed

**Usually:** Google read the page and chose to leave it out. Most often the page is thin, says what another page on the site or the web already says, or doesn't answer anything a search asks for. Sometimes it's simply recent and still being judged.

**Confirm:**
- Read the page. How much does it say that only this site can say?
- `get_audit_issues` with `issue: "thin-content"` and `"duplicate-content"`.
- Another page of the site that covers the same thing: `get_search_console` with `dimension: "query_page"` and `contains` set to the main topic.
- How long ago it was crawled (`last_crawl`). A page crawled in the last week or two can still go in.

**Do:** this is a content decision, so take it to the user with the three choices:
- improve it so it answers something specific (hand to `seopen-optimize-page`, or `seopen-write` for a rewrite);
- merge it into the stronger page and redirect it;
- leave it out of Google on purpose (noindex and take it out of the sitemap).

Never add filler text to push a page in. A request alone rarely changes this verdict.

## Excluded by 'noindex' tag

**Usually:** a `<meta name="robots" content="noindex">` or an `X-Robots-Tag: noindex` header. Often left over from a staging setting, a CMS checkbox, or a layout that applies noindex to a whole section.

**Confirm:**
- Fetch the live page and read the head and the response headers.
- Search the repo. The framework reference says where noindex is set; check layouts and middleware as well as the page.
- Ask whether it's on purpose: thank-you pages, account pages, search results and drafts should stay out.

**Do:** with the user's yes, remove it. If it's on purpose, take the page out of the sitemap so it stops showing as a problem.

## Blocked by robots.txt

**Usually:** a `Disallow` rule matches the path. Note that robots.txt stops crawling, not indexing: a blocked page can still show in Google as a bare address, and Google can't see a noindex on a page it may not crawl.

**Confirm:** read the live `/robots.txt` and the file or route that makes it. `get_audit_issues` reports `crawler_access` with the rules it found and a fetch test. Match the path against each rule for `Googlebot` and `*`.

**Do:** with the user's yes, narrow the rule so it no longer matches the page, and leave every other rule alone. Never remove a rule for a training crawler (GPTBot, ClaudeBot, Google-Extended, CCBot): that is the owner's choice. To keep a page out of the index, allow the crawl and use noindex instead.

## Indexed, though blocked by robots.txt

**Usually:** the same rule as above, on a page Google indexed from links alone. It shows with no description.

**Do:** if the page should be in Google, unblock it. If not, unblock it and add noindex, since Google has to crawl the page to see the noindex. Both need the user's yes.

## Alternate page with proper canonical tag

**Usually:** fine. The page's canonical points to another page, Google agreed, and indexes that one. Typical for `?ref=` and other tracking addresses, print versions, and language or currency variants.

**Confirm:** the canonical target is the page the user wants in Google, and it's indexed (`inspect_url` on the target).

**Do:** nothing, unless this page was meant to rank on its own. Then its canonical is wrong: point it at itself, with the user's yes.

## Duplicate without user-selected canonical

**Usually:** Google found the same content at several addresses (with and without a trailing slash, `www`, query strings, upper case) and the page names no canonical.

**Confirm:** `google_canonical` in `inspect_url`, and `page_canonical` (empty here). `get_audit_issues` with `issue: "missing-canonical"`, `"duplicate-content"` and `"host-not-canonical"`.

**Do:** add a canonical to the version that should rank, the way the framework reference shows. Redirect the other addresses to it where the host allows. A canonical change needs the user's yes.

## Duplicate, Google chose different canonical than user

**Usually:** the page names itself as canonical, but Google thinks another page is the main copy, because the two say nearly the same thing, or because internal links, the sitemap and redirects all point at the other one.

**Confirm:** `canonicals_match` is false in `inspect_url`. Compare the page with `google_canonical`: are they really different? Which one do the site's own links and the sitemap use?

**Do:** if Google's choice is the better page, accept it: link to that one, drop this one from the sitemap, or merge and redirect. If this page should rank, make it clearly different and point the site's links and sitemap at it. Either way, the merge or rewrite is the user's decision.

## Page with redirect

**Usually:** the address redirects, so Google indexes where it ends. Fine for old addresses. A problem only when the sitemap or internal links still use the old address.

**Confirm:** fetch it and follow the hops. `get_audit_issues` with `issue: "sitemap-lists-bad-url"`, `"redirect-chain"` and `"links-to-redirects"`.

**Do:** list and link the final address instead. If the redirect itself is a mistake, that's a code fix, with the user's yes. Hand a large move to `seopen-migration`.

## Not found (404)

**Usually:** the page is gone or the address is wrong, and something still points at it: the sitemap, an internal link, or an outside link.

**Confirm:** fetch it. Search the repo for the path. `get_audit_issues` with `issue: "http-4xx"` and `"broken-internal-links"`.

**Do:** a page that should exist is a routing bug: fix it. A page that's gone on purpose: take it out of the sitemap and fix the links. If it had traffic or outside links, redirect it to its closest page, with the user's yes. A 404 for a page that's really gone is correct and needs no request.

## Soft 404

**Usually:** the page answers 200 but looks empty or like an error to Google: an empty category, "no results", a product that's out of stock with nothing else on the page, or content that only appears after JavaScript runs.

**Confirm:** fetch the HTML without JavaScript and read what's there. `get_audit_issues` with `issue: "soft-404"` and `"content-needs-javascript"`.

**Do:** if the page is really empty, return a real 404 or 410, or redirect it. If it has content Google can't see, render that on the server. For an out-of-stock product, keep the page and say when it's back or what to buy instead.

## Server error (5xx)

**Usually:** the page failed when Google came. It can be a passing outage or a page that always fails.

**Confirm:** fetch it now. `get_audit_issues` with `issue: "http-5xx"` and `"slow-server-response"`.

**Do:** a page that fails now is a bug: tell the user first, it matters more than indexing. A page that loads fine now just needs a request.

## Blocked due to unauthorized request (401) or access forbidden (403)

**Usually:** a login wall, a firewall, or a bot rule turning Google away.

**Confirm:** fetch it with no cookies. `get_audit_issues` with `issue: "bot-turned-away"`.

**Do:** a page behind a login is meant to stay out: take it out of the sitemap. A firewall rule is a hosting setting, not code: tell the user what to change.

## Redirect error

**Usually:** a loop, a chain too long, or a redirect to a bad address.

**Confirm:** follow the hops. `get_audit_issues` with `issue: "redirect-chain"`.

**Do:** one hop to the final page, with the user's yes.

## Fit to the business

- **Local service:** a page per service and per area is normal, but area pages that only swap the town name are the classic "crawled, not indexed". Each needs something true about that area.
- **Software:** docs, changelog and integration pages often go "discovered, not indexed" for lack of links. Link them from the feature pages they belong to.
- **Online store:** filter and sort addresses should point their canonical at the category, and that "alternate" state is fine. Out-of-stock and empty category pages are the usual soft 404s.
