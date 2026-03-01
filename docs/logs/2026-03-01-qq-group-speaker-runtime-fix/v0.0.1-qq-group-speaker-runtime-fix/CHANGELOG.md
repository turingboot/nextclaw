# v0.0.1-qq-group-speaker-runtime-fix

## 迭代完成说明（改了什么）

- 修改 QQ 渠道入站消息处理：`packages/extensions/nextclaw-channel-runtime/src/channels/qq.ts`。
- 保持群聊会话按 `group_id` 共享（不按 user 拆会话）同时，在群聊/频道群场景为每条入模文本注入发言者前缀：
  - 格式：`[speaker:user_id=<id>;name=<displayName>] <message>`
- 新增发言者名称提取与 token 清洗逻辑，避免分隔符污染前缀结构。
- 在 QQ metadata 中补充 `userName`（有值时），便于后续扩展。

## 交付结果

- AI 在同一个 QQ 群会话内可区分不同发言者，减少“把两个人当同一个人”的回复错误。
