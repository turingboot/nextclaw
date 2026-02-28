# v0.8.47-provider-left-list-readability

## 迭代完成说明（改了什么）

本次迭代聚焦 Providers 左侧列表可读性与信息有效性。

- 左栏宽度从 `340px` 提升到 `400px`（桌面），减少名称与副信息截断。
- 将左栏副文案从泛化描述改为“实际 API Base 预览”（优先当前配置，其次 provider 默认值），避免每行重复无效文案。
- 列表项内边距与状态胶囊宽度做了收敛，给名称与副信息释放更多可读空间。

涉及文件：
- [`packages/nextclaw-ui/src/components/config/ProvidersList.tsx`](../../../../packages/nextclaw-ui/src/components/config/ProvidersList.tsx)

## 测试 / 验证 / 验收方式

- 工程验证（仓库级）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm tsc`
- UI 包局部验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui build`
- 前端冒烟：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui preview --host 127.0.0.1 --port 4178`
  - `curl http://127.0.0.1:4178/` 与 `curl http://127.0.0.1:4178/providers`
  - 结果：均返回 `200`

## 发布 / 部署方式

- 本次仅 UI 展示优化，不涉及后端/数据库 migration，远程 migration：不适用。
- 如需发布，按项目流程：
  1. `pnpm changeset`
  2. `pnpm release:version`
  3. `pnpm release:publish`

## 用户/产品视角的验收步骤

1. 打开 Providers 页面。
2. 检查左栏名称截断是否明显减少。
3. 检查每个 provider 的第二行信息应优先显示实际 API Base（而非重复“Configure ...”文案）。
4. 切换不同 provider 并编辑 API Base 后返回左栏，确认对应条目的 base 预览同步变化。
5. 验收标准：左栏信息更聚焦、更可读，且每行副信息具备实际决策价值。
