# 本地 Ollama + Qwen3 教程（macOS）

本教程用于把 NextClaw 的本地链路一次跑通：

1. 启动本地 Ollama
2. 拉取 Qwen3 小模型
3. 通过 OpenAI 兼容方式（`vllm` provider）接入 NextClaw
4. 用真实 CLI 冒烟验证可用性

## 前置条件

- 已安装并可运行 NextClaw CLI。
- 已安装 Ollama。
- 机器内存满足模型运行需求。

推荐起步模型：

- `qwen3:1.7b`（速度与效果平衡）

备选：

- `qwen3:0.6b`（更快，但效果更弱）

## 1）启动 Ollama

macOS（Homebrew 后台服务）：

```bash
brew services start ollama
```

或前台运行：

```bash
ollama serve
```

## 2）拉取并验证 Qwen3 模型

```bash
ollama pull qwen3:1.7b
ollama list
ollama run qwen3:1.7b "请只回复：OK"
```

预期：模型返回 `OK`。

## 3）配置 NextClaw 使用本地 Ollama

把 `vllm` provider 指向 Ollama 的 OpenAI 兼容端点：

```bash
nextclaw config set providers.vllm '{"apiKey":"dummy","apiBase":"http://127.0.0.1:11434/v1"}' --json
```

设置默认模型：

```bash
nextclaw config set agents.defaults.model '"hosted_vllm/qwen3:1.7b"' --json
nextclaw config get agents.defaults.model
```

预期模型字符串：

```text
hosted_vllm/qwen3:1.7b
```

为什么建议带 `hosted_vllm/` 前缀：

- 当你配置了多个 provider 时，可避免模型路由到错误 provider。

## 4）启动 NextClaw 并打开 UI

```bash
nextclaw start --ui-port 55667
```

浏览器打开：

- `http://127.0.0.1:55667`

需要停止时：

```bash
nextclaw stop
```

## 5）CLI 冒烟测试

```bash
nextclaw agent -m "请只回复：NEXTCLAW-OK"
nextclaw agent -m "只回复数字：1+1="
```

预期输出：

- `NEXTCLAW-OK`
- `2`

## 故障排查

### `model not found`

- 先用 `ollama list` 确认 `qwen3:1.7b` 已存在。
- 再执行一次 `ollama pull qwen3:1.7b`。

### `connection refused` / 连接测试失败

- 确认 Ollama 服务已启动。
- 确认 `apiBase` 精确为 `http://127.0.0.1:11434/v1`。

### 模型被路由到错误 provider

- 默认模型请保持为 `hosted_vllm/qwen3:1.7b`，不要只写 `qwen3:1.7b`。

### UI 端口冲突

- 改端口启动，例如：

```bash
nextclaw start --ui-port 18991
```

## 相关文档

- [配置](/zh/guide/configuration)
- [模型选型指南](/zh/guide/model-selection)
- [故障排查](/zh/guide/troubleshooting)
