# 迭代完成说明

- 为 OpenAI-compatible provider 增加“是否允许自动回退到 `responses` API”的能力开关。
- 将 DashScope 标记为不参与自动 `responses` fallback，避免 `qwen3-coder-next` 这类模型在 `chat/completions` 失败后被错误送到 `responses`，触发 `Unsupported model`。
- 补充单测，覆盖“关闭 responses fallback 时，即使遇到 `chat/completions` 404 类错误也不会再误调用 responses”的场景。

# 测试/验证/验收方式

- `pnpm --dir packages/nextclaw-core test -- openai_provider.test.ts`
- `pnpm --dir packages/nextclaw-core tsc -p tsconfig.json`
- `pnpm --dir packages/nextclaw-runtime tsc -p tsconfig.json`
- 本地用真实配置复验 `dashscope/qwen3-coder-next` 的 chat stream，确认正常返回，不再出现错误回退。

# 发布/部署方式

- 已准备 changeset：`@nextclaw/core`、`@nextclaw/runtime`、`nextclaw` patch。
- 已执行发布前校验、`changeset version` 与 `changeset publish` 尝试。
- 当前阻塞：本机 npm 发布登录态失效，`npm whoami` 返回 `401 Unauthorized`，导致 scoped 包发布被 registry 拒绝；恢复 npm 登录后继续执行发布闭环即可。

# 用户/产品视角的验收步骤

1. 安装或更新到包含本次修复的 `nextclaw` 版本。
2. 使用默认 native 会话，选择或保持 `dashscope/qwen3-coder-next`。
3. 发送一条普通消息，确认不再出现 `Unsupported model: qwen3-coder-next`。
4. 观察聊天能正常开始、正常流式返回，并最终收到完整回复。
