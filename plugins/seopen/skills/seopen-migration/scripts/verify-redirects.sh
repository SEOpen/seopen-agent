#!/usr/bin/env bash
# Check a redirect map against a live site.
#
# Usage: verify-redirects.sh redirects.csv
#
# The CSV has two columns, old_url,new_url, one redirect per line. A header line
# (old_url,new_url) and blank lines are skipped, and so are lines starting with #.
# new_url may be a path such as /blog/post; it is read against old_url's host.
#
# For each row it checks:
#   1. the first response is a 301 or 308;
#   2. the redirect lands on new_url (a relative Location is resolved first);
#   3. it takes at most MAX_HOPS redirects to get there (default 1);
#   4. new_url itself answers 200, not another redirect or an error.
#
# Set MAX_HOPS=2 for a host that sends http to https first and then redirects.
# Set BASE_URL (such as http://localhost:3000 or a preview URL) to test a build
# before launch: it replaces old_url's scheme and host, and new_url's when new_url
# is on the same host as old_url.
# Every hop must be a 301 or 308. Prints a table and exits 1 if any row fails,
# 2 on bad usage. Needs only bash and curl.

set -u

MAX_HOPS="${MAX_HOPS:-1}"
TIMEOUT="${TIMEOUT:-20}"
BASE_URL="${BASE_URL:-}"
BASE_URL="${BASE_URL%/}"
UA="${UA:-Mozilla/5.0 (compatible; verify-redirects/1.0)}"

if [ "$#" -ne 1 ] || [ ! -r "$1" ]; then
  echo "Usage: $0 redirects.csv   (columns: old_url,new_url)" >&2
  exit 2
fi
case "$MAX_HOPS" in
  1 | 2 | 3) ;;
  *) echo "MAX_HOPS must be 1, 2 or 3." >&2; exit 2 ;;
esac

# One request, no following. Prints "status<TAB>absolute Location" (Location empty when none).
probe() {
  curl -sS -o /dev/null --max-time "$TIMEOUT" -A "$UA" \
    -w '%{http_code}\t%{redirect_url}' "$1" 2>/dev/null || printf '000\t'
}

# scheme://host of a URL.
origin_of() {
  printf '%s' "$1" | sed -E 's#^([A-Za-z][A-Za-z0-9+.-]*://[^/?#]+).*#\1#'
}

trim() {
  local s="$1"
  s="${s%$'\r'}"
  s="${s#"${s%%[![:space:]]*}"}"
  s="${s%"${s##*[![:space:]]}"}"
  s="${s#\"}"
  s="${s%\"}"
  printf '%s' "$s"
}

rows=0
failed=0
out=""
sep=$'\t'

while IFS= read -r line || [ -n "$line" ]; do
  line="$(trim "$line")"
  [ -z "$line" ] && continue
  case "$line" in \#*) continue ;; esac
  old="$(trim "${line%%,*}")"
  new="$(trim "${line#*,}")"
  [ "$old" = "old_url" ] && continue
  if [ "$old" = "$line" ] || [ -z "$new" ]; then
    out="${out}FAIL${sep}-${sep}-${sep}-${sep}$line${sep}not two columns"$'\n'
    rows=$((rows + 1)); failed=$((failed + 1))
    continue
  fi
  case "$new" in /*) new="$(origin_of "$old")$new" ;; esac
  if [ -n "$BASE_URL" ]; then
    from="$(origin_of "$old")"
    case "$new" in "$from" | "$from"/* | "$from"\?*) new="$BASE_URL${new#"$from"}" ;; esac
    old="$BASE_URL${old#"$from"}"
  fi
  rows=$((rows + 1))

  url="$old"
  hops=0
  first=""
  detail=""
  ok=1
  while :; do
    res="$(probe "$url")"
    code="${res%%$'\t'*}"
    loc="${res#*$'\t'}"
    [ -z "$first" ] && first="$code"
    case "$code" in
      301 | 308) ;;
      000) detail="no answer from $url"; ok=0; break ;;
      *)
        if [ "$hops" -eq 0 ]; then detail="no permanent redirect: got $code"; else detail="ends at $url ($code), expected $new"; fi
        ok=0; break ;;
    esac
    hops=$((hops + 1))
    if [ -z "$loc" ]; then detail="$code with no Location"; ok=0; break; fi
    if [ "$loc" = "$new" ]; then break; fi
    if [ "$hops" -ge "$MAX_HOPS" ]; then
      detail="goes to $loc after $hops hop(s), expected $new"
      ok=0; break
    fi
    url="$loc"
  done

  final="-"
  if [ "$ok" -eq 1 ]; then
    res="$(probe "$new")"
    final="${res%%$'\t'*}"
    floc="${res#*$'\t'}"
    if [ "$final" != "200" ]; then
      ok=0
      case "$final" in
        3??) detail="new_url redirects again ($final to $floc)" ;;
        000) detail="no answer from new_url" ;;
        *) detail="new_url answers $final" ;;
      esac
    fi
  fi

  if [ "$ok" -eq 1 ]; then result="ok"; else result="FAIL"; failed=$((failed + 1)); fi
  out="$out$result${sep}$first${sep}$hops${sep}$final${sep}$old${sep}$detail"$'\n'
done < "$1"

{
  printf '%s\t%s\t%s\t%s\t%s\n' "result" "first" "hops" "final" "old_url  (detail)"
  printf '%s' "$out"
} | while IFS=$'\t' read -r r f h fs o d; do
  if [ -n "$d" ]; then printf '%-6s %-5s %-4s %-5s %s  (%s)\n' "$r" "$f" "$h" "$fs" "$o" "$d"
  else printf '%-6s %-5s %-4s %-5s %s\n' "$r" "$f" "$h" "$fs" "$o"; fi
done

echo
echo "$rows checked, $((rows - failed)) ok, $failed failed (MAX_HOPS=$MAX_HOPS)."
[ "$failed" -eq 0 ]
