# v0.14.204-discord-channel-runtime-config-alignment

## 迭代完成说明

- 修复 NextClaw 渠道运行时读取内置渠道配置时未统一走插件配置视图的问题。
- 新增 `channel-config-view` 辅助层，让内置渠道运行时与 `channels status` 一致读取插件合成后的 channel 配置。
- 将 `ConfigReloader` 的渠道重载路径改为可注入 channel config view，避免热更新后 Discord 等内置渠道继续读取陈旧的原始 `channels.*` 配置。
- 补充单测，覆盖“插件配置投影到渠道运行时视图”以及“插件禁用时投影 enabled=false”的行为。
- 本机额外完成一次运行配置修正：将 `~/.nextclaw/config.json` 中失效的 `channels.discord.token` 对齐到当前有效的内置 Discord 插件 token，并确认热重载后重新连上 Discord。

## 测试/验证/验收方式

- 单测：
  - `PATH=/Users/peiwang/.nvm/versions/node/v22.16.0/bin:$PATH pnpm -C packages/nextclaw test -- --run src/cli/commands/channel-config-view.test.ts`
- 类型检查：
  - `PATH=/Users/peiwang/.nvm/versions/node/v22.16.0/bin:$PATH pnpm -C packages/nextclaw tsc`
- 定向 lint：
  - `PATH=/Users/peiwang/.nvm/versions/node/v22.16.0/bin:$PATH pnpm -C packages/nextclaw exec eslint src/cli/commands/channel-config-view.ts src/cli/commands/channel-config-view.test.ts src/cli/commands/channels.ts src/cli/commands/service.ts src/cli/config-reloader.ts`
- 可维护性守卫：
  - `PATH=/Users/peiwang/.nvm/versions/node/v22.16.0/bin:$PATH node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths packages/nextclaw/src/cli/commands/channel-config-view.ts packages/nextclaw/src/cli/commands/channel-config-view.test.ts packages/nextclaw/src/cli/commands/channels.ts packages/nextclaw/src/cli/commands/service.ts packages/nextclaw/src/cli/config-reloader.ts`
- 本机冒烟：
  - 校验两份 Discord token 有效性，确认原始 `channels.discord.token` 为 401、插件配置 token 为 200。
  - 修正本机运行配置后，检查 `~/.nextclaw/logs/service.log` 出现 `Config reload: channels restarted.`、`Discord bot connected`、`Discord slash commands registered for 2 guild(s).`
  - 运行 `PATH=/Users/peiwang/.nvm/versions/node/v22.16.0/bin:$PATH pnpm exec nextclaw channels status`，确认 `Discord: ✓`。

## 发布/部署方式

- 本次已完成仓库代码修复，但若要让安装版 `nextclaw` 永久具备该修复，仍需后续按正常发版流程发布 `packages/nextclaw`。
- 对当前这台机器，已通过热更新方式修正本地运行配置并恢复 Discord 连接，无需额外部署动作。

## 用户/产品视角的验收步骤

1. 保持本地 `nextclaw` 服务运行。
2. 在 Discord 中给本地 bot 发送一条普通消息。
3. 观察本地服务日志是否继续保持 `Discord bot connected`，且无新的 `TokenInvalid`。
4. 确认 bot 能正常回复消息。
5. 如后续在 UI 或插件配置里更新 Discord token，再次发送消息，确认不会出现“界面已改好但运行时仍读旧 token”的情况。
