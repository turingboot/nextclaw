# 2026-03-26 v0.14.215-feishu-typing-feedback-bridge-fix

## 迭代完成说明

- 修复 compat runtime bridge 未触发 `onReplyStart` 的问题。
- `packages/nextclaw/src/cli/commands/service-plugin-runtime-bridge.ts` 现在会在调用 `runtimePool.processDirect()` 前先执行 `dispatcherOptions.onReplyStart?.()`。
- 这会让飞书 reply dispatcher 里已经存在的即时反馈链路重新生效，包括：
  - 对入站消息添加 Feishu `Typing` reaction
  - 在 reply 结束后移除该 reaction
- 同步补齐 bridge 类型合同：`packages/nextclaw-openclaw-compat/src/plugins/types.ts` 的 `dispatcherOptions` 现在显式声明 `onReplyStart`。
- 新增回归测试，锁定“先触发 `onReplyStart`，再进入 runtime processing”的调用顺序。

## 测试/验证/验收方式

- 单测：
  - `PATH=/Users/peiwang/.nvm/versions/node/v22.16.0/bin:/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw exec vitest run src/cli/commands/service-plugin-runtime-bridge.test.ts`
- 类型检查：
  - `PATH=/Users/peiwang/.nvm/versions/node/v22.16.0/bin:/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw tsc`
- 可维护性检查：
  - `PATH=/Users/peiwang/.nvm/versions/node/v22.16.0/bin:/opt/homebrew/bin:$PATH node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths packages/nextclaw/src/cli/commands/service-plugin-runtime-bridge.ts packages/nextclaw/src/cli/commands/service-plugin-runtime-bridge.test.ts packages/nextclaw-openclaw-compat/src/plugins/types.ts`

## 发布/部署方式

- 本次改动影响本地/发布版 NextClaw 的 plugin runtime bridge。
- 合并后需要重新构建并发布 `nextclaw`，让本地实例升级到包含该 bridge 修复的版本。
- 本地验证时重启 `nextclaw` 服务即可生效；若走 npm 发布链路，则按项目既有 release 流程发版后执行 `nextclaw update && nextclaw restart`。

## 用户/产品视角的验收步骤

1. 保持飞书渠道已登录、可正常收发消息。
2. 向机器人发送一条普通文本消息。
3. 预期结果：机器人在真正输出回答前，先立即给原消息增加一个可见的即时反馈（当前为 Feishu `Typing` reaction）。
4. 当最终回答发出后，预期该临时 `Typing` reaction 被清理，不长期残留。
5. 若后续希望体验更强，可继续在此基础上评估是否增加更显眼的 card streaming `Thinking...` 占位态。
