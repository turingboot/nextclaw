# v0.14.31-ncp-runtime-disposable-hotplug

## 迭代完成说明

本次把 NCP runtime 的热插拔链路收敛成更轻的实现：

- 新增放在 `@nextclaw/core` 的公共 `Disposable` / `DisposableStore`
- `UiNcpRuntimeRegistry.register()` 现在返回可撤销句柄
- `createUiNcpAgent` 改为维护 live runtime registry，并支持对插件 runtime 做显式 apply/dispose
- 运行中的 `ServiceCommands` 在 marketplace 安装、启用、禁用、卸载插件后，会立即在当前进程内触发一次 config reload
- `uninstall` 现在内含 disable/teardown 语义，用户直接卸载已启用插件时，不需要先手动禁用
- plugin reload 完成后，NCP session types 会同步到当前 live runtime registry，不再只依赖 watcher 的异步收敛窗口
- `pnpm dev start` 修复了自定义 `NEXTCLAW_HOME` 指向 `/tmp` 时的 realpath 排除问题，卸载插件不再触发 `tsx watch` 重启

相关方案文档：

- [NCP Runtime Lifecycle Disposable Plan](../../plans/2026-03-19-ncp-runtime-lifecycle-disposable-plan.md)

## 测试/验证/验收方式

已执行：

- `pnpm --filter nextclaw test -- --run src/cli/commands/ncp/create-ui-ncp-agent.test.ts src/cli/commands/service.marketplace-plugin-management.test.ts`
- `pnpm --filter nextclaw tsc`
- `pnpm --filter @nextclaw/core tsc`
- `pnpm --filter @nextclaw/openclaw-compat tsc`
- `pnpm --filter @nextclaw/server tsc`
- `node --check scripts/dev-runner.mjs`
- `python3 .codex/skills/post-edit-maintainability-guard/scripts/check_maintainability.py --paths packages/nextclaw-core/src/utils/disposable.ts packages/nextclaw/src/cli/commands/ncp/ui-ncp-runtime-registry.ts packages/nextclaw/src/cli/commands/ncp/create-ui-ncp-agent.ts packages/nextclaw/src/cli/commands/service.ts packages/nextclaw/src/cli/commands/service.marketplace-plugin-management.test.ts packages/nextclaw/src/cli/commands/ncp/create-ui-ncp-agent.test.ts`

真实 dev 验证：

- 在隔离 `NEXTCLAW_HOME` 下启动 `pnpm dev start`
- 初始 `/api/ncp/session-types` 只有 `native`
- marketplace 安装 codex runtime 后，`/api/ncp/session-types` 立即变成 `native + codex`
- 直接禁用 codex runtime 后，`/api/ncp/session-types` 立即恢复为只有 `native`
- 在 codex runtime 处于启用状态时直接卸载，`/api/ncp/session-types` 也会立即恢复为只有 `native`
- 整个过程中 dev 终端只出现 `Config reload: plugins reloaded.`，不再出现 `tsx watch Restarting...`

重点观察点：

- `codex` runtime session type 能随 apply/remove 正确增减
- marketplace 管理动作会触发进程内即时 reload
- 公共 `Disposable` 放在 core 层而不是 compat 层

## 发布/部署方式

本次未执行发布。

如果后续发布，按正常 changeset / version / publish 流程处理，并在发布后验证：

- `/api/ncp/session-types`
- plugin marketplace 安装/卸载后的会话类型变化

## 用户/产品视角的验收步骤

1. 启动 `pnpm dev start`
2. 打开 plugin marketplace，安装 `codex` runtime 插件
3. 请求 `/api/ncp/session-types`，确认返回包含 `codex`
4. 在 marketplace 中禁用或卸载该插件
5. 再次请求 `/api/ncp/session-types`，确认 `codex` 已移除且无需重启服务
6. 重新启用或重新安装插件，确认 `codex` 会重新出现
