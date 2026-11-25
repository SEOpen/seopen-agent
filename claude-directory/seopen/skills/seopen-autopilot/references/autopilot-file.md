# The autopilot file: `seo/autopilot.md`

This file holds the user's setup answers and a short run log. Everything else, such as what was changed, whether it went live and what it did, lives in SEOpen and is read from there on every run. Never copy SEOpen's numbers into this file: they go stale.

Never write a key, token, password or anything secret into it. It is committed to the repo.

## Format

```markdown
# SEO autopilot: <site name> (<domain>)

Set up: 2026-11-18 by the owner. Change any line below by editing it, or ask the agent.

## Setup

- Project: <domain> (SEOpen project <id>)
- Business type: <local service | software | online store | other>
- Money pages: /pricing, /services/roof-repair
- Conversion: <what counts, such as "a quote form sent" or "a trial started", and where it's measured, such as the GA4 key event "generate_lead">
- Ship mode: pr
- Monthly research-credit cap: 0
- Weekly report: Monday
- Schedule: <how it runs, such as "Claude Code /schedule, daily at 07:00 UTC">
- Status: active

## Run log

- 2026-11-18 | setup | Wrote this file and seo/facts.md. Alert rules left on. | ids: none | credits: 0
- 2026-11-19 | shipped | Shortened titles on 4 product pages (PR #31) | ids: 412, 413, 414, 415 | credits: 0
```

## The setup lines

- **Project**: the SEOpen project's domain and id, from `list_projects`.
- **Business type**: one of the four. It decides what money pages usually are and how advice is worded.
- **Money pages**: paths of the pages that earn the business money, as the user names them. Never guess these.
- **Conversion**: in the user's words. If they don't track one, write `not tracked`.
- **Ship mode**: one of:
  - `pr`: push a branch and open a pull request for the user to review. The default.
  - `branch`: commit on a local branch and stop. For repos with no remote or no way to open a pull request.
  - `merge-on-green`: open a pull request and merge it once every check passes. Only when the user has said, in their own words, that they want this.
- **Monthly research-credit cap**: a whole number. `0` means autopilot never spends credits. The cap is compared with the workspace's credits used this month as `get_usage` reports them, which includes the user's own lookups, so autopilot stops early rather than late.
- **Weekly report**: the day of the week for the weekly report.
- **Schedule**: how the runs are started, so the user can find and stop it.
- **Status**: `active` or `paused`. A paused autopilot only reads, and reports that it's paused.

## The run log

One line per run that commits something, newest last, in this order, split by ` | `:

1. The date, as YYYY-MM-DD.
2. What happened: `setup`, `shipped`, `failed`, `stopped`.
3. One plain sentence: what changed, on which pages, and the pull request number or branch.
4. `ids:` the ids from `record_change` or the fix ids passed to `mark_fix_applied`, or `none`.
5. `credits:` research credits this run spent, from the prices it confirmed.

The log line goes in the same commit as the change, so it lands when the change does. A run that ships nothing doesn't commit, so it doesn't add a line: its report is its record. Keep the log to the last 100 lines; delete older ones, since SEOpen keeps the full history.
