# v0.14.27 Session Preferences And Plugin Hot Plug

## 迭代完成说明

- 会话级模型选择与 `thinking effort` 现在会持久化到 session metadata。
- legacy 链路继续走 `/api/sessions/:key`；NCP 链路补齐了 `/api/ncp/sessions/:sessionId` 的更新能力，前端分别写入各自 session store，不再错误复用旧接口。
- 重新进入会话时，前端会从已持久化的 session metadata 恢复模型与 `thinking effort`。
- 插件热更新链路从“`plugins.*` 变化默认重启 channels”改成“先热更新插件注册表，再仅在确实影响 channel runtime 时重载 channels”。
- 对 codex 这类 runtime/tool/session-type 插件，安装、启用、禁用、卸载不再附带不必要的 channel restart，更接近 VSCode 式热插拔。
- 修复了发布阻塞的 server lint 问题：移除未使用的 `CLAWBAY_CHANNEL_PLUGIN_NPM_SPEC` 导入。

## 测试/验证/验收方式

- `pnpm --filter @nextclaw/ui test -- --run src/components/chat/chat-session-preference-sync.test.ts src/components/chat/chat-page-runtime.test.ts src/components/chat/ncp/ncp-session-adapter.test.ts`
- `pnpm --filter @nextclaw/server test -- --run src/ui/router.session-type.test.ts src/ui/router.ncp-agent.test.ts`
- `pnpm --filter @nextclaw/core test -- --run src/config/reload.test.ts`
- `pnpm --filter nextclaw test -- --run src/cli/commands/plugin-reload.test.ts src/cli/commands/ncp/create-ui-ncp-agent.test.ts`
- `pnpm --filter @nextclaw/ncp-toolkit test -- --run src/agent/in-memory-agent-backend.test.ts`
- `pnpm --filter @nextclaw/ui tsc`
- `pnpm --filter @nextclaw/server tsc`
- `pnpm --filter @nextclaw/core tsc`
- `pnpm --filter nextclaw tsc`
- `pnpm --filter @nextclaw/ncp tsc`
- `pnpm --filter @nextclaw/ncp-toolkit tsc`

## 发布/部署方式

- 本次改动尚未发布。
- 后续发布时需要按既有 changeset / publish 流程重走一次完整发布闭环。
- 若包含 server 包发布，建议在本地先用 `pnpm dev start` 验证 NCP 会话偏好持久化与插件热插拔行为，再执行发布。

## 用户/产品视角的验收步骤

1. 打开任意已有 native 会话，切换模型与 `thinking effort`，离开会话再回来，确认输入区恢复到刚才的选择。
2. 打开任意已有 NCP 会话，切换模型与 `thinking effort`，刷新页面后重新进入该会话，确认选择仍然保留。
3. 在运行中的网页 UI 中安装或启用 codex 这类 NCP runtime 插件，确认无需重启服务即可看到新的 session type 选项。
4. 禁用或卸载同类非 channel 插件，确认 session type 选项即时消失，且不会伴随不必要的“像重启一样”的体验。
5. 若启用的是 channel 插件并修改其 channel 相关配置，确认只有真正受影响的 channel 发生重载，其他 UI 能力保持可用。
