# v0.13.177-ncp-new-session-draft-hydration-fix

## 迭代完成说明

- 修复 NCP chat 在新建会话后首次发送消息时报 `ncp session not found: <draft-session-id>` 的严重问题。
- 根因是前一轮历史自动加载修复后，前端在新草稿会话跳转到路由时，也会立即尝试 hydrate 历史。
- 但此时该 session 只是前端草稿 id，后端还未真正创建，历史接口返回 404。
- 现在改为：NCP hydrate 仍会主动尝试拉历史，但如果后端明确返回 `ncp session not found`，前端会把它视为“尚未落库的新草稿会话”，以空历史继续，而不是把它当成异常阻断发送链路。

## 测试/验证/验收方式

- 运行：
  - `pnpm --filter @nextclaw/ui tsc`
- 观察点：
  - 新建 NCP 会话后第一次发送消息，不再出现 `ncp session not found` 报错。
  - 已有会话刷新进入时，历史消息仍能自动加载。

## 发布/部署方式

- 当前为前端 hotfix。
- 本地开发直接热更新或重启前端即可生效。
- 如需正式发布，按常规前端发布流程带上本次修复。

## 用户/产品视角的验收步骤

- 点击新建会话。
- 直接输入第一条消息并发送。
- 确认消息可以正常发出，不再弹出 `ncp session not found`。
- 再刷新一个已有会话，确认历史自动加载能力没有被这次修复破坏。
