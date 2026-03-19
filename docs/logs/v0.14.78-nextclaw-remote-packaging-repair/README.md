# v0.14.78-nextclaw-remote-packaging-repair

## 迭代完成说明

- 修复 `nextclaw remote connect` 在最新全局安装中报 `unknown command 'remote'` 的问题，确认根因是用户命中的 `nextclaw@0.13.1` 缺少 `remote` 命令。
- 继续定位到 `nextclaw@0.13.2` 发布链问题：`@nextclaw/core`、`@nextclaw/runtime`、`@nextclaw/channel-runtime`、`@nextclaw/openclaw-compat` 等 tarball 缺少 `dist`，导致全局安装后 CLI 启动失败。
- 将所有公开且有 `build` 脚本的 npm 包统一补上 `prepack: pnpm run build`，让 `pack/publish` 时自动构建当前包，避免再出现 tarball 漏产物。
- 同步把已发布但尚未回写主仓库的版本号与 changelog 回灌到仓库，并完成新一轮修复发布：
  - `nextclaw@0.13.3`
  - `@nextclaw/server@0.10.3`
  - `@nextclaw/core@0.9.4`
  - `@nextclaw/runtime@0.2.4`
  - `@nextclaw/channel-runtime@0.2.4`
  - `@nextclaw/openclaw-compat@0.3.7`
  - 以及联动缺失的 `channel-plugin-*`、`@nextclaw/mcp@0.1.3`、`@nextclaw/ncp-mcp@0.1.3`、`@nextclaw/nextclaw-ncp-runtime-plugin-*`

## 测试/验证/验收方式

- 构建验证：
  - `pnpm -C packages/nextclaw-core build`
  - `pnpm -C packages/extensions/nextclaw-channel-runtime build`
  - `pnpm -C packages/nextclaw-runtime build`
  - `pnpm -C packages/nextclaw-openclaw-compat build`
  - `pnpm -C packages/nextclaw-server build`
  - `pnpm -C packages/nextclaw build`
- 类型与 lint：
  - `pnpm -C packages/nextclaw-core tsc && pnpm -C packages/nextclaw-core lint`
  - `pnpm -C packages/extensions/nextclaw-channel-runtime tsc && pnpm -C packages/extensions/nextclaw-channel-runtime lint`
  - `pnpm -C packages/nextclaw-runtime tsc && pnpm -C packages/nextclaw-runtime lint`
  - `pnpm -C packages/nextclaw-openclaw-compat tsc && pnpm -C packages/nextclaw-openclaw-compat lint`
  - `pnpm -C packages/nextclaw-server tsc && pnpm -C packages/nextclaw-server lint`
  - `pnpm -C packages/nextclaw tsc && pnpm -C packages/nextclaw lint`
- tarball 验证：
  - `pnpm -C packages/nextclaw-runtime pack --pack-destination /tmp/...`
  - `pnpm -C packages/nextclaw pack --pack-destination /tmp/...`
  - `pnpm -C packages/extensions/nextclaw-channel-runtime pack --pack-destination /tmp/...`
  - `pnpm -C packages/nextclaw-openclaw-compat pack --pack-destination /tmp/...`
  - `pnpm -C packages/nextclaw-core pack --pack-destination /tmp/...`
  - `pnpm -C packages/nextclaw-server pack --pack-destination /tmp/...`
  - 验证点：日志中出现当前包的 `prepack -> pnpm run build`，并且 tarball 内包含 `package/dist/*`
- CLI 冒烟：
  - `node packages/nextclaw/dist/cli/index.js remote --help`
  - `nextclaw --version`
  - `nextclaw remote --help`
  - `nextclaw remote connect --help`
  - `nextclaw status`
  - `nextclaw remote connect --once`
  - 验证点：真实连上 `https://ai-gateway-api.nextclaw.io`，成功注册 remote device，并建立 websocket 连接。
- 可维护性检查：
  - `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths ...`
  - 结果：本次改动主要为 `package.json` / `CHANGELOG.md` / 发布元数据，守卫返回 `not applicable`

## 发布/部署方式

- 版本整理：
  - `pnpm changeset version`
- npm 发布：
  - `NPM_CONFIG_USERCONFIG=/Users/peiwang/Projects/nextbot/.npmrc pnpm changeset publish`
- 发布后校验：
  - `npm view nextclaw version`
  - `npm view @nextclaw/server version`
  - `npm view @nextclaw/core version`
  - `npm view @nextclaw/runtime version`
- 本机升级：
  - `npm i -g nextclaw@0.13.3`

## 用户/产品视角的验收步骤

1. 在本机执行 `nextclaw --version`，应显示 `0.13.3`。
2. 执行 `nextclaw remote --help`，应能看到 `connect` 子命令，不再出现 `unknown command 'remote'`。
3. 执行 `nextclaw status`，确认本地 NextClaw 服务处于 `healthy`。
4. 执行 `nextclaw remote connect --once`。
5. 在输出中确认以下结果：
   - remote device 成功注册
   - local origin 为本地 UI 地址
   - platform 为 `https://ai-gateway-api.nextclaw.io`
   - remote connector 成功建立 websocket 连接
