# Local Ollama + Qwen3 Tutorial (macOS)

This tutorial walks through a full local loop for NextClaw with Ollama + Qwen3:

1. Start Ollama locally
2. Pull a small Qwen3 model
3. Configure NextClaw to use Ollama via OpenAI-compatible `vllm` provider
4. Verify with real CLI smoke tests

## Prerequisites

- NextClaw CLI is installed and runnable.
- Ollama is installed.
- Your machine has enough memory for the selected model.

Recommended starter model:

- `qwen3:1.7b` (balanced speed/quality)

Alternative:

- `qwen3:0.6b` (faster, lower quality)

## 1) Start Ollama

macOS (Homebrew service):

```bash
brew services start ollama
```

Or foreground mode:

```bash
ollama serve
```

## 2) Pull and verify Qwen3 model

```bash
ollama pull qwen3:1.7b
ollama list
ollama run qwen3:1.7b "Please reply exactly: OK"
```

Expected: the model returns `OK`.

## 3) Configure NextClaw to use local Ollama

Set `vllm` provider to Ollama OpenAI-compatible endpoint:

```bash
nextclaw config set providers.vllm '{"apiKey":"dummy","apiBase":"http://127.0.0.1:11434/v1"}' --json
```

Set default model:

```bash
nextclaw config set agents.defaults.model '"hosted_vllm/qwen3:1.7b"' --json
nextclaw config get agents.defaults.model
```

Expected model string:

```text
hosted_vllm/qwen3:1.7b
```

Why use `hosted_vllm/` prefix:

- It avoids ambiguous routing when multiple providers are configured.

## 4) Start NextClaw and open UI

```bash
nextclaw start --ui-port 55667
```

Open:

- `http://127.0.0.1:55667`

Stop when needed:

```bash
nextclaw stop
```

## 5) CLI smoke tests

```bash
nextclaw agent -m "Please reply exactly: NEXTCLAW-OK"
nextclaw agent -m "Reply with number only: 1+1="
```

Expected outputs:

- `NEXTCLAW-OK`
- `2`

## Troubleshooting

### `model not found`

- Run `ollama list` and confirm `qwen3:1.7b` exists.
- Re-run `ollama pull qwen3:1.7b`.

### `connection refused` / provider test fails

- Ensure Ollama service is running.
- Confirm `apiBase` is exactly `http://127.0.0.1:11434/v1`.

### Wrong provider selected

- Keep model as `hosted_vllm/qwen3:1.7b` (with prefix), not plain `qwen3:1.7b`.

### UI port conflict

- Start with another port, for example:

```bash
nextclaw start --ui-port 18991
```

## Related docs

- [Configuration](/en/guide/configuration)
- [Model Selection Guide](/en/guide/model-selection)
- [Troubleshooting](/en/guide/troubleshooting)
