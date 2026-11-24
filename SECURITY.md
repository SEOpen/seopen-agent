# Security

## Reporting a vulnerability

Use **Report a vulnerability** on this repository's Security tab, or email **hello@getseopen.com** with "Security" in the subject. Please don't open a public issue or pull request for it.

Include what you found, how to reproduce it, and what it lets someone do. We'll reply within 3 working days, keep you told as we fix it, and credit you when the fix ships unless you'd rather stay anonymous.

## What's covered

- The plugin and skills in this repository, on its default branch.
- SEOpen itself, whose code is in [SEOpen/seopen](https://github.com/SEOpen/seopen): read [its security policy](https://github.com/SEOpen/seopen/blob/main/SECURITY.md) before testing getseopen.com.

The plugin holds no keys: it signs in to SEOpen with OAuth. If you use an SEOpen key with another agent, keep it out of repositories and logs, and revoke it on SEOpen's MCP page if it leaks.
