---
"@nextclaw/core": patch
"@nextclaw/runtime": patch
"nextclaw": patch
---

Guard OpenAI-compatible automatic `responses` fallback so DashScope models such as `qwen3-coder-next` stay on `chat/completions` instead of being misrouted to an unsupported API.
