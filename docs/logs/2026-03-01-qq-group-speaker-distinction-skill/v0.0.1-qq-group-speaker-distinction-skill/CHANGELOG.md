# v0.0.1-qq-group-speaker-distinction-skill

## 迭代完成说明（改了什么）

- 新增内置 skill：`packages/nextclaw-core/src/agent/skills/qq-group-speaker-distinction/SKILL.md`。
- skill 明确约束 QQ 群聊场景的正确策略：
  - 群聊会话保持按 `group_id` 共享；
  - 每条入模消息必须携带稳定发言者标识（`user_id`）。
- 更新内置 skills 索引：`packages/nextclaw-core/src/agent/skills/README.md`。
- 更新日志索引：`docs/logs/README.md`。

## 交付结果

- AI 在处理 QQ 群聊“区分人但不按 user 隔离会话”需求时，有了明确且可执行的标准流程，降低误解概率。
