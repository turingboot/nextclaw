# 2026-02-26 v0.0.1-docs-readme-i18n

## 迭代完成说明（改了什么）

- 文档站改为双语并采用单一真源目录：
- 英文文档统一在 `apps/docs/en/**`。
- 中文文档统一在 `apps/docs/zh/**`。
- 根入口改为语言选择页 `apps/docs/index.md`。
- 删除旧目录 `apps/docs/guide/**`，不再保留历史兼容路径。
- 重构 VitePress 多语言配置（`apps/docs/.vitepress/config.ts`），导航/侧边栏按语言分别配置。
- README 增加双语入口：
- 更新 `README.md`，补英文文档链接与语言切换入口。
- 新增 `README.zh-CN.md`，提供中文说明与中文文档入口。
- 新增 i18n 结构校验脚本 `scripts/docs-i18n-check.mjs`，并在根 `package.json` 增加 `docs:i18n:check` 命令。
- 同步更新仓库内文档引用，统一指向新文档路径（`/en/...`、`/zh/...`）。

## 测试 / 验证 / 验收方式

- 结构校验：
- `PATH=/opt/homebrew/bin:$PATH pnpm docs:i18n:check`
- Docs 构建校验：
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/docs build`
- 全量工程校验（按规则）：
- `PATH=/opt/homebrew/bin:$PATH pnpm build`
- `PATH=/opt/homebrew/bin:$PATH pnpm lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm tsc`
- 冒烟校验（用户可见）：
- `PATH=/opt/homebrew/bin:$PATH pnpm deploy:docs`
- 访问 `https://docs.nextclaw.io/`，确认可进入语言选择页。
- 访问 `https://docs.nextclaw.io/en/guide/getting-started` 与 `https://docs.nextclaw.io/zh/guide/getting-started`，确认内容可用且语言切换正常。
- 访问 `https://docs.nextclaw.io/guide/getting-started`，确认返回 404（旧路径已断代）。

## 发布 / 部署方式

- 本次为文档与 README 变更，无后端/数据库变更：
- 远程 migration：不适用。
- 文档站发布命令：
- `PATH=/opt/homebrew/bin:$PATH pnpm deploy:docs`
- NPM 包发布：不适用（本次无包版本变更）。

## 用户 / 产品视角的验收步骤

1. 打开 `https://docs.nextclaw.io/`，确认首页可在 English / 简体中文之间选择。
2. 进入英文文档任一页面，使用导航中的语言切换，确认可跳转到对应中文页面。
3. 进入中文文档任一页面，使用导航中的语言切换，确认可跳转到对应英文页面。
4. 打开 `https://docs.nextclaw.io/guide/getting-started`，确认旧路径不再可用，避免双轨维护。
5. 打开仓库 `README.md` 与 `README.zh-CN.md`，确认均可直达对应语言文档入口。
