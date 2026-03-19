# 迭代完成说明

- 确认本次 `nextclaw@0.13.0` 启动失败的根因是联动发布缺失：
  - `@nextclaw/server` 已开始使用 `@nextclaw/mcp` 的 `McpInstalledViewService`
  - 但已发布的 `@nextclaw/mcp@0.1.1` 仍是不含该导出的旧版本
  - 导致用户升级到 `nextclaw@0.13.0` 后，启动时出现 ESM named export 缺失错误
- 为避免同类事故复发，已新增联动发版检查脚本：
  - 当 `@nextclaw/mcp`、`@nextclaw/server`、`nextclaw` 三者中任意一个出现在 pending changeset 中时，检查会要求三者同时出现
  - 这样能保证联动发布，同时不强行把三者版本号拉成完全一致
- 已补充联动 changeset，下一次正式版本发布会强制把这条链一起发布

# 测试/验证/验收方式

- 根因验证：
  - 检查本地源码：`packages/nextclaw-mcp/src/index.ts` 已导出 `McpInstalledViewService`
  - 检查用户全局安装的已发布产物：`.../node_modules/@nextclaw/mcp/dist/index.js` 不含 `McpInstalledViewService` 导出
- 联动机制验证：
  - 运行 `node scripts/check-release-groups.mjs`
  - 确认检查通过，且 `.changeset/fresh-snails-double.md` 同时覆盖 `@nextclaw/mcp`、`@nextclaw/server`、`nextclaw`
- 包产物验证：
  - 运行 `pnpm -C packages/nextclaw-mcp build`
  - 验证本地构建后的 `packages/nextclaw-mcp/dist/index.js` 已包含 `McpInstalledViewService` 导出

# 发布/部署方式

- 本次不能直接在当前工作区执行正式发布
  - 原因：当前工作区内 `packages/nextclaw`、`packages/nextclaw-server` 等存在用户未提交的其它进行中改动，若直接发布会把无关内容一并带出
- 正确发布方式：
  - 基于干净工作区，仅保留本次 linked release 修复
  - 执行 `pnpm release:version`
  - 执行 `pnpm release:publish`
- 本次预期发布结果：
  - `@nextclaw/mcp` 发布新 patch 版本，带上 `McpInstalledViewService`
  - `@nextclaw/server` 与 `nextclaw` 同步发布新 patch 版本并指向新 `@nextclaw/mcp`

# 用户/产品视角的验收步骤

1. 正式发布完成后，执行 `nextclaw update && nextclaw restart`
2. 确认不再出现 `@nextclaw/mcp` 缺少 `McpInstalledViewService` 的启动报错
3. 打开 MCP marketplace / 已安装 MCP 相关界面，确认服务可以正常进入
4. 如需临时回避该问题，在正式修复版本发布前可先回退到 `nextclaw@0.12.5`
