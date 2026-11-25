---
name: seopen-setup
description: Connect this agent to SEOpen and check the connection works, using free reads only. Use when the user wants to set up SEOpen, connect it, install its plugin, or when an SEOpen tool call fails to connect or says the key is wrong.
license: MIT
compatibility: Needs a SEOpen account. The plugin signs in with OAuth and needs no key.
---

# Set up SEOpen

## Rules

- Never ask the user to paste a key into this chat, and never print one. If they paste one anyway, tell them to delete it on SEOpen's MCP page and make another.
- Never write a key into a repository, `.mcp.json` or any file that gets committed.
- Nothing here spends research credits or changes anything.

## 1. Check the connection

Call `whoami` first. The plugin and the connectors sign in with OAuth (Claude Code, claude.ai, Claude Desktop), so they need no key or variable: if `whoami` answers, the connection works. Go to step 2.

If the tool doesn't exist or the server refuses the call:

- In Claude Code, ask the user to run `/plugin` to see whether `seopen` is installed, and `/mcp` to see whether its server connected.
  - Not installed: the user installs SEOpen from Claude's plugin directory, then runs `/reload-plugins`.
  - Installed but "needs authentication" or failed: in `/mcp`, the user chooses `seopen` and **Authenticate**, then signs in to SEOpen in the browser and chooses what Claude Code may do.
- In an app with connectors, ask the user to reconnect SEOpen in its connector settings.
- If the server was added by hand with a key, the steps for it are at https://getseopen.com/docs/agents/connect. The user follows them outside this chat.

Stop until they've signed in, then call `whoami` again. If a signed-in plugin is refused because it lacks a permission (making changes or spending credits), the user disconnects it at https://app.getseopen.com/agents and signs in again with that box ticked.

## 2. See what's there

Call `list_projects`. For the project that matches this repository, or the only one, call `list_fixes` and `get_usage`.

If there are no projects, tell the user to add their site at https://app.getseopen.com. A connection that can make changes can also do it with `create_project`, if they ask.

## 3. Hand over

Keep it short:

- Connected to which workspace, and on which plan.
- What this connection can do: read, make changes, spend credits.
- The projects it sees, and how many fixes are open.
- Three things to try, in the user's terms: fix the top issues in this repo (`seopen-fix`), write this week's review (`seopen-weekly-review`), and check how AI answers mention the site (`seopen-ai-visibility-check`). For a connection that can make changes, add that `seopen-autopilot` can run the site's SEO on a schedule, one reviewed pull request at a time.
