# v0.14.25 generic session model fallback

## 迭代完成说明

- 删除了 NCP 聊天页里针对 `codex` 会话的专属默认模型逻辑，不再把某个 runtime 和某个 provider/model 前缀强绑定。
- 将模型同步策略收敛为一套通用规则，并同时用于 legacy chat 与 NCP chat：
  - 先保留当前仍然合法的已选模型
  - 再使用当前会话自己的 `preferredModel`
  - 再回退到最近一次“相同 session type/runtime”的会话模型
  - 如果以上都不可用，则回退到全局默认模型
  - 最后才回退到当前可用列表中的第一个模型
- 补充了纯函数测试，覆盖当前会话优先、同 runtime 最近会话回退、全局默认回退和最终兜底路径。

## 测试/验证/验收方式

- 运行：
  - `pnpm --filter @nextclaw/ui test -- --run src/components/chat/chat-page-runtime.test.ts src/components/chat/useChatSessionTypeState.test.tsx src/components/chat/ChatSidebar.test.tsx src/components/chat/ncp/ncp-session-adapter.test.ts`
  - `pnpm --filter @nextclaw/ui tsc`
  - `pnpm --filter @nextclaw/ui exec eslint src/components/chat/chat-page-runtime.ts src/components/chat/chat-page-runtime.test.ts src/components/chat/chat-page-data.ts src/components/chat/ncp/ncp-chat-page-data.ts`
- 可维护性自检：
  - `python3 .codex/skills/post-edit-maintainability-guard/scripts/check_maintainability.py --paths packages/nextclaw-ui/src/components/chat/chat-page-runtime.ts packages/nextclaw-ui/src/components/chat/chat-page-data.ts packages/nextclaw-ui/src/components/chat/ncp/ncp-chat-page-data.ts packages/nextclaw-ui/src/components/chat/chat-page-runtime.test.ts`
- 说明：
  - `eslint` 仅报告了 [`packages/nextclaw-ui/src/components/chat/chat-page-runtime.ts`](/Users/peiwang/Projects/nextbot/packages/nextclaw-ui/src/components/chat/chat-page-runtime.ts) 中既有的 `max-lines-per-function` warning，未新增 error。

## 发布/部署方式

- 本次为前端模型选择逻辑修正，无 migration。
- 按常规前端发布流程发布 `@nextclaw/ui` 及依赖它的上层应用即可。

## 用户/产品视角的验收步骤

1. 在当前 provider 配置下，先创建一个 `native` 会话，手动切到某个模型并发送消息。
2. 再新建同类型 `native` 会话，确认模型会优先沿用最近一次同类型会话的合法模型，而不是被某个 runtime 特判覆盖。
3. 新建 `codex` 或其它非默认类型会话，确认如果该类型已有最近会话模型，会优先继承该模型；如果对应模型已不可用，则回退到全局默认模型。
4. 关闭某个 provider 或让最近会话模型变成非法后再次进入新会话，确认不会卡在失效模型上，而会稳定回退到全局默认或首个可用模型。
