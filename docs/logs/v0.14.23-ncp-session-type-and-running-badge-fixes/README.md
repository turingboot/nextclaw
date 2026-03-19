# v0.14.23 ncp session type and running badge fixes

## 迭代完成说明

- 修复了从已有会话页通过新建会话下拉选择 `Codex` 时，第一次进入草稿会话会被错误重置回 `native` 的问题。
- 修复了 NCP 聊天链路中，会话运行时左侧会话列表没有及时展示 running 标志的问题。
- 为上述两处补充了定向单测，分别覆盖：
  - draft 会话显式选择的 session type 不再被默认值覆写
  - NCP 本地运行中的会话会立即被映射为 running

## 测试/验证/验收方式

- 运行：
  - `pnpm --filter ./packages/nextclaw-ui test -- --run src/components/chat/useChatSessionTypeState.test.tsx src/components/chat/ncp/ncp-session-adapter.test.ts src/components/chat/ChatSidebar.test.tsx`
- 可维护性自检：
  - `python3 .codex/skills/post-edit-maintainability-guard/scripts/check_maintainability.py --paths packages/nextclaw-ui/src/components/chat/useChatSessionTypeState.ts packages/nextclaw-ui/src/components/chat/useChatSessionTypeState.test.tsx packages/nextclaw-ui/src/components/chat/ncp/NcpChatPage.tsx packages/nextclaw-ui/src/components/chat/ncp/ncp-session-adapter.ts packages/nextclaw-ui/src/components/chat/ncp/ncp-session-adapter.test.ts packages/nextclaw-ui/src/components/chat/ChatSidebar.tsx packages/nextclaw-ui/src/components/chat/ChatSidebar.test.tsx`

## 发布/部署方式

- 本次仅涉及 `nextclaw-ui` 前端逻辑，无 migration。
- 按常规前端发布流程发布相关 UI 包即可；本地开发可直接通过 `pnpm dev start` 验证。

## 用户/产品视角的验收步骤

1. 先进入任意一个已有会话。
2. 在左侧点击“新建任务”旁边的下拉，选择 `Codex`。
3. 进入新会话后，确认会话类型立即就是 `Codex`，不需要点第二次。
4. 在任意会话里发送消息，确认 AI 回复进行中时，左侧对应会话 item 会出现 running 标志。
5. 等回复结束，确认 running 标志会自动消失。
