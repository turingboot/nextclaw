# Acceptance

## 用户/产品视角验收步骤

1. 在 QQ 群聊场景提出需求：“不要按 user 隔离 session，但要区分发言者”。
2. 让 AI 给出方案，确认方案明确包含：
   - 群会话键按 `group_id` 共享；
   - 每条消息注入 `speaker` 标识，且含稳定 `user_id`。
3. 检查 AI 方案不再建议 `qq:group:{group_id}:user:{user_id}` 作为默认群聊会话策略。
4. 用两位不同用户在同一群发消息，确认日志可同时满足：
   - `session_key` 相同；
   - `speaker:user_id` 不同。
5. 观察回答语义，确认 AI 能正确引用和区分两位发言者的上下文。
