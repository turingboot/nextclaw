# v0.8.43-provider-list-stable-height

## 迭代完成说明（改了什么）

本次迭代聚焦 Providers 页面左侧列表的布局稳定性与状态标签可读性。

- 左侧提供商面板改为固定高度容器（viewport 约束），避免在“已配置/全部提供商”切换时整块高度跳变。
- 列表区改为 `flex-1 + overflow-y-auto` 内部滚动，列表项数量变化不会改变外层布局高度。
- 空状态在固定高度内居中展示，避免过滤结果为空时面板塌陷。
- 状态标签（就绪/待配置）增加不换行与不收缩约束，避免中文被挤压成竖排换行。

涉及文件：
- [`packages/nextclaw-ui/src/components/config/ProvidersList.tsx`](../../../../packages/nextclaw-ui/src/components/config/ProvidersList.tsx)
- [`packages/nextclaw-ui/src/components/ui/status-dot.tsx`](../../../../packages/nextclaw-ui/src/components/ui/status-dot.tsx)

## 测试 / 验证 / 验收方式

- 工程验证（仓库级）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm tsc`
- UI 包局部验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui build`
- 冒烟验证：
  - 启动：`PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui preview --host 127.0.0.1 --port 4175`
  - 检查：`curl http://127.0.0.1:4175/` 与 `curl http://127.0.0.1:4175/providers`
  - 结果：两个地址均返回 `200`

## 发布 / 部署方式

- 本次为 UI 交互与样式优化，不涉及后端与数据库，远程 migration：不适用。
- 若需要发布包，按项目既有流程执行：
  1. `pnpm changeset`
  2. `pnpm release:version`
  3. `pnpm release:publish`

## 用户/产品视角的验收步骤

1. 打开 Providers 页面。
2. 在左侧反复切换“已配置 / 全部提供商”，观察左侧卡片容器高度保持稳定，不再随条目数变化。
3. 在左侧执行搜索并清空搜索，观察列表内容变化仅发生在内部滚动区域。
4. 检查每个提供商右侧状态标签（如“就绪”“待配置”）应保持单行，不出现竖排换行。
5. 缩放窗口到较窄宽度，再次确认状态标签仍可读且不挤压为多行。
6. 验收标准：布局稳定、滚动逻辑一致、状态标签可读性稳定。
