# Iteration v0.12.14-marketplace-d1-skill-upsert-install

## 1) 迭代完成说明（改了什么）

- 将 `workers/marketplace-api` 的数据源从仓库内 JSON catalog 切换为 Cloudflare D1：
  - 新增 D1 migration：`workers/marketplace-api/migrations/0001_marketplace_d1.sql`
  - 新增 D1 数据层：`workers/marketplace-api/src/infrastructure/d1-data-source.ts`
  - 主入口改为 D1 读取 + admin 写接口：`workers/marketplace-api/src/main.ts`
- 新增 marketplace skill 管理接口：
  - `POST /api/v1/admin/skills/upsert`（CLI 上传/更新 skill）
  - `GET /api/v1/skills/items/:slug/files`
  - `GET /api/v1/skills/items/:slug/content`
- 约束 install kind 拆分：
  - plugin 仅允许 `npm`
  - skill 仅允许 `builtin | marketplace`
- CLI skill 流程改造：
  - `nextclaw skills install <slug>` 改为直接从 marketplace 安装（不再依赖 ClawHub）
  - 新增 `nextclaw skills publish <dir>`（上传/创建）
  - 新增 `nextclaw skills update <dir>`（更新已有）
- UI server marketplace skill 内容改造：
  - skill detail content 改为直接代理 marketplace `/content` 接口
  - 移除 GitHub raw markdown fallback
- 文档同步：更新 `docs/USAGE.md`、`packages/nextclaw/templates/USAGE.md`、`docs/feature-universe.md`、`docs/prd/current-feature-list.md`。

## 2) 测试/验证/验收方式

已执行：

- `pnpm -C workers/marketplace-api build`
- `pnpm -C workers/marketplace-api lint`
- `pnpm -C workers/marketplace-api tsc`
- `pnpm -C packages/nextclaw-server build`
- `pnpm -C packages/nextclaw-server lint`
- `pnpm -C packages/nextclaw-server tsc`
- `pnpm -C packages/nextclaw lint`
- `pnpm -C packages/nextclaw tsc`
- `pnpm -C packages/nextclaw-ui build`
- `pnpm -C packages/nextclaw-ui tsc`

说明：

- `pnpm -C packages/nextclaw-ui lint` 当前仓库存在既有历史错误（与本次改动无关），未在本迭代中修复：
  - `useChatStreamController.ts` 的 `react-hooks/refs` 规则报错
  - `MaskedInput.tsx` 的未使用参数报错

冒烟（非仓库目录执行）：

- 通过 `/tmp` 下 mock marketplace API 完成 CLI 真实流程：
  - `skills install demo`
  - `skills publish <dir>`
  - `skills update <dir>`
- 观察点：安装成功写入 `/tmp/.../workspace/skills/demo/SKILL.md`；发布与更新均返回成功，且服务端收到文件列表。

## 3) 发布/部署方式

1. 配置 D1 绑定：
   - 在 `workers/marketplace-api/wrangler.toml` 中设置真实 `database_id`
2. 执行 migration：
   - `pnpm -C workers/marketplace-api db:migrate:remote`
3. 部署 worker：
   - `pnpm -C workers/marketplace-api deploy`
4. 配置（可选）管理 token：
   - 设置 `MARKETPLACE_ADMIN_TOKEN`
5. 发布 CLI 包后，用户可直接用：
   - `nextclaw skills install <slug>`
   - `nextclaw skills publish <dir>`
   - `nextclaw skills update <dir>`

## 4) 用户/产品视角的验收步骤

1. 运营同学准备一个本地 skill 目录（含 `SKILL.md`）并执行：
   - `nextclaw skills publish ./my-skill --slug my-skill --api-base <marketplace-api>`
2. 修改 skill 内容后执行：
   - `nextclaw skills update ./my-skill --slug my-skill --api-base <marketplace-api>`
3. 在任意客户端机器执行：
   - `nextclaw skills install my-skill --api-base <marketplace-api>`
4. 打开安装目录确认文件完整（至少含 `SKILL.md`）。
5. 在 marketplace UI 打开 skill 详情，确认内容来自 marketplace `/content`，非 GitHub 拉取。
