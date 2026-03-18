# v0.13.184 Chat Thinking Placeholder Gating Fix

## 迭代完成说明

- 修正聊天消息列表中“Agent 正在思考...”占位卡片的展示条件
- 之前仅在存在 `streaming` assistant 草稿时才隐藏占位卡片，导致 assistant 已经开始输出但消息状态处于 `pending` 时，仍会额外出现一条“正在思考”卡片
- 现在改为：只要已经存在 assistant 的未完成草稿消息（`streaming` 或 `pending`），就不再展示该占位卡片
- 同步将共享 UI 组件的命名从 `hasStreamingDraft` 调整为更准确的 `hasAssistantDraft`
- 补充组件测试，覆盖“assistant 已开始输出但仍 pending 时不应再出现 typing placeholder”

## 测试/验证/验收方式

- `pnpm --filter @nextclaw/agent-chat-ui exec vitest run src/components/chat/ui/chat-message-list/chat-message-list.test.tsx`
- `pnpm --filter @nextclaw/ui tsc`

## 发布/部署方式

- 本次涉及前端 workspace 包源码，联调前需保证依赖当前源码或重新构建相关包
- 若走正式发布，至少需要覆盖 `@nextclaw/agent-chat-ui` 与 `@nextclaw/ui` 的构建/发布链路

## 用户/产品视角的验收步骤

1. 在 NCP 聊天页发起一轮需要 reasoning / tool 的对话
2. 在 assistant 还未返回任何内容前，确认会显示一条“Agent 正在思考...”占位卡片
3. 当 assistant 一旦开始输出 reasoning、正文或其它未完成消息后，确认这条占位卡片立即消失
4. 在整轮回复过程中，确认不会再额外多出一条重复的“Agent 正在思考...”消息卡片
