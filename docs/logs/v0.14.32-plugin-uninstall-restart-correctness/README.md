# 迭代完成说明

- 强化插件卸载清理逻辑：卸载时不再只删除单一推导目录，而是同时清理受控的全局扩展目录副本、记录的安装目录副本，以及 workspace `.nextclaw/extensions` 下的同插件副本，降低重启后被目录扫描重新发现的风险。
- 强化 dev first-party 插件加载逻辑：当 `pnpm dev start` 下已将 first-party 插件映射到 workspace 源码时，插件发现链路会主动排除 `NEXTCLAW_HOME/extensions` 中对应的安装副本，消除 duplicate 插件加载。
- 补充相关测试与 CLI 预览适配，确保卸载预期与实际清理范围一致。

# 测试/验证/验收方式

- 单测：
  - `pnpm --filter @nextclaw/openclaw-compat test -- --run src/plugins/uninstall.test.ts`
  - `pnpm --filter nextclaw test -- --run src/cli/commands/dev-first-party-plugin-load-paths.test.ts`
- 类型检查：
  - `pnpm --filter @nextclaw/openclaw-compat tsc`
  - `pnpm --filter nextclaw tsc`
- 冒烟：
  - 隔离 `NEXTCLAW_HOME` 启动 `pnpm dev start`
  - 调用 `/api/marketplace/plugins/install` 安装 codex 插件
  - 调用 `/api/ncp/session-types` 确认出现 `codex`
  - 调用 `/api/marketplace/plugins/manage` 卸载插件
  - 检查 `config.json` 与 `extensions` 目录清理情况
  - 重启后再次请求 `/api/ncp/session-types`，确认只剩 `native`

# 发布/部署方式

- 本次未执行发布。
- 若后续合并发布，按既有 changeset / npm 发布流程执行即可，无额外 migration 或部署步骤。

# 用户/产品视角的验收步骤

1. 启动 `pnpm dev start`。
2. 在 Plugin Marketplace 安装 codex 插件，确认新建会话时能看到 `Codex` 类型。
3. 直接点击卸载，不先手动禁用。
4. 确认插件类型从新增会话入口消失。
5. 刷新页面后再次确认插件类型仍然消失。
6. 完全停止并重新启动服务后，再次确认 `/api/ncp/session-types` 与新增会话入口都只剩 `native`。
