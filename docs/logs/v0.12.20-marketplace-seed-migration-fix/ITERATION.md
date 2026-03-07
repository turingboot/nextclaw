# v0.12.20 marketplace seed migration fix

## 迭代完成说明（改了什么）

- 修复 D1 seed migration：移除 `workers/marketplace-api/migrations/0002_seed_legacy_skills_20260227.sql` 中 Wrangler D1 不支持的 `BEGIN/COMMIT`，确保迁移可执行。
- 校验并确认 `0002` 已包含历史 skills-catalog 的全部 11 个 skill（含 `pdf/docx/pptx/xlsx/bird/cloudflare-deploy`）。
- UI Server 新增 marketplace 协议保护：当 skill `install.kind` 不是 `builtin|marketplace`（例如旧 worker 的 `git`）时，接口返回 `MARKETPLACE_CONTRACT_MISMATCH`（502），避免静默过滤导致列表“只剩几个”。
- 新增测试覆盖上述协议保护：`router.marketplace-content.test.ts`。
- 完善文档：补充 D1 迁移与部署后验收标准（包含 install kind 与历史条目检查）。

## 测试/验证/验收方式

- 迁移验证（本地 D1）：
  - `pnpm -C workers/marketplace-api db:migrate:local`
  - `wrangler d1 execute ... SELECT slug, install_kind FROM marketplace_items WHERE type='skill' ORDER BY slug;`
  - 结果应为 11 个 skill，且 install_kind 仅 `builtin/marketplace`。
- 合同验证（线上 API 观测）：
  - `curl https://marketplace-api.nextclaw.io/health`
  - `curl 'https://marketplace-api.nextclaw.io/api/v1/skills/items?page=1&pageSize=50'`
  - 若仍出现 `install.kind=git`，表示线上仍是旧 worker，需部署新版本。
- 代码验证：
  - `pnpm -C workers/marketplace-api build && pnpm -C workers/marketplace-api lint && pnpm -C workers/marketplace-api tsc`
  - `pnpm -C packages/nextclaw-server test -- --run src/ui/router.marketplace-content.test.ts`
  - `pnpm -C packages/nextclaw-server build && pnpm -C packages/nextclaw-server lint && pnpm -C packages/nextclaw-server tsc`

## 发布/部署方式

1. 在 `workers/marketplace-api/wrangler.toml` 配置真实 D1 `database_id`。
2. 执行远程迁移：`pnpm -C workers/marketplace-api db:migrate:remote`。
3. 部署 worker：`pnpm -C workers/marketplace-api run deploy`。
4. 按文档进行线上 smoke：确认 `/health` 含 `storage: "d1"`，skills 列表含历史条目且 install kind 合法。

本次实际执行结果（2026-03-07）：

- 已创建 D1：`nextclaw-marketplace`（`database_id=252a64a3-94a7-4d34-89ab-945754f39f98`）。
- 已成功执行远程 migration：`0001`、`0002` 均为 ✅。
- 已成功部署 worker：`nextclaw-marketplace-api`，Version `287f7fe3-f61a-4e47-b423-51f7920793bf`。
- 线上验证 `https://marketplace-api.nextclaw.io`：
  - `/health` 返回包含 `storage: "d1"`。
  - `/api/v1/skills/items` 返回 11 个 skill，`install.kind` 仅 `builtin|marketplace`。

## 用户/产品视角的验收步骤

1. 打开 Marketplace 的 Skills 列表。
2. 确认除了 builtin（weather/summarize/github/tmux/gog）外，还能看到历史条目（pdf/docx/pptx/xlsx/bird/cloudflare-deploy）。
3. 点开任意 marketplace skill（例如 `pdf`）可查看内容并可安装。
4. 列表不再出现“只有几个技能”的异常；若后端仍旧协议，前端会明确报错而非静默丢条目。
