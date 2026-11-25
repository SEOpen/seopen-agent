# Check the redirect map

Check every row of `seo/redirect-map.csv`, whose columns are `old_url,new_url`. Skip the header, blank lines and lines that start with `#`. A `new_url` that is only a path is read against the old URL's host.

Ask for the old URL without following redirects. This prints the status and where it points:

```bash
curl -sS -o /dev/null --max-time 20 -w '%{http_code} %{redirect_url}\n' https://example.com/old-page
```

A row passes when all four are true:

1. The first answer is a 301 or 308. A 302, 307, 200 or 404 fails.
2. The address it points to is exactly `new_url`.
3. It gets there in one redirect. If the host sends http to https first and the old URL is http, two are allowed, and each must be a 301 or 308.
4. `new_url` itself answers 200, asked the same way. Another redirect or an error fails.

To test a build before launch, use the test host in the old URL, such as `http://localhost:3000`. On a move within one domain, use it in `new_url` too.

Give a table with one row per redirect: ok or FAIL, the first status, the number of redirects, the final status, the old URL, and what went wrong. End with how many were checked, how many passed and how many failed. Work in batches on a long map, but check every row: a sample can't show that the map is right. No answer at all is a failure, so say so and don't guess why.
