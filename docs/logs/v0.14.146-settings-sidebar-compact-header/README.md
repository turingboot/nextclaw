# v0.14.146-settings-sidebar-compact-header

## 迭代完成说明

- 将设置侧栏顶部从原先占高较大的 hero 头部，调整为更紧凑的单行工具栏式头部。
- 保留两个必要信息：
  - 返回主界面入口
  - 当前“设置”页标识
- 删除了原先的大面积视觉占用来源：
  - 超大标题尺寸
  - 额外拉高高度的上下留白
- 新设计参考主流产品常见做法，把顶部区压缩成一行，优先把垂直空间让给设置导航本身。
- 保留此前已验证的侧栏滚动适配：顶部固定、中间导航独立滚动、底部操作区可达。
- 补充了结构测试，确保设置模式下继续使用紧凑单行头部：
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

- 本次为前端 UI 布局优化，无需数据库 migration 或后端发布。
- 按现有前端/桌面应用正常发布流程携带本次构建产物发布即可。

## 用户 / 产品视角的验收步骤

1. 打开设置界面。
2. 观察左侧顶部区域，确认它已经变成单行紧凑头部，而不是大标题 hero 区。
3. 确认“返回主界面”和“设置”标题都清晰可见。
4. 缩小窗口高度，确认顶部区不再过度占用垂直空间。
5. 确认左侧导航区因此获得更多可见高度，更多设置项能直接显示。
