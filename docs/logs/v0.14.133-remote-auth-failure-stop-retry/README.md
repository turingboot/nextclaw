# v0.14.133 Remote Auth Failure Stop Retry

## 迭代完成说明

- 修复 `pnpm dev start` 场景下 remote connector 在平台返回 `Invalid or expired token.` 时仍持续输出 `Reconnecting in 3s...` 的问题。
- 将 remote connector 的失败处理改为“显式鉴权失败即终止重连并保留错误态”，避免把配置/登录问题伪装成普通网络抖动。
- 新增一条回归测试，覆盖“平台 token 被拒绝时只报错一次、不继续自动重连、状态保持为 error”。

## 测试 / 验证 / 验收方式

- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-remote tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-remote lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw test -- --run src/cli/commands/remote-connector-runtime.test.ts`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw exec tsx --eval "...RemoteConnector auth failure smoke..."`
- `PATH=/opt/homebrew/bin:$PATH node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths packages/nextclaw-remote/src/remote-connector.ts packages/nextclaw-remote/src/remote-connector-error.ts packages/nextclaw/src/cli/commands/remote-connector-runtime.test.ts`

## 发布 / 部署方式

- 本次变更尚未执行发布或部署。
- 不适用原因：这是一次本地缺陷修复验证，当前目标是先消除 dev 启动阶段的错误重连噪音并确认行为正确；若后续需要发版，可按既有 NPM release 和 worker deploy 流程执行。

## 用户 / 产品视角的验收步骤

1. 保持 remote access 为启用状态，但使用一个已失效的 NextClaw 平台 token。
2. 运行 `pnpm dev start`。
3. 确认终端最多出现一次 `Remote connector error: Invalid or expired token.`。
4. 确认终端不再继续输出 `Remote connector disconnected. Reconnecting in 3s...`。
5. 重新执行 `nextclaw login` 或在浏览器里重新登录后再次启动，确认 remote connector 可恢复正常连接。
