# 迭代完成说明

本次迭代继续修复 NCP native chat 链路中的两类问题：

- 修复 reasoning/tool call delta 被重复编码，导致工具参数被重复拼接、思考内容重复追加，进而引发工具参数异常与模型在错误上下文中的反复自我纠错。
- 修正 `DefaultNcpAgentRuntime` 的职责边界，不再通过消费自己刚发出的 NCP 事件来驱动下一轮 tool round，而是直接从原始 LLM chunk 收集 round 信息。

本次核心调整：

- `ProviderManagerNcpLLMApi`
  - 记录本轮是否已经流式发出 `text` / `reasoning` / `tool_calls`
  - 最终 `done` chunk 只补发“尚未流式发出”的字段，避免重复编码
- `DefaultNcpAgentRuntime`
  - 新增 `round-collector`，直接从原始 chunk 收集本轮的 text / reasoning / tool call
  - runtime loop 不再依赖 `NcpEventType.*` 反向驱动 round state
- 新增单测覆盖 provider bridge 去重逻辑

这次修复直接对应用户可见现象：

- 工具参数区不应再出现 `{\"path\": ...}{\"path\": ...}` 这种重复拼接
- reasoning 不应再被重复追加成长段自我纠错文本
- runtime 的 loop 与 state manager 的职责边界恢复清晰

# 测试/验证/验收方式

已执行验证：

- `PATH=/opt/homebrew/bin:$PATH pnpm --filter nextclaw tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter nextclaw exec vitest run src/cli/commands/ncp/provider-manager-ncp-llm-api.test.ts src/cli/commands/ncp/create-ui-ncp-agent.test.ts src/cli/commands/ncp/stream-encoder-order.test.ts src/cli/commands/ncp/nextclaw-agent-session-store.test.ts`

本次重点回归点：

- `provider-manager-ncp-llm-api.test.ts`
  - 验证 reasoning/tool delta 已流式发出后，最终 `done` 不再重复携带同样内容
- `create-ui-ncp-agent.test.ts`
  - 验证 tool round 续跑时仍保留 `reasoning_content`
- `stream-encoder-order.test.ts`
  - 验证 reasoning / text 顺序仍正确
- `nextclaw-agent-session-store.test.ts`
  - 验证 session reload 后 part 顺序仍保真

# 发布/部署方式

本次未执行正式发布。

如需在本地继续验收，建议直接基于当前工作区重新启动使用中的 NextClaw/NCP 服务进程，确保实际运行的是最新代码路径。

# 用户/产品视角的验收步骤

1. 在 NCP 链路下发起一个会触发工具调用的请求。
2. 观察工具参数展示，确认不会再出现重复拼接的 JSON 参数。
3. 观察 reasoning 展示，确认不会再不断重复同一段“我需要这样写/我需要指定路径”之类内容。
4. 继续验证同一轮若发生 tool round 续跑，确认不再出现前一轮的 `reasoning_content` 丢失报错。
