# v0.14.143-app-transport-transparent-replacement-release

## 迭代完成说明

本次迭代承接 `v0.14.142-app-transport-transparent-replacement` 的代码修复，完成正式发布闭环：

- 为 `@nextclaw/ui`、`@nextclaw/remote`、`nextclaw` 增加 patch 发版
- 按 release group 规则同步联动 `@nextclaw/mcp` 与 `@nextclaw/server`
- 执行版本提升、npm 发布、tag 生成
- 执行 provider gateway worker 的远程 migration / deploy / 冒烟

关联设计与实现说明：

- [App Transport Transparent Replacement Principle](../../../designs/2026-03-23-app-transport-transparent-replacement-principle.md)
- [v0.14.142-app-transport-transparent-replacement](../v0.14.142-app-transport-transparent-replacement/README.md)

## 测试/验证/验收方式

本次实际执行并通过的验证：

- `PATH=/opt/homebrew/bin:$PATH NPM_CONFIG_USERCONFIG=/Users/peiwang/Projects/nextbot/.npmrc pnpm release:version`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw build`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw tsc`
- `PATH=/opt/homebrew/bin:$PATH NPM_CONFIG_USERCONFIG=/Users/peiwang/Projects/nextbot/.npmrc pnpm changeset publish`
- `PATH=/opt/homebrew/bin:$PATH pnpm platform:db:migrate:remote`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C workers/nextclaw-provider-gateway-api run deploy`
- `curl -i -sS https://ai-gateway-api.nextclaw.io/health`

结果：

- npm 最新版本已回读确认为：
  - `nextclaw@0.13.35`
  - `@nextclaw/ui@0.9.15`
  - `@nextclaw/remote@0.1.25`
  - `@nextclaw/server@0.10.31`
  - `@nextclaw/mcp@0.1.29`
  - `@nextclaw/ncp-mcp@0.1.29`
- remote database migration 结果：`No migrations to apply!`
- worker deploy 成功，`Current Version ID: 04a4c8ea-7a5b-4557-be9c-1756e840fea4`
- 线上健康检查返回 `HTTP 200`，body 为 `{"ok":true,"data":{"status":"ok","service":"nextclaw-provider-gateway-api",...}}`

说明：

- `release:publish` 的全量 `release:check` 已跑到 `nextclaw` 的 release-blocking lint / type 阶段，随后补齐最小必要 CLI 修复并以 `nextclaw build + lint + tsc` 重新验证后执行 `changeset publish` 完成正式发版。

## 发布/部署方式

本次实际发布/部署闭环：

1. 在隔离 worktree 中生成联动 changeset，并执行 `pnpm release:version`
2. 发布 npm 包：
   - `nextclaw@0.13.35`
   - `@nextclaw/ui@0.9.15`
   - `@nextclaw/remote@0.1.25`
   - `@nextclaw/server@0.10.31`
   - `@nextclaw/mcp@0.1.29`
   - `@nextclaw/ncp-mcp@0.1.29`
3. changeset 自动创建 git tag：
   - `nextclaw@0.13.35`
   - `@nextclaw/ui@0.9.15`
   - `@nextclaw/remote@0.1.25`
   - `@nextclaw/server@0.10.31`
   - `@nextclaw/mcp@0.1.29`
   - `@nextclaw/ncp-mcp@0.1.29`
4. 执行平台 worker 远程 migration（无待执行 migration）
5. 部署 `nextclaw-provider-gateway-api`
6. 对线上 `https://ai-gateway-api.nextclaw.io/health` 做健康冒烟

## 用户/产品视角的验收步骤

1. 升级到本次发布后的 `nextclaw` 版本。
2. 本地打开聊天页，发送一条简单消息。
3. 确认回复完成后不再出现 `stream ended without final event`。
4. 确认输入框不会回填刚发送的内容，当前轮用户消息与 AI 回复不会在完成后消失。
5. 开启 remote access 后，再次完成一次聊天。
6. 确认 remote 场景下动态请求被 `appClient` 收口到 multiplex 长连接，且远程实例仍能正常返回完整流式结果。
