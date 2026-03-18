# v0.13.183-chat-reasoning-label-neutralization

## 迭代完成说明

- 保持 AI 思考内容默认展开的行为不变。
- 将 reasoning 区块文案从“查看推理内容”调整为更中性的“推理过程”。
- 更新相关前端测试，确保 reasoning 标题文案与当前交互语义一致。

## 测试/验证/验收方式

- `pnpm --filter @nextclaw/agent-chat-ui test -- src/components/chat/ui/chat-message-list/chat-message-list.test.tsx`
- 可维护性自检：
  `python3 .codex/skills/post-edit-maintainability-guard/scripts/check_maintainability.py --paths packages/nextclaw-ui/src/lib/i18n.ts packages/nextclaw-agent-chat-ui/src/components/chat/ui/chat-message-list/chat-message-list.test.tsx`

## 发布/部署方式

- 本次仅涉及前端文案语义修正，按常规前端发布流程合入并部署 UI 即可。
- 无数据库 migration。
- 无后端发布前置动作。

## 用户/产品视角的验收步骤

1. 打开任意包含 AI reasoning 的聊天消息。
2. 确认 reasoning 区块默认展开。
3. 确认标题文案显示为“推理过程”，不再显示“查看推理内容”。
4. 手动收起后确认样式与交互仍保持原有表现。
