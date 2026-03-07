# 迭代完成说明（改了什么）

- 调整 Chat slash 面板双栏布局比例：
  - 左侧列表改为固定窄栏（`minmax(260px,340px)`）；
  - 右侧详情改为自适应剩余空间（`minmax(0,1fr)`）。
- 目标：解决“左侧列表过宽”问题，同时保持右侧详情可读性。

# 测试/验证/验收方式

- `pnpm -C packages/nextclaw-ui tsc`
- `pnpm -C packages/nextclaw-ui build`

# 发布/部署方式

- 本次仅 UI 调整，按常规前端发布流程发布 `@nextclaw/ui` 与 `nextclaw` 对应前端产物。
- 无后端/数据库变更，无 migration。

# 用户/产品视角的验收步骤

1. 打开 Chat 页面，输入 `/` 触发 slash 面板。
2. 观察双栏比例：左侧应明显变窄，右侧详情区域更宽。
3. 键盘上下切换命令/技能，确认高亮与自动滚动行为仍正常。
