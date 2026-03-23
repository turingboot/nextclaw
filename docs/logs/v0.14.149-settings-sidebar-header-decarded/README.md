# v0.14.149-settings-sidebar-header-decarded

## 迭代完成说明

- 将设置侧栏顶部从“高强调的白色卡片头部”进一步收敛为更轻量的工具栏式头部。
- 这次调整的重点不是再做新的装饰，而是去掉不符合当前产品调性的突出感：
  - 移除了白色背景块、边框、圆角卡片和阴影。
  - 移除了顶部中的齿轮图标，避免重复强调“这里是设置”。
  - 保留轻量返回入口与当前标题，并通过细分隔线建立层级关系。
- 调整后顶部区更像一个导航定位条，而不是一个视觉主角，更契合当前侧栏整体偏克制、工具型、中性化的界面风格。
- 同步补充测试，确保设置头部继续保持轻工具栏式结构，而不是回到白色卡片样式：
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

- 本次为前端 UI 风格优化，无需数据库 migration 或后端发布。
- 按现有前端/桌面应用正常发布流程携带本次构建产物发布即可。

## 用户 / 产品视角的验收步骤

1. 打开设置界面，观察左侧顶部区域。
2. 确认顶部不再是白色圆角卡片，而是更轻的单行工具栏样式。
3. 确认仍能清晰看到“返回主界面”和“设置”。
4. 确认顶部视觉权重下降后，左侧导航本身变得更自然、不再被头部抢焦点。
