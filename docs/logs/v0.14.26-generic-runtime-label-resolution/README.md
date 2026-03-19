# v0.14.26 generic runtime label resolution

## 迭代完成说明

- 收紧了 session type/runtime 的通用性边界：
  - 只有 `native` 作为内建默认类型被特殊识别。
  - 其它 runtime 不再被前后端硬编码感知，不再内建 `codex`、`claude-agent-sdk` 之类的专属分支。
- 前端现在统一按以下规则显示会话类型名称：
  - 优先使用服务端或插件下发的显式 `label`
  - 如果没有显式 `label`，则对 runtime key 做中性格式化展示，例如 `workspace-agent` -> `Workspace Agent`
- 后端 `session-types` 列表与 CLI service 的 runtime label 生成也同步改成同一原则，避免新增 runtime 时继续污染主链路。
- 补充了前后端回归测试，覆盖：
  - 非 `native` 类型在有显式 label 时正常展示
  - 非 `native` 类型在缺少显式 label 时走通用格式化
  - `native` 仍保持默认内建显示

## 测试/验证/验收方式

- 运行：
  - `pnpm --filter @nextclaw/ui test -- --run src/components/chat/useChatSessionTypeState.test.tsx src/components/chat/ChatSidebar.test.tsx src/components/chat/chat-page-runtime.test.ts`
  - `pnpm --filter @nextclaw/server test -- --run src/ui/router.session-type.test.ts`
  - `pnpm --filter @nextclaw/ui tsc`
  - `pnpm --filter @nextclaw/server tsc`
  - `pnpm --filter nextclaw tsc`
- 可维护性自检：
  - `python3 .codex/skills/post-edit-maintainability-guard/scripts/check_maintainability.py --paths packages/nextclaw-ui/src/components/chat/useChatSessionTypeState.ts packages/nextclaw-ui/src/components/chat/ChatSidebar.tsx packages/nextclaw-ui/src/components/chat/useChatSessionTypeState.test.tsx packages/nextclaw-ui/src/components/chat/ChatSidebar.test.tsx packages/nextclaw-server/src/ui/router/chat-utils.ts packages/nextclaw-server/src/ui/router.session-type.test.ts packages/nextclaw/src/cli/commands/service.ts`
- 说明：
  - maintainability guard 仅报告 [`service.ts`](/Users/peiwang/Projects/nextbot/packages/nextclaw/src/cli/commands/service.ts) 仍是既有超预算大文件，但本次文件行数未增长。

## 发布/部署方式

- 本次为前后端展示与 session type 元信息处理逻辑收口，无 migration。
- 按常规发布流程发布受影响的前端与服务端包即可。

## 用户/产品视角的验收步骤

1. 在启用插件后打开“新增会话”菜单，确认非 `native` 类型的显示名称优先来自插件提供的 label。
2. 准备一个没有显式 label 的自定义 runtime 类型，确认界面仍能显示为通用格式化名称，而不是写死成某个内建 runtime 名。
3. 打开左侧会话列表，确认非 `native` 会话会显示类型标记，`native` 会话不会显示多余标记。
4. 刷新页面并重新进入，确认 session type 相关展示保持一致。
