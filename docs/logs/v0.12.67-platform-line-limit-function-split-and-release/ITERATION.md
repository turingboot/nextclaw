# ITERATION

## 迭代完成说明（改了什么）
- 在不新增 ESLint 例外的前提下，完成 3 个超限函数拆分，恢复 `max-lines-per-function`（150）下的 lint 通过：
  - `apps/platform-admin/src/pages/AdminDashboardPage.tsx`
  - `apps/platform-console/src/pages/AdminDashboardPage.tsx`
  - `workers/nextclaw-provider-gateway-api/src/services/platform-service.ts`
- 拆分方式：
  - 平台前端页面拆分为区块子组件（总览、用户管理、充值审核），主函数仅保留编排。
  - 后端 `chargeUsage` 拆分为独立 helper（保留配额、全局免费池、回滚、账本写入逻辑语义不变）。
- 与上一迭代衔接：
  - 保持“补齐规则但不新增例外”的约束不变。

## 测试/验证/验收方式
- 本地静态与构建验证：
  - `pnpm -C apps/platform-admin lint && pnpm -C apps/platform-admin build && pnpm -C apps/platform-admin tsc`
  - `pnpm -C apps/platform-console lint && pnpm -C apps/platform-console build && pnpm -C apps/platform-console tsc`
  - `pnpm -C workers/nextclaw-provider-gateway-api lint && pnpm -C workers/nextclaw-provider-gateway-api build && pnpm -C workers/nextclaw-provider-gateway-api tsc`
- 本地冒烟：
  - `pnpm smoke:platform:mvp`
  - 结果：通过（脚本输出 `all checks passed`）。
- 线上关键 API 冒烟：
  - `GET https://ai-gateway-api.nextclaw.io/health` -> `200`
  - `POST /platform/auth/login`（随机不存在邮箱）-> `401 INVALID_CREDENTIALS`（预期）
  - `POST /platform/auth/register`（新邮箱）-> `500`（线上环境 PBKDF2 迭代上限限制，非本次改动引入，需单独治理）

## 发布/部署方式
- 后端发布闭环：
  - `pnpm platform:db:migrate:remote`（结果：`No migrations to apply!`）
  - `pnpm -C workers/nextclaw-provider-gateway-api run deploy`
  - Worker Version ID: `0880b14d-9266-410f-a444-5f406f8033fd`
- 前端发布闭环：
  - `pnpm deploy:platform:console`
  - `pnpm deploy:platform:admin`
- 本次线上可访问地址（部署输出）：
  - Console: `https://73f956e3.nextclaw-platform-console.pages.dev`
  - Admin: `https://27c83258.nextclaw-platform-admin.pages.dev`
  - Gateway health: `https://ai-gateway-api.nextclaw.io/health`

## 用户/产品视角的验收步骤
1. 打开 console/admin 发布地址，确认页面可正常加载。
2. 在 admin 页面验证：
   - 总览卡片正常展示。
   - 用户额度管理列表可编辑并触发保存。
   - 充值审核列表可执行通过/拒绝动作。
3. 运行 `pnpm -C apps/platform-admin lint`、`pnpm -C apps/platform-console lint`、`pnpm -C workers/nextclaw-provider-gateway-api lint`，确认均无 max-lines-per-function 告警。
4. 请求 `https://ai-gateway-api.nextclaw.io/health`，确认线上 API 返回 `200`。
