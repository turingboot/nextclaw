# v0.14.145-settings-sidebar-footer-revert

## 迭代完成说明

- 回退上一轮对设置侧栏底部区域做的“更紧凑视觉重排”。
- 保留已经验证有效的侧栏滚动适配方案：顶部标题区固定、中间导航区独立滚动、底部操作区保持可达。
- 将底部区域恢复为上一版样式：
  - 账号入口恢复为原先的两行信息展示。
  - 主题与语言恢复为下拉选择。
  - 帮助文档入口恢复为原先的一行按钮样式。
- 同步将测试回退到与当前设计一致的结构断言，仅保留滚动适配相关验证：
  - [`packages/nextclaw-ui/src/components/layout/sidebar.layout.test.tsx`](../../../packages/nextclaw-ui/src/components/layout/sidebar.layout.test.tsx)

## 测试 / 验证 / 验收方式

- 单测：
  - `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/ui test -- src/components/layout/sidebar.layout.test.tsx`
- 类型检查：
  - `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/ui tsc`
- 构建验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/ui build`
- 定向 lint：
  - `PATH=/opt/homebrew/bin:$PATH pnpm exec eslint src/components/layout/Sidebar.tsx src/components/layout/sidebar.layout.test.tsx`
- 可维护性自检：
  - `PATH=/opt/homebrew/bin:$PATH node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths packages/nextclaw-ui/src/components/layout/Sidebar.tsx packages/nextclaw-ui/src/components/layout/sidebar.layout.test.tsx`

## 发布 / 部署方式

- 本次为前端 UI 回退改动，无需数据库 migration 或后端发布。
- 按现有前端/桌面应用正常发布流程携带本次构建产物发布即可。

## 用户 / 产品视角的验收步骤

1. 打开设置界面，并确保左侧存在较多设置项。
2. 将窗口高度缩小到较紧凑的状态。
3. 确认顶部“返回主界面”和“设置”标题保持可见。
4. 确认左侧导航区可以独立滚动，靠后的设置项仍然可达。
5. 确认底部区域已经恢复为之前版本的样式，而不是紧凑卡片式重排。
6. 确认账号入口、主题、语言、帮助文档入口都能正常使用。
