# 2026-02-27 v0.0.1-marketplace-copy-alignment

## 迭代完成说明（改了什么）

- Marketplace 页面文案改为按模块类型自适应：进入 Plugins 与 Skills 时，页面标题、描述、Tab 文案、搜索 placeholder、区块标题、错误提示、空状态文案分别匹配当前模块。
- 页面内不再使用“扩展/市场”等混合语义文案，避免插件与技能表述混淆。
- 新增中英文文案 key，确保后续扩展更多语言时可按模块独立翻译。

## 测试 / 验证 / 验收方式

- `PATH=/opt/homebrew/bin:$PATH pnpm build`
- `PATH=/opt/homebrew/bin:$PATH pnpm lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm tsc`
- 冒烟：
- 访问 `/marketplace/plugins`，确认标题/placeholder/错误与空态均为插件语义。
- 访问 `/marketplace/skills`，确认标题/placeholder/错误与空态均为技能语义。

## 发布 / 部署方式

- 本次为前端 UI 文案适配，无 migration。
- 如需发布，按 `changeset -> release:version -> release:publish` 执行。

## 用户 / 产品视角的验收步骤

1. 从侧边栏点击 `Plugins`，检查页面所有文案均为插件语义。
2. 切到 `Installed`，检查“已安装插件”语义是否一致。
3. 从侧边栏点击 `Skills`，检查页面所有文案均为技能语义。
4. 切到 `Installed`，检查“已安装技能”语义是否一致。
