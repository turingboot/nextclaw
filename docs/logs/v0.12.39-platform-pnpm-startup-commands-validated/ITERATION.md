# v0.12.39-platform-pnpm-startup-commands-validated

## 1) 迭代完成说明（改了什么）

本次针对“平台前后端需要可直接通过 pnpm 命令启动”的诉求，补齐并标准化了根命令入口，并新增一键联启脚本。

- 根命令新增（`package.json`）：
  - `dev:platform:frontend`
  - `dev:platform:backend`
  - `dev:platform:stack`
  - `dev:platform:stack:migrate`
  - `platform:db:migrate:local`
  - `platform:db:migrate:remote`
- 新增脚本：`scripts/dev-platform-runner.mjs`
  - 自动选择可用端口（避免冲突）
  - 同时拉起 Worker 后端与平台前端
  - 支持 `--migrate` 先执行本地 D1 migration
  - 支持 `--check` 启动前健康检查
  - 支持通过 `NEXTCLAW_PLATFORM_WRANGLER_PERSIST_TO` 把 wrangler 本地状态写到隔离目录（便于无污染冒烟）
- 登录门禁顺序修正：`/v1/chat/completions` 先校验登录，再校验上游 provider 配置，确保未登录请求返回 401。

## 2) 测试/验证/验收方式

- 构建/静态验证
  - `pnpm -C workers/nextclaw-provider-gateway-api build`
  - `pnpm -C workers/nextclaw-provider-gateway-api lint`
  - `pnpm -C workers/nextclaw-provider-gateway-api tsc`
  - `pnpm -C apps/platform-console build`
  - `pnpm -C apps/platform-console lint`
  - `pnpm -C apps/platform-console tsc`
  - `pnpm -C packages/nextclaw build`
  - `pnpm -C packages/nextclaw lint`
  - `pnpm -C packages/nextclaw tsc`
- 一键命令验证
  - `node scripts/dev-platform-runner.mjs --check`
  - `NEXTCLAW_PLATFORM_BACKEND_PORT=8890 NEXTCLAW_PLATFORM_FRONTEND_PORT=5190 NEXTCLAW_PLATFORM_WRANGLER_PERSIST_TO=/tmp/... pnpm dev:platform:stack:migrate`
  - 观察点：
    - `http://127.0.0.1:8890/health` 返回 `ok: true`
    - `http://127.0.0.1:5190` 返回平台前端页面（title 含 `NextClaw Platform Console`）
- 业务链路冒烟（隔离路径）
  - 注册 admin + user
  - 用户提交充值申请，admin 审核通过
  - 用户余额增加
  - `POST /v1/chat/completions`：
    - 不带 token => `401`
    - 带 token 且未配置上游 key => `503`
- CLI 登录冒烟
  - `nextclaw login --api-base http://127.0.0.1:8793 --register ...`
  - 观察点：`NEXTCLAW_HOME/config.json` 中 `providers.nextclaw.apiKey` 为 `nca.` 前缀 token，`apiBase` 为 `.../v1`

## 3) 发布/部署方式

- 命令层无需额外发布系统即可本地可用（仓库内开发态）
- 若需上线平台后端：
  1. `pnpm platform:db:migrate:remote`
  2. `pnpm -C workers/nextclaw-provider-gateway-api deploy`
- 若需上线平台前端：
  1. `pnpm -C apps/platform-console build`
  2. 发布 `apps/platform-console/dist`

## 4) 用户/产品视角的验收步骤

1. 在仓库根目录执行 `pnpm dev:platform:stack:migrate`。
2. 打开前端地址，确认登录页可访问。
3. 注册用户并登录，确认用户账单页可见。
4. 另开账号（admin）登录管理页，完成充值审核。
5. 回到用户页确认余额变更。
6. 使用未登录请求调用 `/v1/chat/completions`，确认被 401 拦截；登录后可进入业务流。
