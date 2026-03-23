# v0.14.138-local-runtime-probe-fallback-fix

## 迭代完成说明

- 修复 `appClient` 的本地 / 远程 runtime 探测回归：当本地 UI 服务对未知 `/_remote/runtime` 路径返回 HTML 页面时，`packages/nextclaw-ui/src/transport/app-client.ts` 现在会明确回退到 `LocalAppTransport`，不再因为 JSON 解析失败导致整个 transport 初始化挂掉。
- 修复 `packages/nextclaw-server/src/ui/server.ts` 的 SPA fallback 边界：本地 UI 服务不再把 `/_remote/*` 当成前端页面路由返回 `index.html`，而是返回 `404`，避免本地实例被误探测成 remote runtime。
- 新增回归测试：
  - `packages/nextclaw-ui/src/transport/app-client.test.ts`：覆盖 runtime probe 返回 HTML 时必须回退到 local transport。
  - `packages/nextclaw-server/src/ui/server.cors.test.ts`：覆盖本地 UI 服务对 `/_remote/runtime` 返回 `404`，同时普通页面路由继续返回 `index.html`。
- 这一轮是对上一轮 `appClient` 收口改造的本地模式回归修复，目标是恢复你预期中的“本地实例继续走 local transport，不因 remote 探测逻辑影响正常使用”。

## 测试/验证/验收方式

- UI transport 定向单测：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui test -- --run src/transport/app-client.test.ts src/api/client.test.ts src/api/config.stream.test.ts src/components/chat/ncp/ncp-app-client-fetch.test.ts`
- UI 类型检查：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc --pretty false`
- Server 定向单测：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-server test -- --run src/ui/server.cors.test.ts`
- Server 类型检查：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-server tsc`
- 预期结果：
  - 本地 UI 访问时，`/_remote/runtime` 不会再把 `index.html` 误当成 runtime JSON。
  - 本地实例会稳定回退到 local transport，继续读取已有 provider / config。

## 发布/部署方式

- 需要发布的包：
  - `@nextclaw/ui`
  - `@nextclaw/server`
  - `nextclaw`
  - `@nextclaw/mcp`（release group companion package）
- 标准发布链路：
  - 创建 changeset，覆盖 `@nextclaw/ui + @nextclaw/mcp + @nextclaw/server + nextclaw`
  - `PATH=/opt/homebrew/bin:$PATH NPM_CONFIG_USERCONFIG=/Users/peiwang/Projects/nextbot/.npmrc pnpm release:version`
  - `PATH=/opt/homebrew/bin:$PATH NPM_CONFIG_USERCONFIG=/Users/peiwang/Projects/nextbot/.npmrc pnpm release:publish`

## 用户/产品视角的验收步骤

1. 升级到 hotfix 后重启本地 `nextclaw` 服务。
2. 打开本地 UI，确认之前已有的 provider / 配置正常显示，不再出现“像没配置 provider”的状态。
3. 在浏览器 Network 面板中访问 `/_remote/runtime`，确认本地模式下它不是一个返回 HTML 200 的页面探测入口。
4. 在普通 chat 页面发送消息，确认本地实例可以正常请求并返回回复。
5. 刷新页面后再次确认消息和配置仍然正常展示。
