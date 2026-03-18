# 迭代完成说明

本次迭代把 Nextclaw 的 UI NCP agent 后端执行主链路，从 bridge runtime 正式切到基于 `DefaultNcpAgentRuntime` 的 NCP-native 装配方式。

核心变化：

- `createUiNcpAgent` 不再通过 `NextclawUiNcpRuntime -> runtimePool.processDirect()` 桥接 legacy runtime
- UI NCP agent 现在直接装配：
  - `DefaultNcpAgentBackend`
  - `DefaultNcpAgentRuntime`
  - `NextclawNcpContextBuilder`
  - `NextclawNcpToolRegistry`
  - `ProviderManagerNcpLLMApi`
  - `NextclawAgentSessionStore`
- 新增 NCP 消费方装配积木：
  - `nextclaw-ncp-context-builder.ts`
  - `nextclaw-ncp-tool-registry.ts`
  - `nextclaw-ncp-message-bridge.ts`
- 删除 bridge runtime 相关文件：
  - `nextclaw-ui-ncp-runtime.ts`
  - `nextclaw-ui-ncp-runtime.test.ts`
- 补齐 `@nextclaw/core` 导出，便于复用 Nextclaw 现有真实能力
- `service.ts` 已改为向 `createUiNcpAgent` 注入 bus / provider / gateway / config / extension / tool hints 等真实依赖
- session metadata 的 model / thinking 等偏好会持久化并在后续 turn 中复用

配套方案文档：

- [NCP Native Runtime Refactor Plan](../../plans/2026-03-18-ncp-native-runtime-refactor-plan.md)

# 测试/验证/验收方式

已执行的最小充分验证：

- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/core tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter nextclaw tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter nextclaw exec vitest run src/cli/commands/ncp/create-ui-ncp-agent.test.ts`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/server exec vitest run src/ui/router.ncp-agent.test.ts`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/core build`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter nextclaw build`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/server build`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter nextclaw lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/core lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/server lint`

本次重点验收点：

- UI NCP agent 的 runtime 已进入 `DefaultNcpAgentRuntime`
- skill 内容能进入 prompt
- 工具调用经过真实 `NextclawNcpToolRegistry`
- session metadata 能写回并在后续 turn 复用
- server 侧 NCP agent 路由回归通过

# 发布/部署方式

本次迭代属于代码与运行时链路落地，默认不自动发布。

如需后续发布，建议顺序：

1. 先基于当前分支继续做 capability parity 验证。
2. 确认默认链路切换策略与验收范围。
3. 再按项目既有发布流程执行版本提升、发布或部署。

# 用户/产品视角的验收步骤

1. 打开聊天 UI，确认当前默认或指定 `ncp` 链路时，消息可以正常发送与回复。
2. 在 NCP 链路下验证会话创建、切换、删除、历史读取是否保持一致。
3. 触发一个需要工具的请求，确认工具调用与结果能正常出现在消息流中。
4. 在一次对话中指定 `model` / `thinking`，再继续追问，确认后续 turn 仍沿用该偏好。
5. 如需做结构验收，可对照 [NCP Native Runtime Refactor Plan](../../plans/2026-03-18-ncp-native-runtime-refactor-plan.md)，确认当前已完成“bridge runtime 退出主链路”的阶段目标。
