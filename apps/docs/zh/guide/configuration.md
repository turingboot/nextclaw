# 配置

## 配置文件

- **配置文件：** `~/.nextclaw/config.json`
- **数据目录：** 可用 `NEXTCLAW_HOME=/path/to/dir` 覆盖（配置路径变为 `$NEXTCLAW_HOME/config.json`）。

## 最小配置

```json
{
  "providers": {
    "openrouter": { "apiKey": "sk-or-v1-xxx" }
  },
  "agents": {
    "defaults": { "model": "minimax/MiniMax-M2.5" }
  }
}
```

## Provider 示例

### OpenRouter（推荐）

```json
{
  "providers": { "openrouter": { "apiKey": "sk-or-v1-xxx" } },
  "agents": { "defaults": { "model": "minimax/MiniMax-M2.5" } }
}
```

### MiniMax（中国大陆）

```json
{
  "providers": {
    "minimax": {
      "apiKey": "sk-api-xxx",
      "apiBase": "https://api.minimaxi.com/v1"
    }
  },
  "agents": { "defaults": { "model": "minimax/MiniMax-M2.5" } }
}
```

### 本地 vLLM（或任意 OpenAI 兼容服务）

```json
{
  "providers": {
    "vllm": {
      "apiKey": "dummy",
      "apiBase": "http://localhost:8000/v1"
    }
  },
  "agents": { "defaults": { "model": "meta-llama/Llama-3.1-8B-Instruct" } }
}
```

支持的 Provider 包括 OpenRouter、OpenAI、Anthropic、MiniMax、Moonshot、Gemini、DeepSeek、DashScope、Zhipu、Groq、vLLM、AiHubMix 等。

## 运行时热更新（无需重启）

网关运行时，通过 UI 或 `nextclaw config set` 的以下配置可热应用：

- `providers.*`
- `channels.*`
- `agents.defaults.model`
- `agents.defaults.maxToolIterations`
- `agents.defaults.maxTokens`
- `agents.defaults.contextTokens`
- `agents.context.*`
- `tools.*`
- `plugins.*`

仍需重启的配置：

- UI 绑定端口（`--port` / `--ui-port`）
