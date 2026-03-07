# v0.12.28-frontend-release-0.9.14

## 迭代完成说明（改了什么）
- 执行前端发布闭环，发布版本：`nextclaw@0.9.14`、`@nextclaw/ui@0.6.8`。
- 发布前执行 `release:version`，完成版本号与 changelog 变更。
- 发布后同步 `packages/nextclaw/ui-dist` 产物（由 `packages/nextclaw` 构建流程复制 UI dist）。

## 测试/验证/验收方式
- 发布流程校验：`pnpm release:publish`（含 `build + lint + tsc`）通过并完成发布。
- 发布后冒烟（隔离目录，不写仓库）：
  - `TMP_DIR=$(mktemp -d /tmp/nextclaw-release-smoke.XXXXXX) && NEXTCLAW_HOME="$TMP_DIR/home" pnpm dlx nextclaw@0.9.14 --version && rm -rf "$TMP_DIR"`
  - 观察点：输出版本号 `0.9.14`。

## 发布/部署方式
- 执行顺序：
  - `node scripts/release-frontend.mjs`
  - `pnpm release:version`
  - `pnpm release:publish`
- 发布结果：
  - `nextclaw@0.9.14`
  - `@nextclaw/ui@0.6.8`

## 用户/产品视角的验收步骤
- 全新环境执行：`pnpm dlx nextclaw@0.9.14 --version`。
- 进入聊天页，验证 slash 技能菜单行为：
  - 输入 `/` 可弹出 skills 菜单。
  - 输入空格或按 `Esc` 后菜单关闭。
  - 同一 `/xxx` 输入链路继续编辑不会自动重开；退出 slash 语境后重新输入 `/` 可再次触发。
