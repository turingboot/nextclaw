# 2026-02-26 v0.0.1-ui-lazy-chunking

## 迭代完成说明（改了什么）

- UI 路由改为懒加载：`/model`、`/providers`、`/channels`、`/runtime`、`/sessions`、`/cron`、`/marketplace` 全部通过 `React.lazy + Suspense` 按路由加载。
- 保持现有路由结构不变，仅调整加载策略，避免一次性下载全部页面逻辑。
- Vite 构建启用 `splitVendorChunkPlugin`，将 vendor 代码与入口代码拆分，降低首屏入口包体积。
- UI 服务端开启 gzip 压缩（`packages/nextclaw-server/src/ui/server.ts`），减少弱网下静态资源传输体积与耗时。
- 关键文件：
- `packages/nextclaw-ui/src/App.tsx`
- `packages/nextclaw-ui/vite.config.ts`
- `packages/nextclaw-ui/src/components/layout/AppLayout.tsx`
- `packages/nextclaw-server/src/ui/server.ts`

## 测试 / 验证 / 验收方式

- 构建：
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui build`
- TypeScript：
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc`
- 代码检查：
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui lint`
- 结果：
- `build`、`tsc` 通过。
- `lint` 存在既有问题（`CronConfig.tsx`、`SessionsConfig.tsx` 的 `PageBody` 未使用），本次未新增 lint error。
- 测试机（`8.219.57.52:18791`）复测：
- 变更前 `assets/index-BWFy0xvM.js`（约 506KB）下载约 `25s~30s`。
- 变更后拆分为 `index` + `vendor` 且启用 gzip，`vendor` 实际传输约 `117KB`，实测约 `2.3s~8.3s`（网络抖动下多次采样）。

## 发布 / 部署方式

- 本次改动为前端 UI 打包与加载策略调整，无后端/数据库变更。
- 本次改动包含 UI 服务静态资源压缩策略调整（gzip），无数据库变更。
- 远程 migration：不适用。
- 发布方式：
- 按既有流程发布包含最新 `@nextclaw/ui` 产物的 `nextclaw` 包。
- 测试环境可通过更新包后重启 `nextclaw` 完成生效。

## 用户 / 产品视角的验收步骤

1. 启动服务后访问 UI 首页，确认页面可正常进入且无白屏。
2. 打开浏览器 Network，刷新后确认不再只有一个超大入口 JS，出现入口 chunk + vendor chunk + 当前路由 chunk。
3. 依次切换到 Providers / Channels / Runtime / Sessions / Cron / Marketplace，确认首次进入该页会按需加载对应 chunk。
4. 再次切换同一路由，确认该路由 chunk 命中缓存（不重复完整下载）。
