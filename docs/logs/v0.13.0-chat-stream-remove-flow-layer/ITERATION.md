# Iteration v0.13.0-chat-stream-remove-flow-layer

## 迭代完成说明（改了什么）
- 删除 `chat-stream-flow-controller.ts` 中间层。
- 将 flow 层能力直接并入 `ChatStreamManager`：
  - 消息发送策略（interrupt-and-send / enqueue）
  - pending 消息发送执行
  - pending run 恢复执行
  - active run 停止执行
  - 队列重排与流状态重置
- 保持 `presenter.chatStreamManager` 对外能力不变，调用方无需改业务代码。

## 测试/验证/验收方式
- 类型检查：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc --noEmit`
- ESLint（受影响文件）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui exec eslint src/components/chat/managers/chat-stream.manager.ts src/components/chat/chat-stream/stream-run-controller.ts src/components/chat/useChatStreamController.ts src/components/chat/presenter/chat.presenter.ts src/components/chat/managers/chat-input.manager.ts src/components/chat/managers/chat-session-list.manager.ts src/components/chat/managers/chat-thread.manager.ts`
- UI 构建：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C . build:ui`

## 发布/部署方式
- 本次仅前端结构收敛，不涉及后端/数据库。
- 按现有前端发布流程发布 UI 即可，无 migration。

## 用户/产品视角的验收步骤
1. 新建会话发送消息，确认用户消息与 AI 流式回复正常显示。
2. 运行中再次发送，确认中断并发送/入队逻辑符合当前策略。
3. 点击停止，确认可中断当前运行并保持队列行为正确。
4. 切换会话再返回，确认运行状态与消息线程一致。
