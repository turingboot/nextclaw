# v0.14.217-frontend-release-flow-optimization

## 迭代完成说明

- 收窄前端发布路径：`release:frontend` 不再复用整仓 `release:publish`，改为走前端专项检查链，只校验 `@nextclaw/agent-chat-ui`、`@nextclaw/ui`、`nextclaw`。
- 去掉硬编码的 `@nextclaw/mcp` / `@nextclaw/server` / `nextclaw` 联动发布组校验，改为仅保留 `prepublishOnly` 守卫检查，避免纯前端改动被强制拖入后端包发版。
- 消除前端发布阶段的重复构建：`@nextclaw/ui` 和 `nextclaw` 的 `prepack` 从 `build` 改为产物校验，确保 release 显式 build 一次后，打包阶段只校验产物完整性，不再重复重建。
- 新增前端发布检查脚本，输出每一步耗时，方便后续定位发版慢点。

## 测试 / 验证 / 验收方式

- `PATH=/opt/homebrew/bin:$PATH node scripts/check-release-groups.mjs`
- `PATH=/opt/homebrew/bin:$PATH node scripts/check-frontend-release.mjs`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui pack --pack-destination /tmp/nextclaw-release-pack-test`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw pack --pack-destination /tmp/nextclaw-release-pack-test`
- `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths package.json scripts/check-release-groups.mjs scripts/check-frontend-release.mjs scripts/verify-package-release-artifacts.mjs packages/nextclaw-ui/package.json packages/nextclaw/package.json`

## 发布 / 部署方式

- 纯前端 UI 变更时，使用 `PATH=/opt/homebrew/bin:$PATH pnpm release:frontend`
- 该流程会：
  - 生成或复用只包含 `@nextclaw/ui` 与 `nextclaw` 的 changeset
  - 执行前端专项检查链
  - 执行 changeset version / publish / tag
- 若是跨前后端或多包联动改动，继续使用通用发布流程 `pnpm release`

## 用户 / 产品视角的验收步骤

1. 做一次仅前端 UI 的小改动。
2. 执行 `pnpm release:frontend`，确认不再要求把 `@nextclaw/mcp` 与 `@nextclaw/server` 一起加入 changeset。
3. 观察发布日志，确认只跑前端专项检查链，而不是整仓 `build + lint + tsc`。
4. 观察 `@nextclaw/ui` 和 `nextclaw` 的 `prepack` 日志，确认输出为产物校验提示，而不是再次执行 build。
5. 发布完成后，验证 `nextclaw` 安装包内的 `ui-dist` 与 `@nextclaw/ui` 构建结果一致。
