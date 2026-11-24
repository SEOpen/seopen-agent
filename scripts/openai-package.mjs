// Builds the ZIP that OpenAI's plugin portal takes: node scripts/openai-package.mjs [demo video URL]
//
// The portal's Codex format documents the MCP file as ./.mcp.json, and Claude Code already owns that
// name in the plugin folder. So the ZIP gets .codex-mcp.json under that name, and the review cases
// from openai/review.json, which installed plugins don't need. Submission needs the video; a ZIP
// without it still uploads as a draft.
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const read = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const demo = process.argv[2];
if (demo && !demo.startsWith("https://")) throw new Error("The demo video must be an https:// URL.");

const manifest = read("plugins/seopen/.codex-plugin/plugin.json");
const review = read("openai/review.json");
const { positive, negative } = review.test_cases;
if (positive.length !== 5 || negative.length !== 3) throw new Error("OpenAI's review takes exactly five positive and three negative cases.");
for (const field of ["displayName", "shortDescription"]) {
  if (manifest.interface[field].length > 30) throw new Error(`interface.${field} is over OpenAI's 30 characters.`);
}

manifest.mcpServers = "./.mcp.json";
manifest.extensions = {
  "com.openai": {
    onboardingSkill: "./skills/seopen-setup/SKILL.md",
    review: { ...review, ...(demo ? { demo_recording_url: demo } : {}) },
    publication: { release_notes: "First release in the directory: SEOpen's MCP server and 25 skills." },
  },
};

const stage = mkdtempSync(path.join(tmpdir(), "seopen-openai-"));
for (const dir of ["skills", "assets", "README.md"]) cpSync(path.join(root, "plugins/seopen", dir), path.join(stage, dir), { recursive: true });
cpSync(path.join(root, "LICENSE"), path.join(stage, "LICENSE"));
cpSync(path.join(root, "plugins/seopen/.codex-mcp.json"), path.join(stage, ".mcp.json"));
mkdirSync(path.join(stage, ".codex-plugin"));
writeFileSync(path.join(stage, ".codex-plugin/plugin.json"), `${JSON.stringify(manifest, null, 2)}\n`);

mkdirSync(path.join(root, "dist"), { recursive: true });
const out = path.join(root, `dist/seopen-openai-${manifest.version}.zip`);
rmSync(out, { force: true });
execFileSync("zip", ["-qrX", out, ".", "-x", "*.DS_Store"], { cwd: stage });
rmSync(stage, { recursive: true });
console.log(out);
