#!/usr/bin/env node
// Internal link graph for a site's repo, for the seopen-internal-links skill.
//
// Run from the repo root:
//   SITE=https://example.com node <skill>/scripts/link-graph.mjs > /tmp/link-graph.json
//
// Optional environment:
//   SITE      The live origin. Links written as absolute URLs on this host (with or without www) count as internal.
//   SITEMAP   A sitemap file path or URL. Its pages join the graph, so pages built from data are counted too.
//   MAP       Content folders the script can't place, as folder:urlprefix pairs, comma separated.
//             Example: MAP=content/posts:/blog,src/lib/articles:/articles
//   IGNORE    URL prefixes to leave out, comma separated. Example: IGNORE=/admin,/api,/app
//   IGNORE_GROUPS  Next.js route groups to leave out, comma separated, such as an app served on another host.
//             Example: IGNORE_GROUPS=(app),(auth)
//   REWRITE   Routes served at another path, as route:publicpath pairs, comma separated. Links to either count.
//             Example: REWRITE=/landing:/ when a rewrite serves /landing at the home page.
//   SHARED    How many pages a component must reach before its links count as template links (default 4).
//
// Reads Next.js App Router (app/, src/app/, plus pages/ when present), Astro (src/pages, src/content),
// SvelteKit (src/routes), plain HTML, and Markdown or MDX content folders. No dependencies.
// Prints JSON to stdout and a short summary to stderr.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", "out", ".svelte-kit", ".astro", ".vercel", ".netlify", "coverage", ".turbo", ".cache", ".output", "vendor", "tmp"]);
const CODE_EXT = [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs", ".svelte", ".astro", ".vue"];
const CONTENT_EXT = [".md", ".mdx", ".markdoc", ".mdoc", ".svx"];
const ASSET_EXT = /\.(png|jpe?g|gif|webp|avif|svg|ico|pdf|zip|xml|txt|json|css|js|mjs|map|woff2?|ttf|otf|mp4|webm|mp3|csv|rss|atom)$/i;
const SITEWIDE_NAME = /(^|[-_.])(nav|navbar|navigation|header|footer|menu|sidebar|breadcrumbs?|site-?nav|top-?bar|layout)([-_.]|$)/i;
const SHARED_MIN = Number(process.env.SHARED) > 0 ? Number(process.env.SHARED) : 4;

const notes = [];
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
const read = (p) => {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return "";
  }
};
const isDir = (p) => {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
};

function walk(dir, out = []) {
  if (!isDir(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") && e.name !== ".") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(p, out);
    } else if (e.isFile()) out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Site and settings
// ---------------------------------------------------------------------------

const pkg = (() => {
  try {
    return JSON.parse(read(path.join(ROOT, "package.json")) || "{}");
  } catch {
    return {};
  }
})();
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

function detectSite() {
  if (process.env.SITE) return process.env.SITE;
  for (const f of ["astro.config.mjs", "astro.config.ts", "astro.config.js"]) {
    const m = /\bsite\s*:\s*["'](https?:\/\/[^"']+)["']/.exec(read(path.join(ROOT, f)));
    if (m) return m[1];
  }
  if (typeof pkg.homepage === "string" && /^https?:\/\//.test(pkg.homepage)) return pkg.homepage;
  return null;
}
const SITE = detectSite();
let siteHosts = [];
if (SITE) {
  try {
    const h = new URL(SITE).hostname.replace(/^www\./, "");
    siteHosts = [h, `www.${h}`];
  } catch {
    notes.push(`SITE is not a URL: ${SITE}`);
  }
} else notes.push("SITE is not set, so absolute links to the site's own domain are not counted. Run again with SITE=https://your-domain.");

const IGNORE = (process.env.IGNORE || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => normPath(s));
const ignored = (p) => IGNORE.some((pre) => p === pre || p.startsWith(pre === "/" ? "/" : `${pre}/`));
const IGNORE_GROUPS = (process.env.IGNORE_GROUPS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => (s.startsWith("(") ? s : `(${s})`));
const inIgnoredGroup = (file) => IGNORE_GROUPS.length > 0 && rel(file).split("/").some((seg) => IGNORE_GROUPS.includes(seg));
const REWRITE = new Map(
  (process.env.REWRITE || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.includes(":"))
    .map((s) => s.split(":").map((x) => normPath(x.trim()))),
);

const MAP = (process.env.MAP || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((pair) => {
    const i = pair.indexOf(":");
    return { folder: pair.slice(0, i).replace(/\/+$/, ""), prefix: normPath(pair.slice(i + 1)) };
  })
  .filter((m) => m.folder && m.prefix);

// ---------------------------------------------------------------------------
// URLs
// ---------------------------------------------------------------------------

function normPath(p) {
  let s = p.split("#")[0].split("?")[0];
  try {
    s = decodeURI(s);
  } catch {}
  s = s.replace(/\/{2,}/g, "/");
  if (!s.startsWith("/")) s = `/${s}`;
  if (s.length > 1) s = s.replace(/\/+$/, "");
  s = s.replace(/\/index(\.html?)?$/, "") || "/";
  return s;
}

/** A link's target path on this site, or null when it points elsewhere or at a file. */
function toInternal(href, fromPath) {
  const h = href.trim();
  if (!h || h.startsWith("#") || /^(mailto|tel|sms|javascript|data|ftp):/i.test(h)) return null;
  let p;
  if (/^https?:\/\//i.test(h) || h.startsWith("//")) {
    let u;
    try {
      u = new URL(h.startsWith("//") ? `https:${h}` : h);
    } catch {
      return null;
    }
    if (!siteHosts.includes(u.hostname)) return null;
    p = u.pathname;
  } else if (h.startsWith("/")) p = h;
  else if (/^[a-z][a-z0-9+.-]*:/i.test(h)) return null;
  else {
    if (!fromPath) return null; // a relative link in a shared component: its base is unknown
    try {
      p = new URL(h, `https://x.invalid${fromPath === "/" ? "/" : fromPath}`).pathname;
    } catch {
      return null;
    }
  }
  const n = normPath(p);
  if (/[{}\[\]$]/.test(n)) return null; // a path built from a variable, such as /posts/{id}
  if (ASSET_EXT.test(n) && !/\.html?$/i.test(n)) return null;
  return n;
}

// ---------------------------------------------------------------------------
// Link extraction
// ---------------------------------------------------------------------------

function stripFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  return m ? { fm: m[1], body: text.slice(m[0].length) } : { fm: "", body: text };
}

function fmValue(fm, key) {
  const m = new RegExp(`^${key}\\s*:\\s*(.+)$`, "mi").exec(fm);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}

/** Drafts and posts scheduled for later aren't live: links from them don't count, and links to them are flagged. */
function unpublished(fm) {
  if (!fm) return false;
  if (/^draft\s*:\s*true\b/mi.test(fm) || /^published\s*:\s*false\b/mi.test(fm)) return true;
  for (const key of ["publishAt", "publish_at", "publishDate", "publish_date", "scheduledAt"]) {
    const v = fmValue(fm, key);
    if (v && !Number.isNaN(Date.parse(v)) && Date.parse(v) > Date.now()) return true;
  }
  return false;
}

function cleanCode(text, ext) {
  let t = text.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ").replace(/<!--[\s\S]*?-->/g, " ");
  if (CONTENT_EXT.includes(ext)) t = t.replace(/^(```|~~~)[\s\S]*?^\1/gm, " ").replace(/`[^`\n]*`/g, " ");
  return t;
}

const stripTags = (s) => s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

/** Link text that follows an opening tag, when it's plain text. */
function textAfter(t, idx) {
  const close = t.indexOf(">", idx);
  if (close < 0) return null;
  const end = t.indexOf("</", close);
  if (end < 0 || end - close > 300) return null;
  const inner = t.slice(close + 1, end);
  if (inner.includes("{")) return null;
  const s = stripTags(inner);
  return s || null;
}

function extractLinks(text, ext, { navData = false } = {}) {
  const t = cleanCode(text, ext);
  const out = [];
  const add = (href, linkText) => out.push({ href, text: linkText ? linkText.slice(0, 120) : null });
  if (CONTENT_EXT.includes(ext)) {
    for (const m of t.matchAll(/(!?)\[((?:[^\[\]]|\[[^\]]*\])*)\]\(\s*<?([^)\s>]+)>?(?:\s+["'][^"']*["'])?\s*\)/g)) if (!m[1]) add(m[3], stripTags(m[2]));
    for (const m of t.matchAll(/^\s{0,3}\[([^\]]+)\]:\s*<?(\S+?)>?(?:\s+["'(].*)?$/gm)) add(m[2], m[1]);
  }
  for (const m of t.matchAll(/\bhref\s*=\s*(["'])([^"']*)\1/g)) add(m[2], textAfter(t, m.index));
  for (const m of t.matchAll(/\bhref\s*=\s*\{\s*(["'])([^"']*)\1\s*\}/g)) add(m[2], textAfter(t, m.index));
  // href={siteHref("/pricing")}: a helper that takes the path as its first argument.
  for (const m of t.matchAll(/\bhref\s*=\s*\{\s*[\w$.]+\(\s*(["'])(\/[^"']*)\1/g)) add(m[2], textAfter(t, m.index));
  // { href: "/pricing", label: "Pricing" } in nav and footer data.
  for (const m of t.matchAll(/\bhref\s*:\s*(["'])([^"']*)\1/g)) {
    const label = /\b(?:label|title|name|text)\s*:\s*(["'])([^"']{1,80})\1/.exec(t.slice(Math.max(0, m.index - 150), m.index + 200));
    add(m[2], label ? label[2] : null);
  }
  // Nav and footer data often names the page under another key: { path: "/features/x", name: "X" }.
  if (navData)
    for (const m of t.matchAll(/\b(?:path|url|to|link)\s*:\s*(["'])(\/[^"'\s]*)\1/g)) {
      const label = /\b(?:label|title|name|text)\s*:\s*(["'])([^"']{1,80})\1/.exec(t.slice(Math.max(0, m.index - 150), m.index + 200));
      add(m[2], label ? label[2] : null);
    }
  return out;
}

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

/** JSON with comments and trailing commas, as tsconfig allows. Strings are kept whole, so "@/*" survives. */
function parseJsonc(raw) {
  let out = "";
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') {
      let j = i + 1;
      while (j < raw.length && raw[j] !== '"') j += raw[j] === "\\" ? 2 : 1;
      out += raw.slice(i, j + 1);
      i = j;
    } else if (c === "/" && raw[i + 1] === "/") {
      while (i < raw.length && raw[i] !== "\n") i++;
      out += "\n";
    } else if (c === "/" && raw[i + 1] === "*") {
      const end = raw.indexOf("*/", i + 2);
      i = end < 0 ? raw.length : end + 1;
    } else out += c;
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}

function readAliases() {
  const aliases = [];
  for (const f of ["tsconfig.json", "jsconfig.json"]) {
    const raw = read(path.join(ROOT, f));
    if (!raw) continue;
    let cfg;
    try {
      cfg = parseJsonc(raw);
    } catch {
      continue;
    }
    const base = path.join(ROOT, cfg.compilerOptions?.baseUrl || ".");
    for (const [k, v] of Object.entries(cfg.compilerOptions?.paths || {})) {
      if (!Array.isArray(v) || !v[0]) continue;
      aliases.push({ from: k.replace(/\*$/, ""), to: path.join(base, v[0].replace(/\*$/, "")), exact: !k.endsWith("*") });
    }
  }
  aliases.push({ from: "$lib/", to: path.join(ROOT, "src/lib/"), exact: false });
  aliases.push({ from: "~/", to: path.join(ROOT, "src/"), exact: false });
  return aliases.sort((a, b) => b.from.length - a.from.length);
}
const ALIASES = readAliases();

function resolveImport(spec, fromFile) {
  let base = null;
  if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else
    for (const a of ALIASES) {
      if (a.exact ? spec === a.from : spec.startsWith(a.from)) {
        base = a.exact ? a.to : path.join(a.to, spec.slice(a.from.length));
        break;
      }
    }
  if (!base) return null;
  const tries = [base, ...[...CODE_EXT, ...CONTENT_EXT].map((e) => base + e), ...[...CODE_EXT, ...CONTENT_EXT].map((e) => path.join(base, `index${e}`))];
  for (const p of tries) if (existsSync(p) && !isDir(p)) return p;
  return null;
}

const importCache = new Map();
function importsOf(file) {
  if (importCache.has(file)) return importCache.get(file);
  const t = read(file);
  const specs = new Set();
  for (const m of t.matchAll(/\bimport\s+(?:[^"'`;]*?\s+from\s+)?["']([^"']+)["']/g)) specs.add(m[1]);
  for (const m of t.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) specs.add(m[1]);
  for (const m of t.matchAll(/\bexport\s+[^"'`;]*?\s+from\s+["']([^"']+)["']/g)) specs.add(m[1]);
  const out = [...specs].map((s) => resolveImport(s, file)).filter((p) => p && !p.includes(`${path.sep}node_modules${path.sep}`));
  importCache.set(file, out);
  return out;
}

/** Every local file a file pulls in, following imports up to `depth` levels. */
function reach(file, depth = 4, seen = new Set()) {
  if (depth < 0) return seen;
  for (const f of importsOf(file)) {
    if (seen.has(f)) continue;
    seen.add(f);
    reach(f, depth - 1, seen);
  }
  return seen;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const frameworks = [];
const routes = []; // { file, segments, kind: "page" | "layout" }

function segmentsFor(relDir, { group = /^\(.*\)$/, skip = () => false } = {}) {
  const out = [];
  for (const s of relDir.split("/").filter(Boolean)) {
    if (group.test(s) || s.startsWith("@")) continue;
    if (skip(s)) return null;
    out.push(s);
  }
  return out;
}

function addNext() {
  for (const dir of ["app", "src/app"]) {
    const abs = path.join(ROOT, dir);
    if (!isDir(abs)) continue;
    frameworks.push(`next-app:${dir}`);
    for (const f of walk(abs)) {
      const b = path.basename(f);
      if (inIgnoredGroup(f)) continue;
      const relDir = rel(path.dirname(f)).slice(dir.length);
      const segs = segmentsFor(relDir, { skip: (s) => s.startsWith("_") || /^\(\.+\)/.test(s) });
      if (!segs) continue;
      if (/^page\.(tsx|jsx|ts|js|mdx|md)$/.test(b)) routes.push({ file: f, segments: segs, kind: "page" });
      else if (/^(layout|template)\.(tsx|jsx|ts|js)$/.test(b)) routes.push({ file: f, segments: segs, kind: "layout" });
    }
  }
  for (const dir of ["pages", "src/pages"]) {
    const abs = path.join(ROOT, dir);
    if (!isDir(abs)) continue;
    frameworks.push(`next-pages:${dir}`);
    for (const f of walk(abs)) {
      const r = rel(f).slice(dir.length + 1);
      if (!/\.(tsx|jsx|ts|js|mdx|md)$/.test(r) || r.startsWith("api/")) continue;
      const name = r.replace(/\.(tsx|jsx|ts|js|mdx|md)$/, "");
      if (/^_(app|document|error)$/.test(name)) continue;
      if (name === "404" || name === "500") continue;
      const segs = name.split("/").filter((s) => s !== "index");
      routes.push({ file: f, segments: segs, kind: "page" });
    }
  }
}

function addAstro() {
  const abs = path.join(ROOT, "src/pages");
  if (!isDir(abs)) return;
  frameworks.push("astro");
  for (const f of walk(abs)) {
    const r = rel(f).slice("src/pages/".length);
    if (!/\.(astro|md|mdx|html)$/.test(r)) continue;
    const segs = r.replace(/\.(astro|md|mdx|html)$/, "").split("/");
    if (segs.some((s) => s.startsWith("_"))) continue;
    if (segs[segs.length - 1] === "index") segs.pop();
    if (segs[segs.length - 1] === "404" || segs[segs.length - 1] === "500") continue;
    routes.push({ file: f, segments: segs, kind: "page" });
  }
  for (const f of walk(path.join(ROOT, "src/layouts"))) routes.push({ file: f, segments: [], kind: "layout" });
}

function addSvelteKit() {
  const abs = path.join(ROOT, "src/routes");
  if (!isDir(abs)) return;
  frameworks.push("sveltekit");
  for (const f of walk(abs)) {
    const b = path.basename(f);
    const segs = segmentsFor(rel(path.dirname(f)).slice("src/routes".length));
    if (!segs) continue;
    if (/^\+page\.(svelte|md|svx)$/.test(b)) routes.push({ file: f, segments: segs, kind: "page" });
    else if (/^\+layout\.svelte$/.test(b)) routes.push({ file: f, segments: segs, kind: "layout" });
  }
}

function addHtml() {
  frameworks.push("html");
  for (const f of walk(ROOT)) {
    if (!/\.html?$/.test(f)) continue;
    const r = rel(f);
    if (/(^|\/)(node_modules|vendor|templates?|partials?|includes?)\//.test(r)) continue;
    const segs = r.split("/");
    if (/^index\.html?$/.test(segs[segs.length - 1])) segs.pop();
    routes.push({ file: f, segments: segs, kind: "page", html: true });
  }
}

const isNext = !!deps.next;
const isAstro = !!deps.astro;
const isKit = !!deps["@sveltejs/kit"];
if (isNext) addNext();
if (isAstro) addAstro();
if (isKit) addSvelteKit();
if (!isNext && !isAstro && !isKit) addHtml();

const dynamicSeg = (s) => /^\[.+\]$/.test(s) || /^\[\[.+\]\]$/.test(s);
const catchAll = (s) => /^\[\[?\.\.\..+\]\]?$/.test(s);

// ---------------------------------------------------------------------------
// Content folders
// ---------------------------------------------------------------------------

const CONTENT_ROOTS = ["content", "src/content", "posts", "_posts", "src/posts", "src/lib/posts", "src/lib/content", "blog", "src/blog", "data/blog", ...MAP.map((m) => m.folder)];
const contentFiles = [...new Set(CONTENT_ROOTS.flatMap((d) => walk(path.join(ROOT, d))))].filter((f) => CONTENT_EXT.includes(path.extname(f)) && !/(^|\/)(README|CHANGELOG|REVIEW|LICENSE|CONTRIBUTING)\.mdx?$/i.test(rel(f)));
const templates = routes.filter((r) => r.kind === "page" && r.segments.some(dynamicSeg));

/** Where a content file is served: a MAP rule, its permalink, or the dynamic route its folder matches. */
function placeContent(file, fm) {
  const r = rel(file);
  const permalink = fmValue(fm, "permalink");
  if (permalink && permalink.startsWith("/")) return { path: normPath(permalink), template: null, how: "permalink" };
  const slug = fmValue(fm, "slug");
  for (const m of MAP) {
    if (r.startsWith(`${m.folder}/`)) {
      const rest = r.slice(m.folder.length + 1).replace(/\.[^.]+$/, "").replace(/(^|\/)index$/, "");
      const parts = rest.split("/").filter(Boolean);
      if (slug) parts.splice(-1, 1, slug);
      return { path: normPath(`${m.prefix}/${parts.join("/")}`), template: null, how: "MAP" };
    }
  }
  const root = CONTENT_ROOTS.find((d) => r.startsWith(`${d}/`));
  const restParts = r.slice(root.length + 1).replace(/\.[^.]+$/, "").split("/");
  if (restParts[restParts.length - 1] === "index") restParts.pop();
  if (slug) restParts.splice(-1, 1, slug);
  const matches = [];
  for (const t of templates) {
    const st = t.segments;
    const firstDyn = st.findIndex(dynamicSeg);
    const prefix = st.slice(0, firstDyn);
    const after = st.slice(firstDyn);
    if (after.filter(dynamicSeg).length !== after.length) continue; // static parts after a parameter: too unsure
    const ok = prefix.every((s, i) => restParts[i] === s);
    if (!ok) continue;
    const remainder = restParts.slice(prefix.length);
    if (remainder.length === 0 && !/^\[\[/.test(after[0])) continue;
    if (catchAll(after[after.length - 1]) ? remainder.length >= after.length - 1 : remainder.length === after.length) matches.push({ t, remainder, prefix });
  }
  // A folder named posts or blog with exactly one blog-like route.
  if (!matches.length && /^(posts|blog|articles|_posts)$/.test(restParts.length > 1 ? restParts[0] : path.basename(root))) {
    const blogLike = templates.filter((t) => t.segments.length === 2 && /^(blog|posts|articles|news|writing)$/.test(t.segments[0]));
    if (blogLike.length === 1) {
      const name = restParts[restParts.length - 1].replace(/^\d{4}-\d{2}-\d{2}-/, "");
      return { path: normPath(`/${blogLike[0].segments[0]}/${name}`), template: blogLike[0].file, how: "guessed from the folder name" };
    }
  }
  if (!matches.length) return null;
  matches.sort((a, b) => b.prefix.length - a.prefix.length);
  const best = matches[0];
  return { path: normPath(`/${[...best.prefix, ...best.remainder].join("/")}`), template: best.t.file, how: "folder matches route" };
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

const pages = new Map(); // path -> page
const fileRole = new Map(); // file -> { role, path? }
const dynamicRoutes = [];
const unmappedContent = [];

function addPage(p, info) {
  if (ignored(p)) return null;
  const existing = pages.get(p);
  if (existing) {
    existing.files.push(info.file);
    return existing;
  }
  const page = { path: p, file: info.file, files: [info.file], template: info.template ?? null, source: info.source, unpublished: !!info.unpublished, mapped_by: info.how ?? null, in_sitemap: null };
  pages.set(p, page);
  return page;
}

for (const r of routes) {
  if (r.kind === "layout") {
    fileRole.set(r.file, { role: "sitewide" });
    continue;
  }
  if (r.segments.some(dynamicSeg)) {
    dynamicRoutes.push({ route: `/${r.segments.join("/")}`, file: rel(r.file), entries: 0 });
    fileRole.set(r.file, { role: "template" });
    continue;
  }
  const routePath = normPath(`/${r.segments.join("/")}`);
  const p = REWRITE.get(routePath) ?? routePath;
  if (p !== routePath && pages.has(p)) notes.push(`REWRITE ${routePath} to ${p}: ${pages.get(p).file} already serves ${p}; set IGNORE_GROUPS for the group it's in.`);
  const ext = path.extname(r.file);
  const fm = CONTENT_EXT.includes(ext) ? stripFrontmatter(read(r.file)).fm : "";
  const page = addPage(p, { file: rel(r.file), source: "route", unpublished: unpublished(fm) });
  if (page) fileRole.set(r.file, { role: "page", path: p });
  // /about.html is often served as /about too.
  if (page && r.html && /\.html?$/.test(p)) page.alias = p.replace(/\.html?$/, "");
}

for (const f of contentFiles) {
  if (fileRole.has(f)) continue;
  const { fm } = stripFrontmatter(read(f));
  const placed = placeContent(f, fm);
  if (!placed) {
    unmappedContent.push(rel(f));
    continue;
  }
  const page = addPage(placed.path, { file: rel(f), template: placed.template ? rel(placed.template) : null, source: "content", unpublished: unpublished(fm), how: placed.how });
  if (!page) continue;
  fileRole.set(f, { role: "page", path: placed.path });
  const d = dynamicRoutes.find((x) => placed.template && x.file === rel(placed.template));
  if (d) d.entries++;
}

const aliasOf = new Map();
for (const pg of pages.values()) if (pg.alias) aliasOf.set(pg.alias, pg.path);
for (const [from, to] of REWRITE) if (pages.has(to) && !pages.has(from)) aliasOf.set(from, to);
const canonicalPath = (p) => (pages.has(p) ? p : aliasOf.get(p) ?? (pages.has(`${p}.html`) ? `${p}.html` : p));

// ---------------------------------------------------------------------------
// Which files' links count where
// ---------------------------------------------------------------------------

// Files pulled in by a layout, or named like a nav, header or footer, put their links on every page.
const sitewideFiles = new Set([...fileRole].filter(([, v]) => v.role === "sitewide").map(([f]) => f));
for (const f of [...sitewideFiles]) for (const g of reach(f)) sitewideFiles.add(g);

// Every page's own files: its route or content file, plus its template when it's built from content.
const pageSources = new Map(); // path -> [abs files]
for (const pg of pages.values()) {
  const own = pg.files.map((f) => path.join(ROOT, f));
  if (pg.template) own.push(path.join(ROOT, pg.template));
  pageSources.set(pg.path, own);
}

// Components a page reaches, and how many pages reach each one.
const reachCount = new Map();
const pageReach = new Map();
for (const [p, own] of pageSources) {
  const set = new Set();
  for (const f of own) for (const g of reach(f)) set.add(g);
  for (const f of own) set.delete(f);
  pageReach.set(p, set);
  for (const g of set) reachCount.set(g, (reachCount.get(g) || 0) + 1);
}
const templateFiles = new Set(dynamicRoutes.map((d) => path.join(ROOT, d.file)));
for (const f of reachCount.keys()) {
  if (SITEWIDE_NAME.test(path.basename(f, path.extname(f))) && !CONTENT_EXT.includes(path.extname(f))) sitewideFiles.add(f);
}

const linkCache = new Map();
function linksIn(file, navData = false) {
  const key = `${navData ? "nav:" : ""}${file}`;
  if (!linkCache.has(key)) linkCache.set(key, extractLinks(read(file), path.extname(file), { navData }));
  return linkCache.get(key);
}

// ---------------------------------------------------------------------------
// Build the graph
// ---------------------------------------------------------------------------

const inbound = new Map(); // target -> { contextual: Map(from -> {text, file}), template: Set(file), sitewide: Set(file) }
const outbound = new Map(); // from -> Set(target)
const slot = (t) => {
  if (!inbound.has(t)) inbound.set(t, { contextual: new Map(), template: new Set(), sitewide: new Set() });
  return inbound.get(t);
};

for (const f of sitewideFiles) {
  for (const l of linksIn(f, true)) {
    const t = toInternal(l.href, null);
    if (t && !ignored(canonicalPath(t))) slot(canonicalPath(t)).sitewide.add(rel(f));
  }
}

for (const [p, own] of pageSources) {
  const pg = pages.get(p);
  if (pg.unpublished) continue; // a draft's links aren't live
  const outs = new Set();
  const addContextual = (t, l, file) => {
    if (t === p) return;
    const s = slot(t);
    if (!s.contextual.has(p)) s.contextual.set(p, { text: l.text, file });
    outs.add(t);
  };
  for (const f of own) {
    if (sitewideFiles.has(f)) continue;
    const isTemplate = templateFiles.has(f);
    for (const l of linksIn(f)) {
      const t0 = toInternal(l.href, p);
      if (!t0) continue;
      const t = canonicalPath(t0);
      if (ignored(t)) continue;
      if (isTemplate) slot(t).template.add(rel(f));
      else addContextual(t, l, rel(f));
    }
  }
  for (const f of pageReach.get(p)) {
    if (sitewideFiles.has(f)) continue;
    const shared = (reachCount.get(f) || 0) >= SHARED_MIN || templateFiles.has(f);
    for (const l of linksIn(f)) {
      const t0 = toInternal(l.href, shared ? null : p);
      if (!t0) continue;
      const t = canonicalPath(t0);
      if (ignored(t)) continue;
      if (shared) slot(t).template.add(rel(f));
      else addContextual(t, l, rel(f));
    }
  }
  outbound.set(p, outs);
}

// ---------------------------------------------------------------------------
// Sitemap
// ---------------------------------------------------------------------------

async function loadSitemap(src, depth = 0, seen = new Set()) {
  if (!src || depth > 2 || seen.has(src)) return [];
  seen.add(src);
  let xml = "";
  if (/^https?:\/\//.test(src)) {
    try {
      const res = await fetch(src, { headers: { "user-agent": "link-graph" } });
      if (!res.ok) {
        notes.push(`Sitemap ${src} answered ${res.status}.`);
        return [];
      }
      xml = await res.text();
    } catch (e) {
      notes.push(`Sitemap ${src} could not be fetched: ${e.message}`);
      return [];
    }
  } else xml = read(path.resolve(ROOT, src));
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  if (/<sitemapindex/i.test(xml)) {
    const all = [];
    for (const l of locs) all.push(...(await loadSitemap(l, depth + 1, seen)));
    return all;
  }
  return locs;
}

const sitemapLocs = process.env.SITEMAP ? await loadSitemap(process.env.SITEMAP) : null;
const sitemapPaths = new Set();
if (sitemapLocs) {
  for (const loc of sitemapLocs) {
    let u;
    try {
      u = new URL(loc);
    } catch {
      continue;
    }
    if (!siteHosts.length) siteHosts = [u.hostname.replace(/^www\./, ""), `www.${u.hostname.replace(/^www\./, "")}`];
    const p = canonicalPath(normPath(u.pathname));
    if (!ignored(p)) sitemapPaths.add(p);
  }
  for (const p of sitemapPaths) if (!pages.has(p)) addPage(p, { file: null, source: "sitemap" });
  for (const pg of pages.values()) pg.in_sitemap = sitemapPaths.has(pg.path);
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

// Keys are camelCase single words so they read apart from SEOpen's tool fields.
const out = [];
for (const pg of pages.values()) {
  const s = inbound.get(pg.path) ?? { contextual: new Map(), template: new Set(), sitewide: new Set() };
  const linkedFrom = [...s.contextual].filter(([from]) => pages.has(from)).map(([from, v]) => ({ from, text: v.text, file: v.file }));
  out.push({
    path: pg.path,
    file: pg.file,
    template: pg.template,
    source: pg.source,
    ...(pg.mapped_by && pg.mapped_by !== "folder matches route" ? { mappedBy: pg.mapped_by } : {}),
    ...(pg.unpublished ? { unpublished: true } : {}),
    ...(pg.in_sitemap != null ? { inSitemap: pg.in_sitemap } : {}),
    inbound: linkedFrom.length,
    linkedFrom: linkedFrom.sort((a, b) => a.from.localeCompare(b.from)),
    nav: s.sitewide.size > 0,
    navFiles: [...s.sitewide].sort(),
    templateLinks: [...s.template].sort(),
    outbound: outbound.get(pg.path)?.size ?? 0,
  });
}
out.sort((a, b) => a.inbound - b.inbound || a.path.localeCompare(b.path));

const unknownTargets = [];
for (const [t, s] of inbound) {
  if (pages.has(t)) continue;
  unknownTargets.push({ path: t, linkedFrom: [...s.contextual.keys()].sort(), nav: s.sitewide.size > 0, template: s.template.size > 0 });
}
unknownTargets.sort((a, b) => a.path.localeCompare(b.path));

for (const d of dynamicRoutes)
  if (!d.entries) notes.push(`${d.file} (${d.route}) builds pages from data the script can't read. Add those pages by hand, pass SITEMAP so they're counted, or map their content folder with MAP.`);
if (unmappedContent.length) notes.push(`${unmappedContent.length} content files have no route the script could match. Map their folder with MAP=folder:/prefix and run again.`);
if (!sitemapLocs) notes.push("SITEMAP not set: sitemap orphans can't be listed. Run again with SITEMAP=https://your-domain/sitemap.xml.");
notes.push("Links built at run time from data (related posts, a docs sidebar read from content, links made with template literals) aren't seen. Read a target's template before calling it an orphan.");

const live = out.filter((p) => !p.unpublished);
const result = {
  site: SITE,
  generatedAt: new Date().toISOString(),
  frameworks,
  counting: `inbound counts the distinct live pages that link to a page from body text. Links in layouts and in nav, header and footer files are nav links; links in a dynamic route's own file, or in a component ${SHARED_MIN} or more pages share, are template links. Neither counts as inbound. Links from unpublished pages don't count. Paths have no trailing slash.`,
  totals: {
    pages: out.length,
    live: live.length,
    unpublished: out.length - live.length,
    links: live.reduce((n, p) => n + p.inbound, 0),
    noInbound: live.filter((p) => p.inbound === 0).length,
    underThree: live.filter((p) => p.inbound < 3).length,
    inNav: live.filter((p) => p.nav).length,
    navFiles: sitewideFiles.size,
    dynamicRoutes: dynamicRoutes.length,
    ...(sitemapLocs ? { sitemapUrls: sitemapPaths.size, sitemapOrphans: live.filter((p) => p.inSitemap && p.inbound === 0 && !p.nav).length } : {}),
  },
  notes,
  pages: out,
  dynamicRoutes,
  unmapped: unmappedContent,
  unknownTargets,
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
const t = result.totals;
process.stderr.write(
  `link-graph: ${t.live} live pages (${frameworks.join(", ") || "no framework found"}), ${t.links} body links, ${t.noInbound} with none in, ${t.underThree} under 3, ${t.inNav} in nav, ${t.dynamicRoutes} dynamic routes, ${unmappedContent.length} unmapped content files, ${unknownTargets.length} link targets with no page${sitemapLocs ? `, ${t.sitemapOrphans} sitemap orphans` : ""}.\n`,
);
