# v0.13.179-ncp-immediate-user-message-visible-fix

## 迭代完成说明

- 修复 NCP chat 中用户按回车发送后，自己的消息不能立即显示的问题。
- 根因是 backend 之前把 `message.sent` 的发布时机放错了。
- 旧逻辑要等 runtime 先产出第一条 assistant 事件后，才把用户消息补发出去。
- 这会让用户消息展示被模型首 token、首轮 reasoning 或工具前准备时间拖住，表现成“回车后要等一会才看到自己发的话”。
- 现在改为：`AgentRunExecutor` 在 run 启动时就立即 dispatch + persist + yield `message.sent`，使前端能第一时间渲染用户消息。

## 测试/验证/验收方式

- 运行：
  - `pnpm --filter @nextclaw/ncp-toolkit exec vitest run src/agent/in-memory-agent-backend.test.ts`
- 观察点：
  - `message.sent` 出现在 assistant `message.text-delta` 之前。
  - 新会话和已有会话中，用户按回车后自己的消息应立刻可见。

## 发布/部署方式

- 当前为 NCP toolkit backend 行为修复。
- 若本地链路直接依赖 workspace 包，重新运行受影响测试/构建后即可生效。
- 如需正式发布，按常规 NCP 相关包发布流程进行。

## 用户/产品视角的验收步骤

- 打开 NCP chat。
- 输入一条消息并按回车。
- 确认用户消息会立刻出现在消息列表，不再等待 assistant 首个流式事件。
- 再观察 assistant 回复，确认后续流式行为不受影响。
