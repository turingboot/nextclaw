# 迭代完成说明（改了什么）

- 为 NextClaw Web Chat 增加了统一的 slash 命令机制接入：
  - 在 `@nextclaw/core` 的 `CommandRegistry` 中补充了文本命令解析与执行入口（`parseTextCommand` / `executeText`）。
  - 在 `nextclaw` 的 `GatewayAgentRuntimePool.processDirect` 增加命令优先拦截：输入以 `/` 开头时先执行命令，再决定是否进入模型。
  - 新增 `@nextclaw/server` 接口 `GET /api/chat/commands`，对前端暴露命令目录。
- 为 Chat 输入框增加了 slash 交互面板（仅 `Commands` + `Skills`）：
  - 输入 `/` 时出现命令列表；
  - 左侧为命令/技能列表，右侧为详情面板（命令用法/技能信息）；
  - 支持键盘上下选择 + 回车确认；
  - 选择命令插入 `/command ...`，选择技能会加入本轮 `selectedSkills`。
- 补充测试：
  - `@nextclaw/core`：`commands/registry.test.ts`
  - `nextclaw`：`agent-runtime-pool.command.test.ts`
  - `@nextclaw/server`：`router.chat.test.ts`（新增命令目录接口断言）

# 测试/验证/验收方式

- 单元测试：
  - `pnpm -C packages/nextclaw-core test src/commands/registry.test.ts`
  - `pnpm -C packages/nextclaw-server test src/ui/router.chat.test.ts`
  - `pnpm -C packages/nextclaw test -- --run src/cli/commands/agent-runtime-pool.command.test.ts`
- 类型检查：
  - `pnpm -C packages/nextclaw-core tsc`
  - `pnpm -C packages/nextclaw-server tsc`
  - `pnpm -C packages/nextclaw-ui tsc`
  - `pnpm -C packages/nextclaw tsc`
- 构建验证：
  - `pnpm -C packages/nextclaw-core build`
  - `pnpm -C packages/nextclaw-server build`
  - `pnpm -C packages/nextclaw-ui build`
  - `pnpm -C packages/nextclaw build`
- 备注（仓库现状）：
  - 全量 `pnpm lint` 在仓库已有历史问题处失败（`packages/nextclaw/src/cli/skills/clawhub.ts` 的 `no-useless-escape`）。
  - 全量 `pnpm tsc` / `pnpm build` 在 `workers/marketplace-api` 现有类型问题处失败（与本次改动无关）。

# 发布/部署方式

- 本次为 UI + server + runtime 变更，按常规 monorepo 发布流程：
  1. 合并代码并按变更包做版本管理（changeset）。
  2. 发布 `@nextclaw/core`、`@nextclaw/server`、`@nextclaw/ui`、`nextclaw`。
  3. 若发布桌面/安装器，按既有 installer 流程重新打包。
- 无数据库 schema 变更，无 migration 需求。

# 用户/产品视角的验收步骤

1. 打开 Chat 页面，在输入框键入 `/`。
2. 确认出现 slash 面板，左侧只有 `Commands` 与 `Skills` 两类，右侧显示当前选中项详情。
3. 使用键盘 `↑/↓` 和 `Enter` 选择一条命令（例如 `/model`），确认命令文本被插入输入框。
4. 使用同样方式选择一个技能，确认其被加入输入框下方技能标签（selected skills）。
5. 发送 `/status`、`/new`、`/model <name>` 等命令，确认返回结果为命令执行结果，不走模型自由生成。
