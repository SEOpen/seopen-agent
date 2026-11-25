# SEOpen plugin

Skills and the MCP connection for [SEOpen](https://getseopen.com), which keeps your site's Search Console data, rank tracking, site audits, AI visibility, Local SEO and backlinks. 25 skills in four groups. You need a SEOpen account.

### Find

| Skill | What it does | Cost |
|---|---|---|
| `seopen-setup` | Connects the plugin and checks it works | Free |
| `seopen-striking-distance` | Searches you almost rank for, and what to change on each page | Free |
| `seopen-content-refresh` | Pages losing traffic, and whether to update, merge or redirect each | Free |
| `seopen-keyword-research` | Keywords for a topic, and which page each belongs on | Asks you to approve research credits first |
| `seopen-keyword-gap` | Keywords competitors rank for that you don't | About 3 credits a competitor, asked first |
| `seopen-keyword-clusters` | Groups keywords into one page each and saves the groups | 1 credit a close call, asked first |
| `seopen-teardown` | How any site gets its search traffic, and what your site can take from it | About 8 credits a site, asked first |
| `seopen-competitor-plan` | Who you really compete with in Google, and a 90-day plan | Asks you to approve research credits first |
| `seopen-link-prospects` | Sites linking to competitors but not to you, with a reason to reach out | About 4 credits a competitor, asked first |
| `seopen-free-tool-idea` | Free tools worth building, checked against real searches | Asks you to approve research credits first |
| `seopen-ai-visibility-check` | How AI answers mention your site, what they cite and who they name instead | Free |
| `seopen-ai-citations` | Why AI answers cite other pages, and what to change on yours | Free |
| `seopen-local-audit` | Google Maps rankings, your listing and your site's local details | Free, setup asks first |

### Fix and write

| Skill | What it does | Cost |
|---|---|---|
| `seopen-fix` | Fixes the issues SEOpen found by changing the code in your repo on a branch, runs your build, and records each fix so SEOpen can check and measure it | Free |
| `seopen-optimize-page` | Improves one page for the searches it already shows for, edited in place, and logs the change to be measured | Free; live results are quoted first |
| `seopen-write` | Writes a new page from a content brief with only facts you can stand behind, links it from related pages and logs it | Free on saved briefs; a new brief is quoted first |
| `seopen-vs-pages` | Fair comparison and alternatives pages, every competitor fact sourced and dated | Search volume is quoted first |
| `seopen-internal-links` | Adds links to the pages that matter from related pages with traffic | Free |
| `seopen-indexing` | Finds why pages aren't in Google, fixes the causes in code, and tells Bing | Free |
| `seopen-facts` | Keeps `seo/facts.md`, the prices, limits and features the writing skills use | Free |
| `seopen-migration` | Moves URLs or a domain with a full redirect map, checked live | Free; a backlinks lookup is quoted first |
| `seopen-preflight` | Checks a branch for SEO mistakes before it ships | Free, works without SEOpen |

### Run on a schedule

| Skill | What it does | Cost |
|---|---|---|
| `seopen-autopilot` | Each run checks earlier changes and alerts, then ships at most one change as a pull request for you to review | Free unless you set a monthly credit cap |

### Report

| Skill | What it does | Cost |
|---|---|---|
| `seopen-weekly-review` | A one-page review with three things to do | Free |
| `seopen-client-report` | A monthly report for a client or boss as one HTML file | Free |

## Sign in

Run `/mcp`, choose `seopen` and **Authenticate**. SEOpen opens in your browser: sign in and choose what Claude may do. It can always read. Making changes and spending research credits are off unless you tick them. There's no key to make. Then run `/seopen:seopen-setup` to check it works.

## What it does with your data

- The plugin talks to one server, `https://app.getseopen.com/api/mcp`, over the connection you sign in to. Claude sends that server what each tool call needs, such as a project, a keyword, a page address, or the commit, file names and note of a change you record. It reads your SEOpen workspace's SEO data back.
- The skills read and edit files in the repository you're working in. The plugin doesn't upload the repository.
- Some skills have Claude read public web pages: your own site (to check redirects, pages, robots.txt and sitemaps), and for teardowns, comparison pages and citations, other public sites. Those sites see an ordinary request.
- `seopen-autopilot` and other skills that commit or open a pull request use your own git and hosting tools, on a branch, as their steps say.
- It ships no scripts, programs or hooks: only Markdown instructions, icons and the server's address. The instructions have Claude run your project's own commands, such as its build and tests, git, and curl for checking pages, with the permissions you give it.
- It needs no key, and no step asks for one.

SEOpen's [privacy policy](https://getseopen.com/privacy) covers what the server keeps. You can disconnect the plugin at any time at https://app.getseopen.com/agents.

## Help

- Docs: https://getseopen.com/docs/agents/plugin
- Support: hello@getseopen.com
- Source: https://github.com/SEOpen/seopen-agent
