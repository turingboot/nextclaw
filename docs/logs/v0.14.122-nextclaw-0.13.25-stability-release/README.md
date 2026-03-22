# v0.14.122-nextclaw-0.13.25-stability-release

## 迭代完成说明

- 完成本轮稳定性修复的正式 NPM 发布闭环。
- 已发布包：
  - `nextclaw@0.13.25`
  - `@nextclaw/server@0.10.21`
  - `@nextclaw/remote@0.1.17`
  - `@nextclaw/mcp@0.1.21`
  - `@nextclaw/ncp-mcp@0.1.21`
- 本轮发布包含两类通用修复：
  - UI API CORS 热路径不再依赖 `hono/cors`，并进一步绕开 `HonoRequest.header()` 热路径
  - remote runtime 状态在托管服务进程死亡后不再误报 `connected`

## 测试/验证/验收方式

- 发布前标准校验：
  - `pnpm release:publish`
- 发布前单包验证：
  - `pnpm -C packages/nextclaw-server test -- --run src/ui/server.cors.test.ts`
  - `pnpm -C packages/nextclaw-server lint`
  - `pnpm -C packages/nextclaw-server tsc`
  - `pnpm -C packages/nextclaw-server build`
  - `pnpm -C packages/nextclaw test -- --run src/cli/commands/remote-runtime-support.test.ts`
  - `pnpm -C packages/nextclaw tsc`
  - `pnpm -C packages/nextclaw build`
- 动态冒烟：
  - 对 UI `/api/health` 连续发送 1200 次带 `Origin` 的请求，确认服务持续可用且无异常空响应

## 发布/部署方式

1. 在仓库根目录执行 `pnpm release:version`
2. 执行 `pnpm release:publish`
3. 在目标服务器升级到 `nextclaw@0.13.25`
4. 重启 NextClaw 服务并执行 `/api/health`、`nextclaw status --json`、`nextclaw remote doctor --json` 验证

## 用户/产品视角的验收步骤

1. 在低内存 Linux 服务器安装 `nextclaw@0.13.25`。
2. 启动服务并持续访问 UI，确认页面不再出现 `ERR_EMPTY_RESPONSE`。
3. 访问 `/api/health`，确认稳定返回 `200`。
4. 杀掉托管进程后执行 `nextclaw status --json` 或相关 remote 诊断，确认状态不再误报已连接。
