# v0.13.176-ncp-chat-history-hydration-and-sidebar-loading-fix

## 迭代完成说明

- 修复 NCP chat 页面在刷新后进入已有会话时，历史消息未自动加载的问题。
- 根因是 `loadSeed` 过早依赖 session summary；当首屏 route 已经指向会话、但 sessions list 还没返回时，会直接返回空消息。
- 现在改为：只要当前是已选中的会话，就直接请求该会话历史；summary 仅用于补充运行状态。
- 修复点击会话列表项时，侧边栏看起来整列表重新刷新/重置 loading 的问题。
- 根因是 sidebar 的 `isLoading` 错误绑定到了 thread hydration。
- 现在 sessions list loading 只反映 sessions query 本身，thread hydration 只影响消息区。

## 测试/验证/验收方式

- 运行：
  - `pnpm --filter @nextclaw/ui tsc`
- 观察点：
  - 首屏直接打开某个 NCP 会话路由时，历史消息应自动展示。
  - 点击任意会话项时，消息区可以进入加载态，但左侧会话列表不应整体闪成 loading 空态。

## 发布/部署方式

- 当前为前端代码修复。
- 本地开发直接重启或等待前端热更新生效即可。
- 如走正式发布，按常规前端发布流程带上本次改动。

## 用户/产品视角的验收步骤

- 打开一个已有 NCP 会话，确认有历史消息。
- 刷新浏览器页面，确认重新进入后历史消息仍自动出现。
- 回到会话列表，连续点击不同会话。
- 确认左侧列表保持稳定，只切换高亮项，不出现整列表 loading/空白重刷。
