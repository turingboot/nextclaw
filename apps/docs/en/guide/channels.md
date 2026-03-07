# Channels

This page is organized for a "connect first, optimize later" path.

## One-Line Definition

A channel connects the same NextClaw assistant to different message entry points (for example Telegram, Discord, Slack).

## Minimal First Success

1. Pick one channel in the UI (start with the one you use most).
2. Fill in only required credentials (for example token / appId / appSecret).
3. Save and run one real send/receive test.
4. After it works, add allowlist and group policies.

## Common Safety Field: `allowFrom`

- Empty `allowFrom` (`[]`): allow all senders.
- Non-empty `allowFrom`: only listed user IDs are accepted.

Recommendation: set `allowFrom` for higher-risk channels before production use.

## What You Need Per Channel (First Step)

### Discord

- Bot token
- Enable `MESSAGE CONTENT INTENT`
- Basic read/send message permissions for the bot

### Telegram

- Bot token from BotFather
- Your user ID (if using allowlist)

### Slack

- Bot token
- App-Level token with `connections:write`

### Feishu (Lark)

- `appId` / `appSecret` from a Feishu Open Platform app

### WhatsApp (whatsapp-web.js)

- QR scan on first login

## Advanced Config (Optional)

For batch management or versioned config, maintain channel settings under `channels` in `~/.nextclaw/config.json`.

Full parameter references:
- [Configuration](/en/guide/configuration)
- [Commands](/en/guide/commands)
