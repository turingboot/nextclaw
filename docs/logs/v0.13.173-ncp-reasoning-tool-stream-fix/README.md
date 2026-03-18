# 迭代完成说明

本次迭代修复了 NCP native chat 链路里与 `reasoning` / `tool` 相关的两个关键问题：

- 修复 assistant 在 tool round 续跑时丢失 `reasoning_content`，避免 DeepSeek thinking + tool calls 场景下出现 `400 Missing reasoning_content field`。
- 修复 reasoning 在 NCP 事件流中的顺序问题，避免同一 chunk 同时携带 reasoning 与 text 时，被错误编码成“text 在前、reasoning 在后”。

同时也做了两项结构性修正：

- `DefaultNcpAgentRuntime` 不再通过“消费自己刚发出的 NCP 事件”来驱动下一轮 tool round，而是直接从原始 LLM chunk 收集 round 信息。
- session store 在写回 legacy session 时增加 `ncp_parts` 保真字段，用于在重新加载会话时恢复 assistant part 的原始顺序，避免存储层把顺序降级成固定拼装顺序。

另外，provider 流式链路也向前推进了一步：

- core provider stream event 现在支持 `reasoning_delta` 与 `tool_call_delta`。
- OpenAI compatible provider 会把底层 chunk 中真实出现的 reasoning / tool deltas 向上透传。
- NCP provider bridge 会把这些 delta 继续映射成 NCP chunk/event。

这意味着：

- 如果底层 provider 本身真的按流式逐步吐 reasoning / tool delta，NCP 链路不再把它们压扁到最终 `done` 一起出现。
- 如果底层 provider 仍然只在最终结果里一次性给出 reasoning / tool call，那么前端看到“顺序对，但几乎同时出现”仍是 provider 原始行为，而不是 NCP/前端错误重排。

# 测试/验证/验收方式

已执行验证：

- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/core build`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/ncp build`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/ncp-agent-runtime build`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter nextclaw tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter nextclaw exec vitest run src/cli/commands/ncp/create-ui-ncp-agent.test.ts src/cli/commands/ncp/stream-encoder-order.test.ts src/cli/commands/ncp/nextclaw-agent-session-store.test.ts`

本次新增回归点：

- `stream-encoder-order.test.ts`
  - 验证 reasoning 与 text 同 chunk 时，NCP 事件顺序为 reasoning 在前。
- `nextclaw-agent-session-store.test.ts`
  - 验证 assistant part 顺序在 save/load 后保持不变。
- `create-ui-ncp-agent.test.ts`
  - 验证 tool round 续跑时会把 `reasoning_content` 带进 assistant(tool_calls) 历史消息。

# 发布/部署方式

本次未执行正式发布。

为了让当前工作区运行时实际吃到修复后的内部包实现，已在本地重新构建：

- `@nextclaw/core`
- `@nextclaw/ncp`
- `@nextclaw/ncp-agent-runtime`

如果后续需要正式发布，应继续按既有版本与发布流程处理。

# 用户/产品视角的验收步骤

1. 在 NCP 链路下触发一个会产生 reasoning + tool call 的请求。
2. 观察流式过程：
   - reasoning part 不应再因为 NCP 编码顺序问题落到 text 后面。
   - 如果底层 provider 本身会流式吐 reasoning/tool delta，应能看到更自然的逐步出现。
3. 继续让同一轮发生 tool round 续跑，确认不再出现 `400 Missing reasoning_content field`。
4. 刷新页面或重新进入同一会话，确认 assistant message 的 part 顺序不会在重载后被改写。
