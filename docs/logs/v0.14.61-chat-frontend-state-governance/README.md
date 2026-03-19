# v0.14.61-chat-frontend-state-governance

## 迭代完成说明

- 新增前端会话偏好治理模块 [chat-session-preference-governance.ts](../../../packages/nextclaw-ui/src/components/chat/chat-session-preference-governance.ts)，把 `model` / `thinking` 的候选值决策、最近同 runtime 回退、draft session materialize 保护、同步 hook 收敛到单一入口。
- `LegacyChatPage` 与 `NcpChatPage` 不再在页面层做 thinking hydrate，页面层只负责同步展示状态，避免再次形成“页面层二次业务决策”。
- `useChatPageData` 与 `useNcpChatPageData` 统一改为通过治理层同步会话偏好，前端真正形成：
  - query / session summary 只提供候选值
  - 治理层负责最终值决策
  - 页面层只消费结果
- 会话摘要模型补齐 `preferredThinking`：
  - UI `SessionEntryView` 增加 `preferredThinking`
  - NCP session summary adapter 会把 `preferred_thinking` 映射到共享 session entry
  - server `/api/sessions` 列表也开始返回 `preferredThinking`
- 为了不继续放大超长文件债务，把 server session 列表里的 metadata 读取抽到新文件 [session-list-metadata.ts](../../../packages/nextclaw-server/src/ui/session-list-metadata.ts)。

相关方案文档：

- [Chat Frontend State Governance Plan](../../../docs/plans/2026-03-19-chat-frontend-state-governance-plan.md)

## 测试/验证/验收方式

- UI 会话偏好与适配器测试：
  - `PATH=/opt/homebrew/bin:$PATH pnpm --dir packages/nextclaw-ui exec vitest run src/components/chat/chat-page-runtime.test.ts src/components/chat/ncp/ncp-session-adapter.test.ts src/components/chat/useChatSessionTypeState.test.tsx src/components/chat/chat-session-preference-sync.test.ts`
- UI 类型检查：
  - `PATH=/opt/homebrew/bin:$PATH pnpm --dir packages/nextclaw-ui tsc --noEmit`
- Server 会话列表回归测试：
  - `PATH=/opt/homebrew/bin:$PATH pnpm --dir packages/nextclaw-server exec vitest run src/ui/router.session-type.test.ts`
- Server 类型检查：
  - `PATH=/opt/homebrew/bin:$PATH pnpm --dir packages/nextclaw-server tsc`
- 受影响文件 lint：
  - `PATH=/opt/homebrew/bin:$PATH pnpm --dir packages/nextclaw-ui exec eslint src/components/chat/chat-session-preference-governance.ts src/components/chat/chat-page-data.ts src/components/chat/ncp/ncp-chat-page-data.ts src/components/chat/legacy/LegacyChatPage.tsx src/components/chat/ncp/NcpChatPage.tsx src/components/chat/chat-page-runtime.ts src/components/chat/chat-page-runtime.test.ts src/components/chat/ncp/ncp-session-adapter.ts src/components/chat/ncp/ncp-session-adapter.test.ts src/api/types.ts`
  - `PATH=/opt/homebrew/bin:$PATH pnpm --dir packages/nextclaw-server exec eslint src/ui/config.ts src/ui/types.ts src/ui/router.session-type.test.ts src/ui/session-list-metadata.ts`
- 可维护性自检：
  - `PATH=/opt/homebrew/bin:$PATH node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths packages/nextclaw-ui/src/components/chat/chat-session-preference-governance.ts packages/nextclaw-ui/src/components/chat/chat-page-data.ts packages/nextclaw-ui/src/components/chat/ncp/ncp-chat-page-data.ts packages/nextclaw-ui/src/components/chat/legacy/LegacyChatPage.tsx packages/nextclaw-ui/src/components/chat/ncp/NcpChatPage.tsx packages/nextclaw-ui/src/components/chat/chat-page-runtime.ts packages/nextclaw-ui/src/components/chat/chat-page-runtime.test.ts packages/nextclaw-ui/src/components/chat/ncp/ncp-session-adapter.ts packages/nextclaw-ui/src/components/chat/ncp/ncp-session-adapter.test.ts packages/nextclaw-server/src/ui/config.ts packages/nextclaw-server/src/ui/types.ts packages/nextclaw-server/src/ui/router.session-type.test.ts packages/nextclaw-server/src/ui/session-list-metadata.ts`

说明：

- `packages/nextclaw-ui/src/components/chat/chat-page-runtime.ts` 仍有既有 `max-lines-per-function` warning，不是本次新增问题。
- `packages/nextclaw-server/src/ui/config.ts` 仍是存量超预算文件，但本次没有继续增长，且已把新增 session metadata 读取逻辑拆出。

## 发布/部署方式

- 本次未发布 npm 包，也未部署服务。
- 如果后续要发布，应按仓库既有流程为受影响包走 version / publish 闭环。

## 用户/产品视角的验收步骤

1. 启动本地 chat 页面。
2. 新建一个会话，选择模型与 thinking。
3. 发送第一条消息，确认：
   - model 不会被旧会话值抢回
   - thinking 不会被页面 hydrate 或旧 summary 抢回
4. 再切换到另一个已有会话，确认：
   - 会按该会话自身持久化偏好恢复
   - 不是沿用上一会话的内存选择
5. 再切回新会话或新建草稿会话，确认 draft materialize 为真实 session 后，当前显式选择仍然稳定。
