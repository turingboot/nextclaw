# 2026-02-27 v0.0.1-marketplace-no-cross-type-switch

## 迭代完成说明（改了什么）

- Marketplace 页面移除页面内 `Plugins / Skills` 切换入口。
- 现在类型切换仅通过侧边栏一级入口完成：
- `Plugins` -> `/marketplace/plugins`
- `Skills` -> `/marketplace/skills`
- 进入任一路由后，页面仅展示当前类型域的数据（列表、安装、已安装视图），不在页面内跨类型跳转。

## 测试 / 验证 / 验收方式

- `PATH=/opt/homebrew/bin:$PATH pnpm build`
- `PATH=/opt/homebrew/bin:$PATH pnpm lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm tsc`
- 冒烟：
- 从侧边栏进入 `Plugins`，确认页面无 `Plugins/Skills` 切换条。
- 从侧边栏进入 `Skills`，确认页面无 `Plugins/Skills` 切换条。
- 两个入口都仅展示当前类型数据。

## 发布 / 部署方式

- 本次为 UI 信息架构调整，无数据库/后端 migration 需求。
- 如需发布，按 `changeset -> release:version -> release:publish` 执行。

## 用户 / 产品视角的验收步骤

1. 打开侧边栏，确认存在独立 `Plugins` 与 `Skills` 一级入口。
2. 点击 `Plugins` 进入插件模块，确认页面不再出现技能切换入口。
3. 点击 `Skills` 进入技能模块，确认页面不再出现插件切换入口。
4. 在两个模块中分别查看 `Marketplace/Installed`，确认仅针对当前模块生效。
