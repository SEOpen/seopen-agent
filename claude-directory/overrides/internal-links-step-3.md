## 3. Count the links

Count from the repo with your own search and file tools. Counting every page is slow, so count for the candidates: the money pages from step 2, plus the striking-distance and unindexed pages. Make step 4's calls now to get those, and join the numbers later. If the sitemap (its address is in `get_indexing`) lists 100 pages or fewer, count for every page in it. If it lists more, say that orphans outside the candidates weren't checked.

First work out which pages are live:

- List the routes and the content folders, and match each sitemap address to the file that builds it.
- Leave out drafts, pages scheduled for later, pages set to noindex and redirects.
- Leave out areas that aren't public pages, such as a logged-in app, an admin area, an API, or routes another host serves. Look for a host split in `next.config`, middleware or a proxy file.
- If a rewrite serves a route at another path, such as a home page at `/landing`, links to either path count as the same page.

Then, for each candidate, search the code and content for every form of its address: the path with and without a trailing slash, the full URL on the site's own domain with and without `www`, and any route helper or constant the codebase uses for it. Look at Markdown links, `href` values and link components. For each match, write down:

- `linkedFrom`: the live page the link appears on, the link text, and the file. A link in a component counts for the pages that use it.
- `nav`: whether the match is in a nav, header, footer, sidebar, breadcrumb or layout file, or in a component that four or more pages share. Those sit on many pages, so keep them out of the count.
- `inbound`: how many different live pages link to the candidate from body text. Two links on one page count once, and a page's link to itself doesn't count.

For a source page you're thinking of using, `outbound` is how many body links to other pages of the site it already has.

Some links can't be seen this way: ones built from data at run time, such as related posts, a docs sidebar read from content, or category lists. Read the template of any page you're about to call an orphan, and count those by hand.

Check three candidates a second time before you trust the numbers: one with many links in, one with none and one from a content folder. Keep the counts in a file outside the repo, so you can compare them in step 8.
