# v0.13.178-ncp-chat-seed-loader-stability-fix

## 迭代完成说明

- 修复 NCP chat 在新会话中首次发送消息后，用户消息和回复都消失的问题。
- 根因是 `loadSeed` 依赖了 `selectedSessionKey`。
- 当新会话第一次发送时，前端会先从草稿态切到正式路由态；虽然 `sessionId` 实际没变，但 `selectedSessionKey` 变化会让 hydrated agent 重新执行一次 seed reload。
- 这次额外 hydrate 会 `manager.reset()`，把刚进入发送链路的本地状态清空，因此表现成“回车后什么都看不到”。
- 现在改为：seed loader 仅基于 `sessionId` 工作，不再因为 `selectedSessionKey` 的切换而重新创建 hydrate 流程；后端返回 `ncp session not found` 时仍视为空草稿会话处理。

## 测试/验证/验收方式

- 运行：
  - `pnpm --filter @nextclaw/ui tsc`
- 观察点：
  - 新建 NCP 会话后第一次发送消息，用户消息应立即可见。
  - assistant 回复应继续正常流式展示。
  - 刷新已有会话时，历史自动加载能力不受影响。

## 发布/部署方式

- 当前为前端行为修复。
- 本地开发热更新或重启前端后即可生效。
- 如需正式发布，按常规前端发布流程带上本次修复。

## 用户/产品视角的验收步骤

- 打开 chat 首页并新建一个 NCP 会话。
- 输入一条消息直接按回车发送。
- 确认用户消息不会消失，assistant 能继续回复。
- 再打开一个已有会话并刷新，确认历史仍会自动加载。
