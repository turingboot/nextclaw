# nextclaw

Your omnipotent personal assistant, OpenClaw-compatible and local-first, with CLI + built-in Web UI.

## Install

```bash
npm i -g nextclaw
```

## Quick start

```bash
nextclaw start
```

Then open `http://127.0.0.1:18791`.

On a VPS, NextClaw serves plain HTTP on `18791`. Use `http://<server-ip>:18791` directly for a quick check, or put Nginx/Caddy in front for `80/443`. `https://` must be terminated by the reverse proxy, not by NextClaw itself.

## Common commands

```bash
nextclaw --version
nextclaw status
nextclaw stop
nextclaw update
```

## Docs

- Product docs: https://docs.nextclaw.io
- Repository: https://github.com/Peiiii/nextclaw
- Changelog: https://github.com/Peiiii/nextclaw/blob/master/packages/nextclaw/CHANGELOG.md
- Iteration logs: https://github.com/Peiiii/nextclaw/tree/master/docs/logs
