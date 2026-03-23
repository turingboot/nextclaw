# v0.14.144-settings-sidebar-scroll-adaptation

## 迭代完成说明

- 将设置界面左侧边栏整理为更稳健的三段式结构：顶部标题区固定、中间导航区独立滚动、底部账号/主题/语言/文档操作区固定可达。
- 在此基础上，进一步把底部区改成更紧凑的实用工具面板，参考顶级产品常见做法做了三点优化：
  - 账号入口从“双行说明卡”收敛为“单行状态卡”，保留账号主体信息和连接状态，但减少垂直占用。
  - 主题与语言从下拉选择改成直达式分段切换，更适合只有 2 个选项的高频偏好设置，减少一次点击层级。
  - 帮助文档入口降级为更轻量的次级动作，保留可达性但不再和主要偏好入口竞争高度。
- 这样在设置项继续增加时，侧栏不会整体被内容撑爆；用户仍能稳定访问“返回主界面”、当前设置导航和底部常用入口，同时底部区整体更紧凑。
- 补充了设置侧栏布局与紧凑偏好控件回归测试，覆盖侧栏容器的高度约束、导航独立滚动能力，以及主题直达切换：
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
- 说明：
  - 包级 `pnpm --filter @nextclaw/ui lint` 会命中仓库已有存量问题（如 `packages/nextclaw-ui/src/components/config/ChannelsList.test.tsx`），与本次侧栏改动无关；本次已通过受影响文件的定向 lint 验证。

## 发布 / 部署方式

- 本次为前端 UI 适配改动，无需单独执行数据库 migration 或后端发布。
- 按现有前端/桌面应用正常发布流程携带本次构建产物发布即可。

## 用户 / 产品视角的验收步骤

1. 打开设置界面，并确保左侧出现较多设置入口。
2. 将窗口高度缩小到接近截图中的紧凑高度，继续观察左侧边栏。
3. 确认顶部“返回主界面”和“设置”标题保持可见。
4. 在左侧滚动导航区，确认新增或靠后的设置项仍可访问。
5. 确认底部账号入口展示为更紧凑的单行状态卡，且能正常打开账号相关入口。
6. 确认主题与语言可通过底部直达式切换按钮直接切换，无需打开下拉。
7. 确认帮助文档入口仍可稳定点击，不会被导航项挤出可视区。
