# v0.13.182-chat-reasoning-default-expand

## 迭代完成说明

- 保持聊天中 AI 思考内容的原有展示样式不变，继续使用既有 `details / summary / pre` 结构。
- 调整前端行为：reasoning 区块默认展开，用户仍可手动收起。
- 补充并更新相关前端测试，确保 reasoning 展示与消息适配链路保持稳定。

## 测试/验证/验收方式

- `pnpm --filter @nextclaw/agent-chat-ui test`
- `pnpm --filter @nextclaw/agent-chat-ui tsc`
- `pnpm --filter @nextclaw/ui test -- src/components/chat/adapters/chat-message.adapter.test.ts`
- 可维护性自检：
  `python3 .codex/skills/post-edit-maintainability-guard/scripts/check_maintainability.py --paths packages/nextclaw-agent-chat-ui/src/components/chat/ui/chat-message-list/chat-reasoning-block.tsx packages/nextclaw-agent-chat-ui/src/components/chat/ui/chat-message-list/chat-message.tsx packages/nextclaw-agent-chat-ui/src/components/chat/view-models/chat-ui.types.ts packages/nextclaw-ui/src/components/chat/adapters/chat-message.adapter.ts packages/nextclaw-ui/src/components/chat/containers/chat-message-list.container.tsx packages/nextclaw-ui/src/lib/i18n.ts packages/nextclaw-ui/src/components/chat/adapters/chat-message.adapter.test.ts packages/nextclaw-agent-chat-ui/src/components/chat/ui/chat-message-list/chat-message-list.test.tsx`

## 发布/部署方式

- 本次为前端本地行为修正，按常规前端发布流程合入并部署 UI 即可。
- 无数据库 migration。
- 无后端发布前置动作。

## 用户/产品视角的验收步骤

1. 打开聊天页面，进入一段包含 AI 思考内容的会话。
2. 观察 reasoning 区块，确认页面初次渲染时默认已展开。
3. 确认 reasoning 的视觉样式与改动前保持一致，没有新增卡片化重设计。
4. 手动点击 `summary`，确认仍可正常收起与再次展开。
