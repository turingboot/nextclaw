# v0.13.183 NCP Reply Tag Sanitization

## 迭代完成说明

- 在 `@nextclaw/ncp` 新增 reply tag 清洗积木，统一处理 `[[reply_to_current]]` 与 `[[reply_to:<id>]]`
- 在 NCP 会话状态管理器里接入该积木，确保 streaming、finalize、hydrate 时都不会把 reply tag 当正文展示
- 在 `nextclaw` 的 NCP session store / legacy message bridge 中接入相同清洗逻辑，避免 reply tag 被继续写入历史并在刷新后重新泄漏
- 为状态层与 session store 补充回归测试，覆盖“新消息 finalize 清洗”和“历史消息 hydrate 清洗”

## 测试/验证/验收方式

- `pnpm --filter @nextclaw/ncp build`
- `pnpm --filter @nextclaw/ncp-toolkit exec vitest run src/agent/agent-conversation-state-manager.test.ts`
- `pnpm --filter @nextclaw/ncp-toolkit build`
- `pnpm --filter nextclaw exec vitest run src/cli/commands/ncp/nextclaw-agent-session-store.test.ts`
- `pnpm --filter nextclaw build`

## 发布/部署方式

- 本次变更涉及 workspace 包源码，发布时至少需要重新构建并发布受影响的包：`@nextclaw/ncp`、`@nextclaw/ncp-toolkit`、`nextclaw`
- 若当前环境仅做本地验证，可直接使用上述 build 产物继续联调，无需额外部署步骤

## 用户/产品视角的验收步骤

1. 进入 NCP 聊天链路并发起一轮新对话
2. 观察 assistant 回复正文，确认不再出现 `[[reply_to_current]]` 或 `[[reply_to:<id>]]`
3. 刷新页面重新进入同一会话，确认历史消息里同样不出现 reply tag
4. 如有引用回复场景，确认正文保持干净，且不会因为刷新或历史回放再次露出控制标签
