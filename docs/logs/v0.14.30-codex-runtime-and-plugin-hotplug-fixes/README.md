# v0.14.30 codex runtime and plugin hotplug fixes

## 迭代完成说明

- 修复 `codex` NCP runtime 的 git trusted directory 问题，把 `skipGitRepoCheck` 的默认值下沉到 runtime 层，避免只依赖插件入口传参。
- 修复 Marketplace 插件管理链路，服务内不再通过再次 `spawn` CLI 子进程来执行插件安装/启用/禁用/卸载，改为直接走进程内插件命令逻辑。
- 修复 `pnpm dev start` 下插件安装/卸载会触发 `tsx watch` 重启的问题，`dev-runner` 现在会排除 `NEXTCLAW_HOME` 运行时目录监听。
- 收敛前端 Marketplace 的重复刷新，移除插件安装/管理成功后的多余 `refetchQueries`。
- 顺手修复 `useWebSocket` 的事件 payload 类型收窄问题。

## 测试/验证/验收方式

- `pnpm --filter nextclaw tsc`
- `pnpm --filter @nextclaw/ui tsc`
- `pnpm --filter @nextclaw/nextclaw-ncp-runtime-codex-sdk tsc`
- `pnpm --filter nextclaw test -- --run src/cli/commands/plugin-reload.test.ts src/cli/commands/service.summary.test.ts src/cli/commands/service.marketplace-skill-args.test.ts`
- `node --check scripts/dev-runner.mjs`
- 本地 `pnpm dev start` 实测：
  - 插件卸载后后端主进程 PID 保持不变，仅出现 `Config reload: plugins reloaded.`
  - 用链接到仓库源码的 `codex` 插件发送 NCP 消息，成功返回流式文本，不再出现 `Not inside a trusted directory and --skip-git-repo-check was not specified.`

## 发布/部署方式

- 本次未发布。
- 后续发布时，需要一并发布 `@nextclaw/nextclaw-ncp-runtime-codex-sdk` 与 `@nextclaw/nextclaw-ncp-runtime-plugin-codex-sdk`，让 Marketplace 安装到的新包默认带上本次修复。

## 用户/产品视角的验收步骤

- 启动 `pnpm dev start`。
- 在插件市场启用、禁用、卸载插件，观察后端 dev 终端不应再出现 `tsx ... Restarting...`。
- 安装并启用 `codex` runtime 插件后，新建 `codex` 类型会话并发送消息。
- 预期：
  - 不再报 git trusted directory 错误。
  - 会话能正常进入流式回复。
  - 插件安装/卸载后，前端只做必要刷新，不会出现“整套服务像重启”的体验。
