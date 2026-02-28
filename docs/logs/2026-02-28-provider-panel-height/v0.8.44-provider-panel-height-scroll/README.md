# v0.8.44-provider-panel-height-scroll

## 迭代完成说明（改了什么）

本次迭代继续优化 Providers 页面容器稳定性与可操作性。

- 左侧提供商面板进一步加高，并改为响应式高度策略：
  - 移动端保留最小高度，不强制固定视口高度。
  - 桌面端（`xl`）使用统一固定高度区间（更高）。
- 右侧配置面板同步使用与左侧一致的高度策略，视觉对齐。
- 右侧表单主体改为“限高 + 内部滚动”，底部操作区（恢复默认/保存）固定可见。

涉及文件：
- [`packages/nextclaw-ui/src/components/config/ProvidersList.tsx`](../../../../packages/nextclaw-ui/src/components/config/ProvidersList.tsx)
- [`packages/nextclaw-ui/src/components/config/ProviderForm.tsx`](../../../../packages/nextclaw-ui/src/components/config/ProviderForm.tsx)

## 测试 / 验证 / 验收方式

- 工程验证（仓库级）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm tsc`
- UI 包局部验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui build`
- 前端冒烟验证：
  - 启动：`PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui preview --host 127.0.0.1 --port 4176`
  - 检查：`curl http://127.0.0.1:4176/` 与 `curl http://127.0.0.1:4176/providers`
  - 结果：两个地址均返回 `200`

## 发布 / 部署方式

- 本次仅前端交互/布局调整，不涉及后端与数据库，远程 migration：不适用。
- 如需发布包，按项目发布流程执行：
  1. `pnpm changeset`
  2. `pnpm release:version`
  3. `pnpm release:publish`

## 用户/产品视角的验收步骤

1. 打开 Providers 页面。
2. 反复切换“已配置 / 全部提供商”，确认左侧容器高度稳定且比上一版更高。
3. 在左侧滚动列表，确认仅内部滚动，页面整体不抖动。
4. 切换不同提供商，检查右侧表单在内容较多时出现内部滚动，底部按钮始终可见。
5. 调整浏览器宽度（桌面与窄屏），确认布局仍可用且无明显高度跳变。
6. 验收标准：左右高度统一、滚动职责清晰、长表单操作按钮可持续可见。
