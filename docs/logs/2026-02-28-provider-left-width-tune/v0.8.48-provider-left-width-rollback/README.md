# v0.8.48-provider-left-width-rollback

## 迭代完成说明（改了什么）

根据产品反馈，Providers 左栏宽度从 `400px` 回调到此前更合适的 `340px`，保持此前信息结构优化不变。

- 桌面端左栏宽度由 `xl:grid-cols-[400px_minmax(0,1fr)]` 调整为 `xl:grid-cols-[340px_minmax(0,1fr)]`。
- 列表信息结构（名称 + API Base 预览 + 状态）保持不变，仅做宽度回调。

涉及文件：
- [`packages/nextclaw-ui/src/components/config/ProvidersList.tsx`](../../../../packages/nextclaw-ui/src/components/config/ProvidersList.tsx)

## 测试 / 验证 / 验收方式

- 工程验证（仓库级）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm tsc`
- 前端冒烟验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui preview --host 127.0.0.1 --port 4179`
  - `curl http://127.0.0.1:4179/` 与 `curl http://127.0.0.1:4179/providers`
  - 结果：均返回 `200`

## 发布 / 部署方式

- 本次为 UI 布局微调，不涉及后端/数据库 migration，远程 migration：不适用。
- 如需发布，按项目流程：
  1. `pnpm changeset`
  2. `pnpm release:version`
  3. `pnpm release:publish`

## 用户/产品视角的验收步骤

1. 打开 Providers 页面。
2. 确认左栏宽度相比上一版收窄，接近之前视觉比例。
3. 检查名称、副信息和状态标签仍可读。
4. 验收标准：宽度比例回到预期，同时保留信息可读性优化。
