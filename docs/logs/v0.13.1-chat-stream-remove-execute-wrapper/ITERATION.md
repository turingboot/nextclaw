# Iteration v0.13.1-chat-stream-remove-execute-wrapper

## 迭代完成说明（改了什么）
- 移除 `stream-run-controller.ts` 中无增益的包装函数：
  - 删除 `executeStreamRun(params)`（仅 `new StreamRunController(params).execute()` 的套壳）。
- 在 `ChatStreamManager` 中直接执行：
  - `await new StreamRunController({...}).execute()`
- 保持运行语义不变，仅减少一层无意义函数抽象。

## 测试/验证/验收方式
- 类型检查：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc --noEmit`
- ESLint（受影响文件）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui exec eslint src/components/chat/managers/chat-stream.manager.ts src/components/chat/chat-stream/stream-run-controller.ts`
- UI 构建：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C . build:ui`

## 发布/部署方式
- 本次为前端代码结构收敛，无后端/数据库改动。
- 按现有前端发布流程发布 UI 即可，无 migration。

## 用户/产品视角的验收步骤
1. 新会话发送消息，确认消息流正常。
2. 运行中再次发送，确认中断/入队策略与当前行为一致。
3. 停止生成后，确认状态退出与队列行为正常。
