---
name: seopen-setup
description: Connect this agent to SEOpen and check the connection works, using free reads only. Use when the user wants to set up SEOpen, connect it, install its plugin, or when an SEOpen tool call fails to connect or says the key is wrong.
license: MIT
compatibility: Needs a SEOpen account. The Claude Code and Codex plugins and the Claude and ChatGPT connectors sign in with OAuth and need no key; a server added by hand can use a key instead.
---

# Set up SEOpen

## Rules

- Never ask the user to paste a key into this chat, and never print one. If they paste one anyway, tell them to delete it on SEOpen's MCP page and make another.
- Never write a key into a repository, `.mcp.json` or any file that gets committed.
- Nothing here spends research credits or changes anything.

## 1. Check the connection

Call `whoami` first. The plugin and the connectors sign in with OAuth (Claude Code, Codex, claude.ai, Claude Desktop), so they need no key or variable: if `whoami` answers, the connection works. Go to step 3.

If the tool doesn't exist or the server refuses the call:

- In Claude Code, ask the user to run `/plugin` to see whether `seopen` is installed, and `/mcp` to see whether its server connected.
  - Not installed: the user runs `/plugin marketplace add SEOpen/seopen-agent`, then `/plugin install seopen@seopen`, then `/reload-plugins`.
  - Installed but "needs authentication" or failed: in `/mcp`, the user chooses `seopen` and **Authenticate**, then signs in to SEOpen in the browser and chooses what Claude Code may do.
- In Codex, ask the user to run `codex plugin list` to see whether `seopen` is installed, and `codex mcp list` to see whether its server is signed in.
  - Not installed: the user runs `codex plugin marketplace add SEOpen/seopen-agent`, then `codex plugin add seopen@seopen`.
  - Installed but "Not logged in": the user runs `codex mcp login seopen` and signs in to SEOpen in the browser.
- In an app with connectors, ask the user to reconnect SEOpen in its connector settings.
- If the server was added by hand with a key (`claude mcp add ... --header`, Cursor, a Codex `config.toml` entry), go to step 2.

Stop until they've signed in, then call `whoami` again. If a signed-in plugin is refused because it lacks a permission (making changes or spending credits), the user disconnects it at https://app.getseopen.com/agents and signs in again with that box ticked.

## 2. A server added by hand with a key

This step is only for a server the user added themselves with a key header. Check the variable without showing the value:

```bash
[ -n "$SEOPEN_API_KEY" ] && echo "SEOPEN_API_KEY is set" || echo "SEOPEN_API_KEY is missing"
```

If it's missing, or set but refused (the key is wrong, deleted or expired), ask the user to do this themselves:

1. Open https://app.getseopen.com/agents and make a key. For fixing issues, tick "Can make changes". For paid lookups, tick "Can spend research credits". Both are off by default, and a key can be replaced later.
2. Add `export SEOPEN_API_KEY="..."` to their shell profile, such as `~/.zshrc`, with the key in place of the dots.
3. Open a new terminal and restart the agent there, because it reads the variable when it starts. The Claude desktop app doesn't read shell profiles, so there the plugin's OAuth sign-in is the way to connect.

Stop here until they've done that, then call `whoami` again.

## 3. See what's there

Call `list_projects`. For the project that matches this repository, or the only one, call `list_fixes` and `get_usage`.

If there are no projects, tell the user to add their site at https://app.getseopen.com. A connection that can make changes can also do it with `create_project`, if they ask.

## 4. Hand over

Keep it short:

- Connected to which workspace, on which plan, signed in with OAuth or with which key.
- What this connection can do: read, make changes, spend credits.
- The projects it sees, and how many fixes are open.
- Three things to try, in the user's terms: fix the top issues in this repo (`seopen-fix`), write this week's review (`seopen-weekly-review`), and check how AI answers mention the site (`seopen-ai-visibility-check`). For a connection that can make changes, add that `seopen-autopilot` can run the site's SEO on a schedule, one reviewed pull request at a time.
