# 模型选型指南

本页给你“可直接复制”的模型串，并说明 NextClaw 里的正确格式。

最后校验时间：**2026 年 2 月 28 日**。

## 先复制可用的（前沿优先）

以下模型基于 **2026-02-28** 的官方文档 + OpenRouter 实时模型目录整理。

```text
# OpenRouter 前沿路由（多 provider 场景优先推荐）
openrouter/openai/gpt-5.3-codex
openrouter/anthropic/claude-opus-4.6
openrouter/google/gemini-3.1-pro-preview
openrouter/deepseek/deepseek-v3.2
openrouter/qwen/qwen3.5-397b-a17b
openrouter/z-ai/glm-5
openrouter/minimax/minimax-m2.5
openrouter/moonshotai/kimi-k2.5

# 直连 provider 路由（稳定/常用）
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

## 格式规则

1. 多 provider 同时配置时，优先写显式路由：`openrouter/...`、`deepseek/...`、`dashscope/...`。
2. 单 provider 场景下，通常可直接用该 provider 的模型 id。
3. 模型 id 区分大小写，务必从官方文档或 `/v1/models` 复制。

## OpenRouter 规则（精确格式）

在 NextClaw 中请使用：

- `openrouter/<上游-provider>/<模型-id>`

示例：

- `openrouter/openai/gpt-5.3-codex`
- `openrouter/anthropic/claude-opus-4.6`
- `openrouter/deepseek/deepseek-v3.2`

## 为什么“直连 provider”和“OpenRouter”模型名会不同

同一时期，OpenRouter 的新模型 id 往往会比某些 provider 直连文档 alias 更早可用。
因此建议：

- 走 OpenRouter：从 OpenRouter 模型目录复制。
- 直连 provider：从该 provider 官方模型文档复制。

## 官方来源

- OpenRouter 模型目录：https://openrouter.ai/models
- OpenRouter 模型 API：`GET https://openrouter.ai/api/v1/models`
- OpenAI 模型：https://platform.openai.com/docs/models
- Anthropic 模型：https://docs.anthropic.com/en/docs/about-claude/models/all-models
- Google Gemini 模型：https://ai.google.dev/gemini-api/docs/models
- Google Gemini 更新日志：https://ai.google.dev/gemini-api/docs/release-notes
- DeepSeek 推理模型指南：https://api-docs.deepseek.com/guides/reasoning_model
- DashScope 模型列表：https://www.alibabacloud.com/help/en/model-studio/getting-started/models
- MiniMax 模型列表：https://www.minimax.io/platform/document/ChatCompletion_v2
- 智谱模型总览：https://docs.bigmodel.cn/cn/guide/models/model-overview
- Groq 模型列表：https://console.groq.com/docs/models

## 常见问题

- `404 model not found`：先检查拼写和大小写。
- 路由到错误 provider：改用显式路由（如 `deepseek/...` 或 `openrouter/...`）。
- 在 provider 控制台可用但 NextClaw 不可用：检查 **Providers** 页该 provider 的 API Key / API Base。
