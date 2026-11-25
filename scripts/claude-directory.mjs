// Builds the copy of the plugin that Claude's plugin directory follows: node scripts/claude-directory.mjs
//
// The directory takes scripts only from Verified organizations, and its check reads a key variable, or
// prose such as "pass `urls`" (like the pass password command), as a credential. So this copy is
// plugins/seopen without its two scripts, the Codex files and the key steps, and the skills that used
// a script do the same checks from written steps. Edit plugins/seopen or the texts in
// claude-directory/overrides, never claude-directory/seopen. skills.test.ts checks the copy is current.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.join(import.meta.dirname, "..");
const SOURCE = path.join(root, "plugins/seopen");
const OVERRIDES = path.join(root, "claude-directory/overrides");
export const OUT = path.join(root, "claude-directory/seopen");

const LEFT_OUT = [/^\.codex/, /\/scripts\//];
const override = (name) => readFileSync(path.join(OVERRIDES, name), "utf8");

/** Replaces text that must be in the skill exactly once, so a changed skill fails here instead of shipping half edited. */
function swap(text, from, to) {
  const count = text.split(from).length - 1;
  if (count !== 1) throw new Error(`Expected once, found ${count} times: ${from.slice(0, 80)}`);
  return text.replace(from, () => to);
}

/** Replaces from one heading up to the next. */
function swapSection(text, heading, nextHeading, body) {
  const start = text.indexOf(`\n${heading}\n`);
  const end = text.indexOf(`\n${nextHeading}\n`);
  if (start < 0 || end < start) throw new Error(`No section from "${heading}" to "${nextHeading}".`);
  return `${text.slice(0, start + 1)}${body.trimEnd()}\n${text.slice(end)}`;
}

const EDITS = {
  "README.md": () => override("README.md"),

  // The directory shows "Seopen" without a display name, and reads the support link from the README without one.
  ".claude-plugin/plugin.json": (t) =>
    swap(t, '  "name": "seopen",\n', '  "name": "seopen",\n  "displayName": "SEOpen",\n  "supportUrl": "https://getseopen.com/docs/agents/plugin",\n'),

  "skills/seopen-internal-links/SKILL.md": (t) => {
    t = swap(t, "Needs the SEOpen MCP server, git, Node 18 or later, and the site's source code.", "Needs the SEOpen MCP server, git, and the site's source code.");
    t = swap(t, "Links there sit on every page and the script counts them apart.", "Links there sit on every page, so count them apart.");
    t = swap(t, "say the script wasn't written for it and go on only if the user wants to.", "say this skill wasn't written for it and go on only if the user wants to.");
    t = swapSection(t, "## 3. Build the link graph", "## 4. Join it with SEOpen's data", override("internal-links-step-3.md"));
    t = swap(t, "Run the script again into a second file and give a table, one row per target:", "Count the links to each target again, the same way as in step 3, and give a table, one row per target:");
    t = swap(t, "Take before and after from the two runs' `inbound`, not from your own count.", "Take before and after from the two counts' `inbound`, not from how many links you added.");
    return swap(t, "The money pages the user confirmed, and the script's summary line.", "The money pages the user confirmed, how many candidates you counted links for, and which pages you didn't check.");
  },

  "skills/seopen-migration/SKILL.md": (t) => {
    t = swap(t, "Needs git, bash, curl and this site's source code.", "Needs git, curl and this site's source code.");
    t = swap(
      t,
      "with [scripts/verify-redirects.sh](scripts/verify-redirects.sh), which is in this skill's folder: from the repo root, `BASE_URL=http://localhost:3000 bash <skill folder>/scripts/verify-redirects.sh seo/redirect-map.csv`. `BASE_URL` swaps in the test host for both columns on a same-domain move.",
      "as [references/check-redirects.md](references/check-redirects.md) shows, for every row of `seo/redirect-map.csv`. Use the test host in place of the old URL's, and of the new URL's on a same-domain move.",
    );
    t = swap(
      t,
      "Run `bash <skill folder>/scripts/verify-redirects.sh seo/redirect-map.csv` against production, without `BASE_URL`. Use `MAX_HOPS=2` only when the host forces http to https first and the map's old URLs are http.",
      "Check every row of `seo/redirect-map.csv` against production, as [references/check-redirects.md](references/check-redirects.md) shows. Allow two hops only when the host forces http to https first and the map's old URLs are http.",
    );
    t = swap(t, "The script's result on the test build, and preflight's result.", "The redirect check's result on the test build, and preflight's result.");
    return swap(t, "After launch: the script's table on production,", "After launch: the redirect check's table on production,");
  },

  "skills/seopen-migration/references/redirects.md": (t) =>
    swap(t, "put the redirects in the host's own file below and check them with the script.", "put the redirects in the host's own file below and check them as [check-redirects.md](check-redirects.md) shows."),

  "skills/seopen-setup/SKILL.md": (t) => {
    t = swap(
      t,
      "The Claude Code and Codex plugins and the Claude and ChatGPT connectors sign in with OAuth and need no key; a server added by hand can use a key instead.",
      "The plugin signs in with OAuth and needs no key.",
    );
    t = swap(
      t,
      "- If the server was added by hand with a key (`claude mcp add ... --header`, Cursor, a Codex `config.toml` entry), go to step 2.\n",
      "- If the server was added by hand with a key, the steps for it are at https://getseopen.com/docs/agents/connect. The user follows them outside this chat.\n",
    );
    t = swap(
      t,
      "  - Not installed: the user runs `/plugin marketplace add SEOpen/seopen-agent`, then `/plugin install seopen@seopen`, then `/reload-plugins`.\n",
      "  - Not installed: the user installs SEOpen from Claude's plugin directory, then runs `/reload-plugins`.\n",
    );
    t = swap(
      t,
      "- In Codex, ask the user to run `codex plugin list` to see whether `seopen` is installed, and `codex mcp list` to see whether its server is signed in.\n  - Not installed: the user runs `codex plugin marketplace add SEOpen/seopen-agent`, then `codex plugin add seopen@seopen`.\n  - Installed but \"Not logged in\": the user runs `codex mcp login seopen` and signs in to SEOpen in the browser.\n",
      "",
    );
    t = swap(t, "sign in with OAuth (Claude Code, Codex, claude.ai, Claude Desktop)", "sign in with OAuth (Claude Code, claude.ai, Claude Desktop)");
    t = swap(t, "if `whoami` answers, the connection works. Go to step 3.", "if `whoami` answers, the connection works. Go to step 2.");
    const start = t.indexOf("## 2. A server added by hand with a key");
    const end = t.indexOf("## 3. See what's there");
    if (start < 0 || end < start) throw new Error("seopen-setup: the key step moved.");
    t = t.slice(0, start) + t.slice(end);
    t = swap(t, "## 3. See what's there", "## 2. See what's there");
    t = swap(t, "## 4. Hand over", "## 3. Hand over");
    return swap(t, "on which plan, signed in with OAuth or with which key.", "and on which plan.");
  },
};

/** Prose the check reads as the pass command. */
function everySkill(text) {
  return text.replace(/\b([Pp])ass `/g, (_, p) => (p === "P" ? "Send `" : "send `"));
}

/** Every file of the copy: relative path to contents. */
export function build() {
  const out = new Map();
  for (const entry of readdirSync(SOURCE, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || entry.name === ".DS_Store") continue;
    const full = path.join(entry.parentPath, entry.name);
    const file = path.relative(SOURCE, full).split(path.sep).join("/");
    if (LEFT_OUT.some((re) => re.test(file))) continue;
    if (!file.endsWith(".md") && !EDITS[file]) {
      out.set(file, readFileSync(full));
      continue;
    }
    const text = readFileSync(full, "utf8");
    const edited = EDITS[file] ? EDITS[file](text) : text;
    out.set(file, Buffer.from(file.startsWith("skills/") ? everySkill(edited) : edited));
  }
  for (const file of Object.keys(EDITS)) if (!out.has(file)) throw new Error(`${file} is edited here but isn't in the plugin.`);
  out.set("skills/seopen-migration/references/check-redirects.md", Buffer.from(override("check-redirects.md")));
  out.set("LICENSE", readFileSync(path.join(root, "LICENSE")));
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = build();
  rmSync(OUT, { recursive: true, force: true });
  for (const [file, contents] of files) {
    mkdirSync(path.dirname(path.join(OUT, file)), { recursive: true });
    writeFileSync(path.join(OUT, file), contents);
  }
  console.log(`${files.size} files in ${path.relative(root, OUT)}`);
}
