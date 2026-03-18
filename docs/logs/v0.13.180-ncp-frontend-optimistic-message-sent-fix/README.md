# v0.13.180-ncp-frontend-optimistic-message-sent-fix

## 迭代完成说明

- 修复 NCP chat 中用户按回车后，自己的消息不能立即显示的问题。
- 这次修复落在前端 state manager 层，而不是继续依赖后端事件到达。
- `useNcpAgentRuntime.send()` 现在会在发请求前，先向本地 conversation state manager dispatch 一次 `message.sent`，让用户消息立即进入消息列表。
- 如果 `client.send()` 失败，前端会回滚到发送前快照，避免本地 optimistic 消息残留成脏状态。
- 这与 backend 的 `message.sent` 时序修复不冲突：前端负责即时交互，后端负责权威事件顺序和多订阅者一致性。

## 测试/验证/验收方式

- 运行：
  - `pnpm --filter @nextclaw/ncp-react build`
  - `pnpm --filter @nextclaw/ui tsc`
- 观察点：
  - 用户按回车后，自己的消息应立即出现在消息列表。
  - 若发送失败，不应残留一条错误的本地用户消息。

## 发布/部署方式

- 当前为 `@nextclaw/ncp-react` + UI 消费链路修复。
- 本地 workspace 环境下，重新构建 `@nextclaw/ncp-react` 后即可让 UI 吃到新的 dist。
- 如需正式发布，按常规 NCP React/UI 相关包发布流程进行。

## 用户/产品视角的验收步骤

- 打开 NCP chat。
- 输入一条消息并直接按回车。
- 确认用户消息会立即显示，不再等待模型或网络首个返回事件。
- 如有网络/发送失败场景，确认不会留下一条“假发送成功”的本地消息。
