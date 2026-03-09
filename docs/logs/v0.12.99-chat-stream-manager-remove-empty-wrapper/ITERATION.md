# Iteration v0.12.99-chat-stream-manager-remove-empty-wrapper

## 迭代完成说明（改了什么）
- 删除空壳层 `ChatStreamRuntimeController -> ChatStreamManager` 透传包装。
- 将原 `ChatStreamRuntimeController` 的完整实现直接下沉到 `managers/chat-stream.manager.ts` 中，`ChatStreamManager` 直接承担流式运行时职责。
- 删除已无引用文件：`chat-stream/chat-stream-runtime-controller.ts`。
- 保持外部调用方式不变：现有 `presenter.chatStreamManager` 与其他 manager 的调用点无需改动语义。

## 测试/验证/验收方式
- 类型检查：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc --noEmit`
- ESLint（受影响文件）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui exec eslint src/components/chat/managers/chat-stream.manager.ts src/components/chat/useChatStreamController.ts src/components/chat/presenter/chat.presenter.ts src/components/chat/managers/chat-input.manager.ts src/components/chat/managers/chat-session-list.manager.ts src/components/chat/managers/chat-thread.manager.ts`
- UI 构建：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C . build:ui`

## 发布/部署方式
- 本次仅前端代码结构收敛，无后端/数据库改动。
- 按常规前端发布流程部署即可，无 migration。

## 用户/产品视角的验收步骤
1. 在 Chat 页发送消息，确认可正常流式回复。
2. 运行中继续发送消息，确认中断与排队策略行为保持原有预期。
3. 验证停止生成、队列置顶/删除、恢复运行等行为无回归。
4. 切换会话后返回，确认运行状态与消息展示正常。
