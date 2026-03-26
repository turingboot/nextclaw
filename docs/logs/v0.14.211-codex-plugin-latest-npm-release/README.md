# v0.14.211 codex plugin latest npm release

## 迭代完成说明（改了什么）

- 确认 `@nextclaw/nextclaw-ncp-runtime-plugin-codex-sdk` 的 npm 已发布版本 `0.1.21` 落后于当前 `HEAD`，因为 `@nextclaw/nextclaw-ncp-runtime-plugin-codex-sdk@0.1.21` tag 之后又新增了未发版提交。
- 为该包新增 changeset，并通过标准发布流程把版本提升到 `0.1.22`。
- 完成真实 npm 发布与 tag 创建，最新已发布版本为 `@nextclaw/nextclaw-ncp-runtime-plugin-codex-sdk@0.1.22`。

## 测试/验证/验收方式

- 包级验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/extensions/nextclaw-ncp-runtime-plugin-codex-sdk build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/extensions/nextclaw-ncp-runtime-plugin-codex-sdk lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/extensions/nextclaw-ncp-runtime-plugin-codex-sdk tsc`
- 相关回归测试：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw exec vitest run src/cli/commands/codex-runtime-plugin-provider-routing.test.ts`
- 打包/安装冒烟：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/extensions/nextclaw-ncp-runtime-plugin-codex-sdk pack --pack-destination /tmp/nextclaw-codex-plugin-pack`
  - 检查 tarball 内 `package/package.json` 已将 `workspace:*` 依赖解析为真实版本，且 `package/openclaw.plugin.json` 已包含 `accessMode` 默认值 `full-access`
  - 在 `/tmp` 隔离目录安装 tarball 并执行 `import('@nextclaw/nextclaw-ncp-runtime-plugin-codex-sdk')`，结果输出 `CODEX_PLUGIN_IMPORT_OK`
- 标准发布守卫：
  - `PATH=/opt/homebrew/bin:$PATH NPM_CONFIG_USERCONFIG=/Users/peiwang/Projects/nextbot/.npmrc pnpm release:version`
  - `PATH=/opt/homebrew/bin:$PATH NPM_CONFIG_USERCONFIG=/Users/peiwang/Projects/nextbot/.npmrc pnpm release:publish`
- 发布后核验：
  - `PATH=/opt/homebrew/bin:$PATH npm view @nextclaw/nextclaw-ncp-runtime-plugin-codex-sdk version --json`
  - 结果应返回 `0.1.22`

## 发布/部署方式

- 本次为 npm 包发布，无额外后端部署或数据库 migration。
- 按项目标准流程执行：
  - `pnpm release:version`
  - `pnpm release:publish`
- 发布产物：
  - npm：`@nextclaw/nextclaw-ncp-runtime-plugin-codex-sdk@0.1.22`
  - git tag：`@nextclaw/nextclaw-ncp-runtime-plugin-codex-sdk@0.1.22`

## 用户/产品视角的验收步骤

1. 在任意隔离目录执行 `pnpm add @nextclaw/nextclaw-ncp-runtime-plugin-codex-sdk@0.1.22`。
2. 读取安装后的 `openclaw.plugin.json`，确认配置项使用 `accessMode`，并且默认值为 `full-access`。
3. 在 NextClaw 中启用该插件，创建 `codex` 会话。
4. 不显式填写权限配置时，确认运行使用默认 `full-access` 行为；如显式设置 `accessMode=workspace-write` 或旧字段 `sandboxMode=read-only`，确认都能正确映射到运行时权限模型。
5. 发送一次普通文本消息，确认会话可正常启动且不会因为发布包缺少内部 helper 模块而报错。
