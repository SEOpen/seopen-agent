# The facts file: format and an example

`seo/facts.md` is read by `seopen-write`, `seopen-optimize-page`, `seopen-vs-pages` and `seopen-autopilot`. They find facts by these headings, so keep the title line, the `Last checked:` line and the nine section names exactly as below, in this order. Don't rename, merge, split or add sections. A section with nothing in it stays, empty.

## The format

```markdown
# Facts: <site name> (<domain>)

Last checked: 2026-11-18

## What it is
## Who it's for
## Plans and prices
## Limits
## Features
## Integrations
## What it doesn't do
## Proof
## Competitors
```

Rules for the lines under each heading:

- One fact per bullet, ending in its source: `- The Basic plan is $12 a month, billed monthly. (source: src/pricing.ts, checked 2026-11-18)`.
- A source is one of three things: a repo path, a URL on the site, or `the owner, 2026-11-18` (the date they said it).
- A fact nobody has confirmed starts with `[unconfirmed]`. Writing skills don't use it until the user confirms it.
- `Last checked:` is the day someone last compared the file with the repo and the live site.
- **Proof** holds what only this site can say: real numbers, results, customer stories the owner approved, and screenshots with their path. Each with its source.
- **Competitors** holds one line per competitor: name, domain, and what the site says about them, with a source and date. Detailed comparisons live in the comparison pages, not here.
- Sections may be empty. Never fill a gap with a guess.
- Never put in credentials, keys, customers' personal details, or revenue and other private figures the owner hasn't approved for publishing. The file is committed and anyone with the repo can read it.

## Example

Everything below is made up to show the format. The business, the domains, the files and the numbers don't exist. Never copy a fact from it into a real file.

```markdown
# Facts: Example Oak Desks (example.com)

Last checked: 2026-11-18

## What it is
- A two-person workshop that makes solid oak desks to order. (source: src/content/pages/about.md, checked 2026-11-18)
- Each desk is made by hand in the workshop, not bought in. (source: the owner, 2026-11-18)

## Who it's for
- People buying one desk for a home office. (source: https://example.com/about, checked 2026-11-18)
- [unconfirmed] Small offices buying several desks at once. (source: src/content/pages/trade.md mentions "orders of five or more", checked 2026-11-18)

## Plans and prices
- The standard desk is £1,200, including delivery. (source: src/data/products.json, checked 2026-11-18)
- A drawer adds £150. (source: src/data/products.json, checked 2026-11-18)

## Limits
- Desks are made 100 to 200 cm wide and 60 to 90 cm deep. (source: src/data/options.json, checked 2026-11-18)
- Delivery is to mainland UK addresses only. (source: https://example.com/delivery, checked 2026-11-18)

## Features
- Desks ship six weeks after the order. (source: https://example.com/delivery, checked 2026-11-18)
- Every desk comes with a 10-year guarantee. (source: src/content/pages/guarantee.md, checked 2026-11-18)
- You pick the width, the depth and the finish. (source: src/data/options.json, checked 2026-11-18)

## Integrations

## What it doesn't do
- No ready-made desks: every desk is made after the order. (source: the owner, 2026-11-18)
- No woods other than oak. (source: src/data/options.json, checked 2026-11-18)
- No delivery outside mainland UK. (source: https://example.com/delivery, checked 2026-11-18)

## Proof
- 140 desks delivered since the workshop opened in 2019. (source: the owner, 2026-11-18)
- Photo of the workshop bench with a desk in progress. (source: public/images/workshop-bench.jpg, the owner approved it 2026-11-18)

## Competitors
- Another Desk Co (example.org): sells flat-pack desks; the site says ours arrive built. (source: https://example.com/why-oak, checked 2026-11-18)
```

In the example, the trade line is `[unconfirmed]` because a page hints at it but nobody has said the business does it. **Integrations** is empty because a workshop has none, and it stays as a heading anyway.
