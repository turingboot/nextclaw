# Iteration v0.12.16-marketplace-hard-clean-no-legacy

## 1) 迭代完成说明（改了什么）

- 对 marketplace 技术栈做“断代清理”，移除所有运行态旧链路（GitHub / git / clawhub / JSON catalog）。
- 清理 CLI 旧技能安装兼容实现：
  - 删除 `ServiceCommands` 中 GitHub + git 物化安装实现（`installGitMarketplaceSkill` 及全部辅助方法）。
  - 删除对应历史测试文件：`packages/nextclaw/src/cli/commands/service.marketplace-skill.test.ts`。
- 清理 worker 旧数据源链路：
  - 删除 `workers/marketplace-api/src/infrastructure/bundled-data-source.ts`。
  - 删除 `workers/marketplace-api/data/plugins-catalog.json` 与 `workers/marketplace-api/data/skills-catalog.json`。
  - 删除 `workers/marketplace-api/scripts/validate-catalog.mjs` 与 `validate:catalog` script。
  - `workers/marketplace-api/tsconfig.json` 移除对 `data/**/*.json` 的 include。
- CLI 技能模块命名去历史化：
  - `packages/nextclaw/src/cli/skills/clawhub.ts` 重命名为 `packages/nextclaw/src/cli/skills/marketplace.ts`。
- 清理脚本与文档残留：
  - Docker installer smoke 改为 `skills install` 路径。
  - 更新 marketplace worker 部署文档为 D1 流程（迁移 + 部署 + 冒烟）。
  - 主文档中将 ClawHub 叙述改为 marketplace。

## 2) 测试/验证/验收方式

执行结果：

- `pnpm -C workers/marketplace-api build`
- `pnpm -C workers/marketplace-api lint`
- `pnpm -C workers/marketplace-api tsc`
- `pnpm -C packages/nextclaw-server build`
- `pnpm -C packages/nextclaw-server lint`
- `pnpm -C packages/nextclaw-server tsc`
- `pnpm -C packages/nextclaw build`
- `pnpm -C packages/nextclaw lint`
- `pnpm -C packages/nextclaw tsc`
- `pnpm -C packages/nextclaw-server test -- --run src/ui/router.marketplace-content.test.ts`

说明：

- `nextclaw-server` / `nextclaw` 的 lint 仍有仓库既有 max-lines 警告（非本迭代引入）。

冒烟（非仓库目录）：

- 在 `/tmp` mock marketplace API 下真实执行：
  - `nextclaw skills install demo`
  - `nextclaw skills publish <dir>`
  - `nextclaw skills update <dir>`
- 观察点：安装成功生成 `skills/demo/SKILL.md`；发布与更新均返回成功；上行 payload 被服务端接收。

## 3) 发布/部署方式

1. 配置 worker 的 D1 绑定（`MARKETPLACE_DB`）。
2. 执行 migration：
   - `pnpm -C workers/marketplace-api db:migrate:remote`
3. 发布 worker：
   - `pnpm -C workers/marketplace-api deploy`
4. 发布 CLI（如需对外）：
   - 走项目既有 release 流程。

## 4) 用户/产品视角的验收步骤

1. 准备本地 skill 目录（含 `SKILL.md`）。
2. 执行上传：`nextclaw skills publish ./my-skill --slug my-skill --api-base <api>`。
3. 修改 skill 后执行更新：`nextclaw skills update ./my-skill --slug my-skill --api-base <api>`。
4. 在目标机器执行安装：`nextclaw skills install my-skill --api-base <api>`。
5. 打开 marketplace skill 详情，确认内容来自 marketplace `/api/v1/skills/items/:slug/content`。
