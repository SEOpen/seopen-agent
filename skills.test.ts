import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { build, OUT } from "./scripts/claude-directory.mjs";

// The plugin's skills and manifests: frontmatter Claude.ai accepts, shared references copied unchanged,
// only tool names the MCP server registers, and Claude Code and Codex manifests that agree.
// Paths are relative to this file. The MCP server lives in the app's repo, SEOpen/seopen: SEOPEN_DIR
// names a checkout of it (CI makes one); unset, it's a clone named seopen next to this repo's folder.
const root = import.meta.dirname;
const SKILLS_DIR = path.join(root, "plugins/seopen/skills");
const SHARED_DIR = path.join(root, "shared/references");
const APP_DIR = process.env.SEOPEN_DIR ? path.resolve(process.env.SEOPEN_DIR) : path.join(root, "../seopen");
const MCP_DIR = path.join(APP_DIR, "src/lib/mcp");

/** Claude.ai uploads reject a skill with any other frontmatter field. */
const ALLOWED_FIELDS = ["name", "description", "license", "compatibility", "metadata", "allowed-tools"];

/**
 * Backticked snake_case words in the skills that are fields, arguments or values in tool results,
 * not tool names. Each one is real: it appears in a skill and in the server's code. Add to this
 * list only for a name like that, never to let a missing tool through.
 */
const NOT_TOOLS = new Set([
  // Arguments.
  "linked_from",
  "max_credits",
  "prompt_id",
  "url_contains",
  // Fields in tool results.
  "ai_assistants",
  "best_position",
  "blocked_because",
  "compared_with",
  "competitors_named",
  "credits_left",
  "credits_spent",
  "credits_unlimited",
  "first_step",
  "latest_result",
  "likely_files",
  "link_rank",
  "needs_approval",
  "on_project_domain",
  "own_sites_hidden",
  "page_now",
  "page_type",
  "proposed_change",
  "rank_place",
  "recent_results",
  "searches_in_range",
  "share_of_voice",
  "spam_hidden",
  "spam_score",
  "top_cited_domains",
  "top_queries",
  "top_query",
  "top_results_headings",
  "under_90_days",
  "url_is_origin_only",
  "why_it_matters",
  "without_us",
  "words_missing",
  // list_fixes rows (fixSummary in src/modules/fixes/queries.ts).
  "applied_commit",
  "applied_note",
  "applied_on",
  "live_check",
  // Freshness flags (src/lib/mcp/data.ts).
  "last_run_failed",
  "needs_a_look",
  "rank_not_confirmed",
  // get_page_refresh and serp (src/lib/mcp/research-tools.ts).
  "main_search",
  "owned_by",
  "page_type_mismatch",
  "page_type_reliable",
  "page_types",
  // get_indexing and inspect_url (src/lib/mcp/indexing.ts, inspect.ts).
  "canonicals_match",
  "crawled_as",
  "crawler_access",
  "fix_first",
  "google_canonical",
  "inspection_link",
  "last_crawl",
  "not_indexed",
  "now_indexed",
  "page_canonical",
  "page_fetch",
  "pages_listed",
  "request_indexing",
  "robots_txt",
  "search_console",
  // verify_fix statuses.
  "cannot_check",
  "page_broken",
  "still_there",
]);

const rel = (p: string) => path.relative(root, p);
const files = (dir: string) => (existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => path.join(dir, e.name)) : []);
const skills = readdirSync(SKILLS_DIR, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
const skillFile = (skill: string) => path.join(SKILLS_DIR, skill, "SKILL.md");
const referenceFiles = (skill: string) => files(path.join(SKILLS_DIR, skill, "references"));

/** Top-level keys between the opening and closing `---`, or null when there's no frontmatter. */
function frontmatter(text: string): { keys: string[]; name: string | undefined } | null {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!match) return null;
  const lines = match[1].split("\n");
  const keys = lines.flatMap((l) => /^([a-z-]+):/.exec(l)?.[1] ?? []);
  const name = lines.find((l) => l.startsWith("name:"))?.slice("name:".length).trim();
  return { keys, name };
}

/** Every tool the MCP server registers, read from `registerTool(` calls, which may break the line before the name. */
function registeredTools(dir: string): Set<string> {
  const names = new Set<string>();
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".ts") || entry.name.endsWith(".test.ts")) continue;
    const text = readFileSync(path.join(entry.parentPath, entry.name), "utf8");
    for (const [, name] of text.matchAll(/registerTool\(\s*"([a-z0-9_]+)"/g)) names.add(name);
  }
  return names;
}

/** Backticked words that look like tool names: lower snake_case with at least one underscore. */
const toolLikeNames = (text: string) => [...text.matchAll(/`([a-z][a-z0-9]*(?:_[a-z0-9]+)+)`/g)].map(([, name]) => name);

describe("skill frontmatter", () => {
  it("finds the skills", () => {
    expect(skills.length).toBeGreaterThan(0);
  });

  it("uses only the six fields Claude.ai accepts, with name matching the folder", () => {
    for (const skill of skills) {
      const fm = frontmatter(readFileSync(skillFile(skill), "utf8"));
      expect(fm, `${skill}: no frontmatter`).not.toBeNull();
      for (const key of fm!.keys) expect(ALLOWED_FIELDS, `${skill}: frontmatter field "${key}"`).toContain(key);
      expect(fm!.name, `${skill}: name`).toBe(skill);
    }
  });

  it("quotes any value that holds a colon and a space or a space and a #, which break YAML", () => {
    for (const skill of skills) {
      const [, block] = /^---\n([\s\S]*?)\n---\n/.exec(readFileSync(skillFile(skill), "utf8"))!;
      for (const line of block.split("\n")) expect(line, `${skill}: quote this value`).not.toMatch(/^[a-z-]+: (?!["']).*(?:: | #)/);
    }
  });
});

describe("shared references", () => {
  it("keeps every copy in a skill byte-identical to shared/references", () => {
    for (const shared of files(SHARED_DIR)) {
      const original = readFileSync(shared);
      for (const skill of skills) {
        const copy = path.join(SKILLS_DIR, skill, "references", path.basename(shared));
        if (!existsSync(copy)) continue;
        expect(readFileSync(copy).equals(original), `${rel(copy)} differs from ${rel(shared)}: copy the shared file over it`).toBe(true);
      }
    }
  });
});

describe("tools named in skills", () => {
  if (!existsSync(MCP_DIR)) throw new Error(`No MCP server at ${MCP_DIR}. Set SEOPEN_DIR to a checkout of SEOpen/seopen.`);
  const tools = registeredTools(MCP_DIR);
  const docs = [...skills.flatMap((s) => [skillFile(s), ...referenceFiles(s)]), ...files(SHARED_DIR)];

  it("reads the server's tools", () => {
    expect(tools.size).toBeGreaterThan(0);
    expect(tools).toContain("record_change");
  });

  it("names only tools the server registers", () => {
    for (const doc of docs) {
      for (const name of toolLikeNames(readFileSync(doc, "utf8"))) {
        if (NOT_TOOLS.has(name)) continue;
        expect(tools, `${rel(doc)} names \`${name}\`, which src/lib/mcp doesn't register`).toContain(name);
      }
    }
  });

  it("keeps the not-a-tool list honest: each name is used in a skill and isn't a tool", () => {
    const used = new Set(docs.flatMap((doc) => toolLikeNames(readFileSync(doc, "utf8"))));
    for (const name of NOT_TOOLS) {
      expect(used, `${name} is in NOT_TOOLS but no skill uses it`).toContain(name);
      expect(tools, `${name} is in NOT_TOOLS but is a registered tool`).not.toContain(name);
    }
  });
});

describe("plugin manifests", () => {
  const PLUGIN_DIR = path.join(root, "plugins/seopen");
  const read = (file: string) => JSON.parse(readFileSync(path.join(PLUGIN_DIR, file), "utf8"));
  const claude = read(".claude-plugin/plugin.json");
  const codex = read(".codex-plugin/plugin.json");

  it("gives Claude Code and Codex the same name, version and description", () => {
    expect(codex.name).toBe(claude.name);
    expect(codex.version, "bump both manifests together").toBe(claude.version);
    expect(codex.description).toBe(claude.description);
  });

  it("points every icon, skills folder and MCP file at something that exists", () => {
    const paths = [claude.icon, codex.skills, codex.mcpServers, ...["composerIcon", "composerIconDark", "logo", "logoDark"].map((k) => codex.interface[k])];
    for (const p of paths) {
      expect(typeof p, "a manifest path is missing").toBe("string");
      expect(existsSync(path.join(PLUGIN_DIR, p)), `${p} doesn't exist in the plugin`).toBe(true);
    }
  });

  it("signs Codex in with OAuth and sends no headers, which public submission rejects", () => {
    const server = read(codex.mcpServers).mcpServers.seopen;
    expect(server.headers).toBeUndefined();
    expect(server.extensions["com.openai"].auth.type).toBe("oauth");
  });

  it("lets Claude Code sign in with OAuth: no headers, which turn its sign-in off and which the directory rejects", () => {
    const server = read(".mcp.json").mcpServers.seopen;
    expect(server.type).toBe("http");
    expect(server.url).toBe("https://app.getseopen.com/api/mcp");
    expect(server.headers).toBeUndefined();
  });

  it("lists the same server in the MCP Registry, at the same version, with sign-in left to OAuth", () => {
    const entry = JSON.parse(readFileSync(path.join(root, "server.json"), "utf8"));
    expect(entry.version, "bump server.json with the manifests").toBe(claude.version);
    expect(entry.description.length, "the registry caps descriptions at 100 characters").toBeLessThanOrEqual(100);
    expect(entry.remotes).toEqual([{ type: "streamable-http", url: read(".mcp.json").mcpServers.seopen.url }]);
    expect(entry.repository.url).toBe(claude.repository);
  });

  it("gives Gemini CLI the same server and version, with sign-in left to OAuth", () => {
    const gemini = JSON.parse(readFileSync(path.join(root, "gemini-extension.json"), "utf8"));
    expect(gemini.name).toBe(claude.name);
    expect(gemini.version, "bump gemini-extension.json with the manifests").toBe(claude.version);
    expect(gemini.mcpServers).toEqual({ seopen: { httpUrl: read(".mcp.json").mcpServers.seopen.url } });
  });

  it("has the review cases OpenAI's directory takes, naming only tools the server registers", () => {
    const { positive, negative } = JSON.parse(readFileSync(path.join(root, "openai/review.json"), "utf8")).test_cases;
    expect(positive).toHaveLength(5);
    expect(negative).toHaveLength(3);
    const tools = registeredTools(MCP_DIR);
    for (const c of positive) for (const name of c.tools_triggered.split(", ")) expect(tools, c.description).toContain(name);
  });
});

describe("the copy for Claude's plugin directory", () => {
  const copy = build();

  it("names SEOpen and its support page, which the directory otherwise guesses", () => {
    const manifest = JSON.parse(readFileSync(path.join(OUT, ".claude-plugin/plugin.json"), "utf8"));
    expect(manifest.displayName).toBe("SEOpen");
    expect(manifest.supportUrl).toBe("https://getseopen.com/docs/agents/plugin");
  });

  it("is current: run node scripts/claude-directory.mjs after changing a skill", () => {
    const onDisk = readdirSync(OUT, { recursive: true, withFileTypes: true }).filter((e) => e.isFile() && e.name !== ".DS_Store").map((e) => path.relative(OUT, path.join(e.parentPath, e.name)));
    expect(onDisk.sort()).toEqual([...copy.keys()].sort());
    for (const [file, contents] of copy) expect(readFileSync(path.join(OUT, file)).equals(contents), file).toBe(true);
  });

  it("holds only files the directory takes from any organization, and no scripts", () => {
    for (const [file, contents] of copy) {
      expect(file, "a file type the directory refuses").toMatch(/(?:\.(?:md|json|png)|^LICENSE)$/);
      expect(contents.subarray(0, 2).toString(), file).not.toBe("#!");
    }
  });

  it("reads no key and points at no script or missing file", () => {
    for (const [file, contents] of copy) {
      if (!file.endsWith(".md")) continue;
      const text = contents.toString();
      expect(text, file).not.toMatch(/SEOPEN_API_KEY|scripts\/|\.sh\b|link-graph|the script\b|\bpass `/i);
      for (const [, target] of text.matchAll(/\]\((references\/[^)#]+)\)/g)) expect(copy.has(path.posix.join(path.posix.dirname(file), target)), `${file} links to ${target}`).toBe(true);
    }
  });

  it("keeps every skill, under the same name", () => {
    for (const skill of skills) expect(frontmatter(copy.get(`skills/${skill}/SKILL.md`)!.toString())?.name).toBe(skill);
  });
});
