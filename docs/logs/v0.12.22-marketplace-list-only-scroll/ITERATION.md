# v0.12.22 marketplace list only scroll

## 迭代完成说明（改了什么）

- 修正技能市场滚动层级：页面改为固定头部（标题/Tab/筛选/分页），仅“技能列表区域”滚动。
- `MarketplacePage` 改为 `h-full + flex + min-h-0` 布局，并将列表区改为独立 `overflow-y-auto`。
- `ChatPage` 中 `view=skills` 分支改为外层 `overflow-hidden` + 内层 `h-full/min-h-0` 容器，避免整页容器接管滚动。

## 测试/验证/验收方式

- 编译与类型检查：
  - `pnpm -C packages/nextclaw-ui build`
  - `pnpm -C packages/nextclaw-ui tsc`
- 冒烟（预览路由可访问）：
  - `pnpm -C packages/nextclaw-ui preview --host 127.0.0.1 --port 4179`
  - `curl -fsS http://127.0.0.1:4179/skills`
  - 观察到页面 `title` 与 `#root` 正常返回。

## 发布/部署方式

- 本次为前端布局修正，按 UI 常规发布流程构建并更新前端静态资源即可。

## 用户/产品视角的验收步骤

1. 打开技能市场页面（`/skills`）。
2. 保持页面顶部（标题、Tab、筛选）不动，滚动列表区域。
3. 确认仅列表区滚动，外层整页不再整体滚动。
