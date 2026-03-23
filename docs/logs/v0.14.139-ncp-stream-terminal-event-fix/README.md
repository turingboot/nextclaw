# v0.14.139-ncp-stream-terminal-event-fix

## 迭代完成说明

- 修复 NCP 聊天通过 `appClient` 统一收口后的协议错位：`packages/nextclaw-ui/src/components/chat/ncp/ncp-app-client-fetch.ts` 现在会把 NCP 的终止事件列表一并传给 `appClient.openStream()`，允许这类 SSE 以 `run.finished` / `run.error` / `message.completed` 等终止事件自然收束，而不是强制要求 `final` 事件。
- 扩展 `appClient` 流模型：`packages/nextclaw-ui/src/transport/sse-stream.ts`、`packages/nextclaw-ui/src/transport/local.transport.ts`、`packages/nextclaw-ui/src/transport/remote.transport.ts` 以及 `packages/nextclaw-remote/src/remote-app-stream.ts` / `packages/nextclaw-remote/src/remote-app.adapter.ts` 现在支持“终止事件型 SSE”，保证本地与 remote multiplex 两条链路语义一致。
- 修复 NCP 前端错误恢复策略：`packages/ncp-packages/nextclaw-ncp-react/src/hooks/use-ncp-agent-runtime.ts` 不再在发送异常时把会话直接回滚到发送前；`packages/ncp-packages/nextclaw-ncp-toolkit/src/agent/agent-conversation-state-manager.ts` 在 `endpoint.error` 时会保留本轮消息并将流中的 assistant 消息标记为 `error`，避免“刚发的一轮消息和回复从前端消失，刷新后又回来”。
- 移除 `packages/nextclaw-ui/src/components/chat/ncp/ncp-session-adapter.ts` 中残留的调试日志，减少前端控制台噪音。
- 重新构建 `packages/nextclaw-ui` 与 `packages/nextclaw/ui-dist`，并把实际本机 `9808` 服务切换到 workspace 新构建，解除旧的 `nvm nextclaw@0.13.29` 服务链路。

## 测试 / 验证 / 验收方式

- 单测：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui test -- --run src/components/chat/ncp/ncp-app-client-fetch.test.ts src/transport/sse-stream.test.ts`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/ncp-packages/nextclaw-ncp-toolkit test -- src/agent/agent-conversation-state-manager.test.ts`
- 类型 / 构建：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc --pretty false`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/ncp-packages/nextclaw-ncp-react tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-remote tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-remote build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw build`
- maintainability guard：
  - `PATH=/opt/homebrew/bin:$PATH node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths packages/nextclaw-ui/src/transport/transport.types.ts packages/nextclaw-ui/src/transport/sse-stream.ts packages/nextclaw-ui/src/transport/local.transport.ts packages/nextclaw-ui/src/transport/remote.transport.ts packages/nextclaw-ui/src/components/chat/ncp/ncp-app-client-fetch.ts packages/nextclaw-ui/src/components/chat/ncp/ncp-session-adapter.ts packages/ncp-packages/nextclaw-ncp-react/src/hooks/use-ncp-agent-runtime.ts packages/ncp-packages/nextclaw-ncp-toolkit/src/agent/agent-conversation-state-manager.ts packages/nextclaw-remote/src/remote-app-stream.ts packages/nextclaw-remote/src/remote-app.adapter.ts`
  - 结果：`Errors: 0`，仅保留历史超预算 warning。
- 真实冒烟：
  - 隔离 home + 真实配置副本：`NEXTCLAW_HOME=/tmp/nextclaw-ncp-stream-fix.T35kAw node packages/nextclaw/dist/cli/index.js serve --ui-port 18888`
  - 隔离实例健康检查：`curl http://127.0.0.1:18888/api/health`
  - 隔离实例 NCP 聊天冒烟：`PATH=/opt/homebrew/bin:$PATH NEXTCLAW_HOME=/tmp/nextclaw-ncp-stream-fix.T35kAw pnpm smoke:ncp-chat -- --session-type native --model dashscope/qwen3-coder-next --port 18888 --prompt "Reply exactly OK" --json`
  - 实际本机 `9808` 服务切换后再次冒烟：`PATH=/opt/homebrew/bin:$PATH NEXTCLAW_HOME=/Users/peiwang/.nextclaw pnpm smoke:ncp-chat -- --session-type native --model dashscope/qwen3-coder-next --port 9808 --prompt "Reply exactly OK" --json`
  - 结果：两次 smoke 都返回 `ok: true`，终止事件为 `run.finished`，未再出现 `stream ended without final event`。
- 本地模式契约检查：
  - `curl -i http://127.0.0.1:9808/_remote/runtime`
  - 结果：`404 Not Found`，说明本地 UI 会继续使用 local transport，而不是误判成 remote runtime。

## 发布 / 部署方式

- 本轮尚未执行新的 npm / changeset 发布；当前修复已先在本机以 workspace 构建形式落地并接管实际服务：
  - 停止旧服务：`PATH=/opt/homebrew/bin:$PATH NEXTCLAW_HOME=/Users/peiwang/.nextclaw node packages/nextclaw/dist/cli/index.js stop`
  - 使用当前 workspace 构建启动实际服务：`PATH=/opt/homebrew/bin:$PATH NEXTCLAW_HOME=/Users/peiwang/.nextclaw node packages/nextclaw/dist/cli/index.js start --ui-port 9808`
- 实际服务进程已切到：
  - `/opt/homebrew/Cellar/node/25.6.1/bin/node /Users/peiwang/Projects/nextbot/packages/nextclaw/dist/cli/index.js serve --ui-port 9808`
- 后续如需对外发布，需补 changeset、version/publish、提交与线上安装验证。

## 用户 / 产品视角的验收步骤

1. 打开本地 UI：`http://127.0.0.1:9808`
2. 进入 NCP 聊天页，用当前默认模型发送一条简单消息，例如“回复 OK”。
3. 观察：
   - 前端不再报 `stream ended without final event`
   - 发送中的当前轮消息不会在出错时整轮消失
   - 正常完成时能看到 assistant 回复并稳定停在页面上
4. 如需确认本地模式契约，在浏览器 Network 中检查 `/_remote/runtime`：
   - 本地服务应返回 `404`
   - NCP 聊天仍能正常工作，说明页面已正确走 local transport + appClient 收口
