# SEOpen plugin

Skills and the MCP connection for [SEOpen](https://getseopen.com): 25 skills in four groups.

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

Install it in Claude Code:

```
/plugin marketplace add SEOpen/seopen-agent
/plugin install seopen@seopen
```

Or in Codex, which signs in with OAuth:

```bash
codex plugin marketplace add SEOpen/seopen-agent
codex plugin add seopen@seopen
codex mcp login seopen
```

The [repository README](../../README.md) covers signing in and other agents.
