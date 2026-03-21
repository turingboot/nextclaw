# v0.14.100-remote-access-current-process-runtime-fix

相关方案：

- [账号登录与远程访问产品设计](../../plans/2026-03-21-nextclaw-account-and-remote-access-product-design.md)
- [远程中继休眠与成本优化设计](../../plans/2026-03-21-nextclaw-remote-relay-hibernation-cost-optimization-design.md)
- [远程访问整体执行计划](../../plans/2026-03-21-nextclaw-remote-access-overall-execution-plan.md)
- [上一轮 UI 收口修复](../v0.14.99-remote-access-ui-alignment-fix/README.md)

## 迭代完成说明

- 修复 `pnpm dev start` 场景下远程访问状态串读旧 managed service 快照的问题。现在远程访问状态、doctor 结果、`localOrigin`、`service.currentProcess` 都以当前 UI 进程为准，不再错误指向另一个历史端口。
- 修复 remote module 启动条件错误依赖 `config.ui.enabled` 的问题。现在只要当前这次 `serve`/dev 进程实际启用了 UI，就会正确启动远程 runtime，不会再出现 UI 已经可访问但远程访问一直显示“已断开”的假象。
- 修复远程访问控制链路。开启、关闭、重连不再通过重启另一个后台 managed service 来“碰运气修复”，而是直接控制当前进程里的 remote runtime，dev 与生产版统一为同一语义。
- 最终效果是：当前打开的本地实例就是远程访问的真实设备实例，平台设备列表里会出现当前端口对应的设备，且连接状态与本地页面一致。

## 测试/验证/验收方式

- 代码验证：
  - `pnpm -C packages/nextclaw-remote tsc`
  - `pnpm -C packages/nextclaw tsc`
  - `pnpm -C packages/nextclaw test remote-access-host.test.ts`
  - `pnpm -C packages/nextclaw-remote build`
  - `pnpm -C packages/nextclaw build`
- 可维护性检查：
  - `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths packages/nextclaw/src/cli/commands/remote-runtime-support.ts packages/nextclaw-remote/src/remote-service-module.ts packages/nextclaw/src/cli/commands/service-remote-runtime.ts packages/nextclaw/src/cli/commands/remote.ts packages/nextclaw/src/cli/commands/remote-access-host.ts packages/nextclaw/src/cli/commands/service-remote-access.ts packages/nextclaw/src/cli/commands/service.ts`
- dev 冒烟：
  - `NEXTCLAW_HOME=/tmp/nextclaw-dev-remote-smoke NEXTCLAW_DEV_BACKEND_PORT=18896 NEXTCLAW_DEV_FRONTEND_PORT=5196 pnpm dev start`
  - 验证 `http://127.0.0.1:18896/api/remote/status` 返回 `runtime.state=connected`、`service.currentProcess=true`、`localOrigin=http://127.0.0.1:18896`
  - 验证 `http://127.0.0.1:18896/api/remote/doctor` 中 `service-runtime` 为 `ok=true`
  - 验证平台设备列表出现 `http://127.0.0.1:18896` 对应设备
- 生产版冒烟：
  - `NEXTCLAW_HOME=/tmp/nextclaw-prod-remote-smoke node packages/nextclaw/dist/cli/index.js serve --ui-port 18897`
  - 验证 `http://127.0.0.1:18897/api/remote/status` 返回 `runtime.state=connected`、`service.currentProcess=true`、`localOrigin=http://127.0.0.1:18897`
  - 验证 `http://127.0.0.1:18897/api/remote/doctor` 中 `service-runtime` 为 `ok=true`
  - 验证平台设备列表出现 `http://127.0.0.1:18897` 对应设备

## 发布/部署方式

- 新增 changeset，覆盖 `@nextclaw/remote`、`@nextclaw/mcp`、`@nextclaw/server`、`nextclaw`
- 执行 `pnpm release:version`
- 执行 `pnpm release:publish`
- 发布后校验：
  - `npm view @nextclaw/remote version`
  - `npm view @nextclaw/mcp version`
  - `npm view @nextclaw/server version`
  - `npm view nextclaw version`
- 本次未触达 Cloudflare 平台前端/后端代码，不需要额外执行 `deploy:platform`

## 用户/产品视角的验收步骤

1. 用 `pnpm dev start` 启动本地实例，打开 `5174` 对应页面并进入“远程访问”。
2. 开启远程访问后，页面不应再长期显示“已断开”；连接成功时应显示已连接或在线状态。
3. 点击“查看我的设备”进入平台设备列表，应能看到当前这个本地实例，而不是看不到设备或只出现其它旧端口设备。
4. 在平台设备列表点击打开后，进入的设备页面应对应当前本地实例。
5. 使用生产版 `nextclaw serve --ui-port <port>` 重复上述流程，结果应与 dev 场景一致。
