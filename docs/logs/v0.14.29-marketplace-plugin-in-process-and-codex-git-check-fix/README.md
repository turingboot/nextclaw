# v0.14.29 marketplace-plugin-in-process-and-codex-git-check-fix

## 迭代完成说明

- 将 Marketplace 插件安装、启用、禁用、卸载从“服务内再 spawn 一个 CLI 子进程”改为“服务内直接执行插件变更动作”，避免 `pnpm dev start` 场景下出现额外子进程与终端重绘带来的“像重启”体验。
- 新增 `plugin-mutation-actions` 作为共享插件变更积木，CLI 与服务共用同一套实现，避免同功能重复实现。
- 在 `CodexSdkNcpAgentRuntime` 内部统一补齐 `threadOptions.skipGitRepoCheck` 默认值，确保未显式配置时也会忽略 git trusted directory 检查。
- 精简 Marketplace 前端安装/管理成功后的重复 `refetch`，减少插件操作后的额外刷新抖动。
- 补充回归测试，锁定两类行为：
  - 服务侧 Marketplace 插件管理不再走 `runCliSubcommand`
  - Codex runtime 会默认启用 `skipGitRepoCheck`

## 测试 / 验证 / 验收方式

- `pnpm --filter nextclaw test -- --run src/cli/commands/service.marketplace-plugin-management.test.ts src/cli/commands/codex-runtime-defaults.test.ts src/cli/commands/service.summary.test.ts src/cli/commands/plugin-reload.test.ts`
- `pnpm --filter nextclaw tsc`
- `pnpm --filter @nextclaw/ui tsc`
- `pnpm --filter @nextclaw/nextclaw-ncp-runtime-codex-sdk tsc`
- `python3 .codex/skills/post-edit-maintainability-guard/scripts/check_maintainability.py --paths packages/nextclaw/src/cli/commands/plugin-mutation-actions.ts packages/nextclaw/src/cli/commands/plugins.ts packages/nextclaw/src/cli/commands/service.ts packages/extensions/nextclaw-ncp-runtime-codex-sdk/src/index.ts packages/nextclaw-ui/src/hooks/useMarketplace.ts packages/nextclaw/src/cli/commands/service.marketplace-plugin-management.test.ts packages/nextclaw/src/cli/commands/codex-runtime-defaults.test.ts`

## 发布 / 部署方式

- 本次尚未执行发布。
- 若要让 Marketplace 安装到的 `@nextclaw/nextclaw-ncp-runtime-plugin-codex-sdk` 用户也立刻拿到 git-check 修复，需要后续发布包含本次修复的新包版本。

## 用户 / 产品视角的验收步骤

- 启动本地开发环境：`pnpm dev start`
- 在插件市场启用或禁用 `Codex` 插件，确认页面不再表现为“重启整个服务”，新增会话类型列表能热更新。
- 创建 `codex` 类型会话并发送消息，确认不再出现 `Not inside a trusted directory and --skip-git-repo-check was not specified.` 报错。
- 再次执行插件安装/启用/禁用/卸载，确认会话类型与已安装插件列表仍能热更新。
