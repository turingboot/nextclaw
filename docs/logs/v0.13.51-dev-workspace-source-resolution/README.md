# 迭代完成说明（改了什么）

- 修复 `pnpm run dev` 在 Windows 开发态下因 workspace 包导出仅指向 `dist` 而触发的 `ERR_MODULE_NOT_FOUND`。
- 为 `@nextclaw/core`、`@nextclaw/runtime`、`@nextclaw/server`、`@nextclaw/openclaw-compat`、`@nextclaw/channel-runtime` 增加 `exports["."].development -> ./src/index.ts`，使本地开发优先解析源码入口。
- 更新 `scripts/dev-runner.mjs`，为后端 `tsx watch` 进程注入 `NODE_OPTIONS=--conditions=development`，让 Node ESM 解析命中开发态条件导出。
- 补齐 `packages/nextclaw-server/tsconfig.json` 与 `packages/nextclaw/tsconfig.json` 的本地路径映射，覆盖 `@nextclaw/openclaw-compat` 与 `@nextclaw/channel-runtime`，避免未预构建时 `tsc` 解析失败。

# 测试/验证/验收方式

- 类型校验：
  - `pnpm -C packages/nextclaw-core tsc`
  - `pnpm -C packages/nextclaw-runtime tsc`
  - `pnpm -C packages/extensions/nextclaw-channel-runtime tsc`
  - `pnpm -C packages/nextclaw-openclaw-compat tsc`
  - `pnpm -C packages/nextclaw-server tsc`
  - `pnpm -C packages/nextclaw tsc`
- 开发入口快速校验：
  - 在 `packages/nextclaw` 下执行 `$env:NODE_OPTIONS='--conditions=development'; .\node_modules\.bin\tsx.cmd --tsconfig tsconfig.json src/cli/index.ts --version`
- 冒烟测试：
  - 执行根目录 `pnpm run dev`
  - 观察点：不再出现 `ERR_MODULE_NOT_FOUND: ... @nextclaw/channel-runtime/dist/index.js`
  - 观察点：前端 Vite 启动成功，后端打印 UI/API 地址

# 发布/部署方式

- 本次为本地开发链路修复，不涉及生产部署、远程 migration 或发布命令。
- 若后续需要发版，按仓库既有 NPM 发布流程执行 `changeset -> version -> publish`，无需为本次修复追加特殊部署步骤。

# 用户/产品视角的验收步骤

1. 在仓库根目录执行 `pnpm run dev`。
2. 确认终端出现 `Frontend:`、`API base:`、Vite ready 日志，以及后端 UI/API 地址。
3. 确认启动过程中不再出现 `Cannot find module ... @nextclaw/channel-runtime/dist/index.js`。
4. 打开终端输出中的前端地址，确认页面可访问。
