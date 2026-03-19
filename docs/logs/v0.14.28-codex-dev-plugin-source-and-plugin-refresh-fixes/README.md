# v0.14.28 Codex Dev Plugin Source And Plugin Refresh Fixes

## 迭代完成说明

- 修复了 `pnpm dev start` 下第一方可选插件仍然优先加载 `~/.nextclaw/extensions` 旧安装包的问题。现在 dev 模式会优先把已安装的第一方插件映射到仓库内 `packages/extensions/*` 对应源码包，从而避免本地开发时继续吃旧插件版本。
- 因此 `@nextclaw/nextclaw-ncp-runtime-plugin-codex-sdk` 在 dev 模式下会直接使用仓库里的新实现，`skipGitRepoCheck` 默认值修复能够实际生效，不再继续报 `Not inside a trusted directory and --skip-git-repo-check was not specified`。
- 收窄了前端 websocket 对 `config.updated(path=plugins|skills)` 的全局 `config` query 失效范围，避免插件安装/启用/禁用时触发过重的页面级刷新，减轻“像重启一样”的体验。

## 测试/验证/验收方式

- `pnpm --filter nextclaw test -- --run src/cli/commands/dev-first-party-plugin-load-paths.test.ts src/cli/commands/plugin-reload.test.ts`
- `pnpm --filter @nextclaw/ui test -- --run src/components/chat/useChatSessionTypeState.test.tsx`
- `pnpm --filter nextclaw tsc`
- `pnpm --filter @nextclaw/ui tsc`
- `pnpm dev start`
- 真实接口验证：
  - `POST /api/ncp/agent/send`，以 `session_type=codex` 发送消息，确认流式返回 `OK`，且不再出现 trusted-directory / git repo check 错误。
  - `POST /api/marketplace/plugins/manage` disable / enable `nextclaw-ncp-runtime-plugin-codex-sdk`，确认 websocket 无断连，`/api/health` 持续正常，`/api/ncp/session-types` 在热重载完成后正确移除/恢复 `codex`。

## 发布/部署方式

- 本次改动尚未发布。
- 后续发布时需要同时发布 `nextclaw` 与相关可选插件包，使非 dev 安装环境也获得同一份 codex 修复。
- 在发布前建议再次用真实安装包验证一次 codex 插件安装、启用、禁用、卸载的热插拔行为。

## 用户/产品视角的验收步骤

1. 本地运行 `pnpm dev start`，保持已安装 `codex` 插件。
2. 新建一个 `codex` 类型会话并发送一条简单消息，确认可以正常回复，不再出现 git trusted directory 报错。
3. 在 Marketplace 中禁用该插件，等待热重载完成后确认新建会话菜单中的 `codex` 选项消失。
4. 再次启用该插件，确认无需手动重启服务即可恢复 `codex` 选项。
5. 在整个 disable / enable 过程中确认页面没有出现 websocket 断线或明显“整页重启”的体验。
