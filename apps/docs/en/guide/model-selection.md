# Model Selection Guide

This page gives copy-paste model strings for NextClaw and explains the exact format.

Last verified: **February 28, 2026**.

## Copy-Paste First (Frontier Picks)

These are selected from official provider docs and OpenRouter's live model catalog on **2026-02-28**.

```text
# OpenRouter frontier routes (recommended when you use multi-provider)
openrouter/openai/gpt-5.3-codex
openrouter/anthropic/claude-opus-4.6
openrouter/google/gemini-3.1-pro-preview
openrouter/deepseek/deepseek-v3.2
openrouter/qwen/qwen3.5-397b-a17b
openrouter/z-ai/glm-5
openrouter/minimax/minimax-m2.5
openrouter/moonshotai/kimi-k2.5

# Direct provider routes (stable/common)
gpt-5.1
gpt-5-pro
claude-opus-4-1
claude-sonnet-4
gemini/gemini-2.5-pro
deepseek/deepseek-chat
deepseek/deepseek-reasoner
dashscope/qwen-max-latest
zai/glm-5
minimax/MiniMax-M2.5
groq/openai/gpt-oss-120b
```

## Format Rules

1. Multi-provider setup: prefer explicit routes like `openrouter/...`, `deepseek/...`, `dashscope/...`.
2. Single-provider setup: provider-native model id usually works.
3. Model ids are case-sensitive; always copy from official docs or `/v1/models`.

## OpenRouter Rule (Exact)

Use this format in NextClaw:

- `openrouter/<upstream-provider>/<model-id>`

Examples:

- `openrouter/openai/gpt-5.3-codex`
- `openrouter/anthropic/claude-opus-4.6`
- `openrouter/deepseek/deepseek-v3.2`

## Why Some IDs Differ Between Direct Provider and OpenRouter

OpenRouter's latest ids can appear earlier than provider direct docs aliases.
So keep two habits:

- If you route through OpenRouter, copy from OpenRouter model catalog.
- If you route directly to a provider, copy from that provider's official model docs.

## Official Sources

- OpenRouter models: https://openrouter.ai/models
- OpenRouter models API: `GET https://openrouter.ai/api/v1/models`
- OpenAI models: https://platform.openai.com/docs/models
- Anthropic models: https://docs.anthropic.com/en/docs/about-claude/models/all-models
- Google Gemini models: https://ai.google.dev/gemini-api/docs/models
- Google Gemini release notes: https://ai.google.dev/gemini-api/docs/release-notes
- DeepSeek reasoning model guide: https://api-docs.deepseek.com/guides/reasoning_model
- DashScope model list: https://www.alibabacloud.com/help/en/model-studio/getting-started/models
- MiniMax model list: https://www.minimax.io/platform/document/ChatCompletion_v2
- Zhipu model overview: https://docs.bigmodel.cn/cn/guide/models/model-overview
- Groq models: https://console.groq.com/docs/models

## Troubleshooting

- `404 model not found`: verify spelling/case first.
- Routed to wrong provider: switch to explicit route (for example `deepseek/...` or `openrouter/...`).
- Works in provider console but fails in NextClaw: re-check API key/base URL in **Providers** page for the intended provider.
