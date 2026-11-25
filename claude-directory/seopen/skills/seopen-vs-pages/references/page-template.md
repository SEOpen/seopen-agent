# Comparison and alternatives pages: the template

Two kinds of page, one set of rules. Every competitor fact on either page has a source URL and the date you read it. Every fact about the user's own product comes from `seo/facts.md`.

## Page 1: "<Us> vs <Them>"

For a buyer who has narrowed it down to two. URL such as `/vs/<them>` or `/compare/<us>-vs-<them>`; copy the pattern the site already uses.

Title: "<Us> vs <Them>: <the one difference that matters most>". Keep it 30 to 60 characters. The H1 can be just "<Us> vs <Them>".

### 1. The verdict (two sentences, at the top)

- Sentence one: when <Them> is the better choice, and for whom. Start with it.
- Sentence two: when <Us> is the better choice, and for whom.
- Both sentences rest on facts in the table below. No adjectives without a fact behind them.

Example shape, not text to copy: "<Them> is the better pick if you need <thing they do that we don't>. <Us> suits <who> who want <thing from facts.md>, at <price from facts.md>."

### 2. The differences (a table)

Only rows where the two differ, or where buyers ask. A row both products get the same answer on is noise; leave it out unless buyers ask about it.

| | <Us> | <Them> | Source |
|---|---|---|---|
| Entry price | $X a month (facts.md) | $Y a month | <their pricing URL>, checked YYYY-MM-DD |
| <Limit people compare> | ... | ... | ... |
| <Feature> | ... | ... | ... |

- Write "Not listed on their site" when you can't find a figure. Never guess, never leave a blank that reads as "no".
- Write "Yes", "No" or the number. Ticks and crosses alone hide the detail.
- If a figure comes from a review or aggregator site because the vendor doesn't publish it, say so in the cell: "About $Y a month (from <site>, not <Them>'s own page)".

### 3. What it costs at three sizes

Three sizes a real buyer of this kind of product would be. Pick them from what the plans' limits are about: seats, projects, keywords, orders, locations. For example, for a tool priced by users: 1 user, 5 users, 20 users.

For each size, on each side: the cheapest published plan that covers it, its published price, and the sum, written out.

> 5 users on <Them>: Team plan, $20 a user a month, 5 × $20 = $100 a month (<pricing URL>, checked YYYY-MM-DD).

- Use only published prices and published limits. No discounts you can't see, no "about", no estimate of hidden costs.
- Say whether a price is monthly or billed yearly, as each site says it.
- If a size isn't covered by any published plan ("contact sales"), say that instead of a number.

### 4. How to switch

The real steps to move from <Them> to <Us>: export, import, what carries over, what doesn't. Only steps the user's product actually supports (facts.md or the repo's docs). If you don't know what carries over, ask the user.

### 5. Where <Them> is better (required)

A heading such as "When <Them> is the better choice". At least two specific, sourced points. This section is never empty and never a backhanded compliment ("if you don't mind paying more"). If you can't find anything <Them> does better, you haven't looked hard enough; ask the user what customers who chose <Them> said.

### 6. FAQ

Five to eight questions phrased the way buyers type them: "Is <Them> free?", "Can I import my data from <Them>?", "Is <Us> cheaper than <Them>?". Take them from Search Console queries, People also ask, or the user. Each answer opens with the direct answer and stands on its own. FAQ structured data only if the site already uses it.

### Footer line

"Facts about <Them> were checked on <their pages> on YYYY-MM-DD. Prices and features change; tell us if something here is out of date." With a contact link if the site has one.

## Page 2: "<Them> alternatives"

For a buyer leaving <Them> who hasn't picked a replacement. URL such as `/alternatives/<them>`.

Title: "<Them> alternatives: <number> options compared" or similar, using the number of real options on the page.

### 1. The answer (two sentences)

Who should stay on <Them>, and the main reasons people look elsewhere (only the recurring ones from your research). Then that the page compares <number> options.

### 2. Why people switch

Only reasons that recur: three or more independent public sources (reviews, forums, community threads) from the last 12 months. Each written as a plain fact with its sources: "Several reviewers on <site> and <site> say <Them> raised the price of <plan> in <month year>." No insults, no "nightmare", no guessing at motives.

### 3. The options

Four to eight real products, the user's among them. For each:

- who it suits, in one sentence;
- its entry price, with the source and date;
- one or two real strengths and one real limit;
- a link to its site (plain text link, no logo styling).

Place the user's product honestly. Not automatically first: put it where it fits the buyer the page is for, and say who it isn't for. A list where the author's product wins every row reads as an ad.

### 4. A summary table

| Option | Best for | Entry price | Source, date checked |
|---|---|---|---|

### 5. How to choose

Three or four questions that decide it ("Do you need X?", "How many Y?"), each pointing to the options that answer it.

### 6. FAQ and footer line

As on page 1.

## The claims table

Keep this table for every competitor fact you use, in the commit, the PR description, or a comment the user can see. On SEOpen's own site the same facts go in `src/content/competitors/<slug>.ts`; elsewhere a one-line summary per competitor goes in the Competitors section of `seo/facts.md`.

| Claim | Source URL | Date checked | Kind |
|---|---|---|---|
| Team plan is $20 a user a month, billed yearly | https://them.example/pricing | 2026-11-18 | vendor page |
| Free plan allows 3 projects | https://them.example/pricing | 2026-11-18 | vendor page |
| Users report <complaint> | <url 1>, <url 2>, <url 3> | 2026-11-18 | recurring review theme |

- **Kind** is `vendor page` (read on the competitor's own site), `third-party` (a review or aggregator, because the vendor publishes nothing), or `recurring review theme` (three or more independent sources, all from the last 12 months).
- Every row was read today on the live page. A fact from memory, an old screenshot or a cached copy doesn't go in.
- Recheck every row after 90 days. A row older than that is out of date: recheck it or take the claim off the page.

## Fair-claims checklist (before you commit)

- Every competitor fact has a row in the claims table, dated today.
- Pricing math uses only published prices, with the arithmetic shown.
- "Where <Them> is better" is there and specific.
- No competitor logo, colours, fonts or trademark styling. Their name in plain text only.
- Nothing suggests <Them> endorses, partners with or approved the page.
- No review complaint that fewer than three independent recent sources share.
- No insult, sarcasm or guess at the competitor's motives.
- Every fact about the user's product is in `seo/facts.md` and not marked `[unconfirmed]`.
