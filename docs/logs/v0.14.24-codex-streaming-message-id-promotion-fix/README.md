# v0.14.24 codex streaming message id promotion fix

## 迭代完成说明

- 修复了 NCP 会话状态管理器中一个底层缺陷：
  - 当 runtime 先发 tool 事件、后发真正的 assistant message id 时，旧实现会把已有 streaming assistant 覆盖掉，导致已积累的 tool parts 丢失。
- 该问题会放大 Codex 这类 runtime 的刷新风险，因为 Codex 更容易出现 `tool-first -> text-later` 的事件序列。
- 本次将相关的 message-id promotion 和 tool-part 处理逻辑拆到了独立 util，避免继续把主状态文件做大。
- 补充了状态管理器回归测试，覆盖：
  - tool-first 流式过程中，后续 text 事件切到真实 assistant message id 时，已有 tool parts 不丢失
  - 最终 `run.finished` 后 assistant 消息能稳定落入最终历史

## 测试/验证/验收方式

- 运行：
  - `pnpm --filter ./packages/ncp-packages/nextclaw-ncp-toolkit test -- --run src/agent/agent-conversation-state-manager.test.ts`
- 可维护性自检：
  - `python3 .codex/skills/post-edit-maintainability-guard/scripts/check_maintainability.py --paths packages/ncp-packages/nextclaw-ncp-toolkit/src/agent/agent-conversation-state-manager.ts packages/ncp-packages/nextclaw-ncp-toolkit/src/agent/agent-conversation-state-manager.utils.ts packages/ncp-packages/nextclaw-ncp-toolkit/src/agent/agent-conversation-state-manager.test.ts`
- 额外本地核验：
  - 直接通过 `POST /api/ncp/agent/send` 创建新的 `codex` 会话，并确认 `~/.nextclaw/sessions/*.jsonl` 与 `/api/ncp/sessions/:id/messages` 都能看到 assistant 历史。

## 发布/部署方式

- 本次为 NCP toolkit 内部逻辑修复，无 migration。
- 按常规前端/服务发布流程发布依赖该 toolkit 的相关包即可。

## 用户/产品视角的验收步骤

1. 新建一个 `Codex` 会话。
2. 发送一条容易触发工具调用的消息，等待 assistant 开始工作。
3. 在 assistant 输出过程中刷新页面。
4. 回到原会话，确认 assistant 已产生的回复内容不会凭空消失。
5. 等回复结束后再次刷新，确认历史仍然存在。
