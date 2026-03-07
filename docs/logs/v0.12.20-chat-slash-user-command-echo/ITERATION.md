# 迭代完成说明（改了什么）

- 修复 slash 命令发送后仅显示输出、不显示用户命令的问题。
- 在流式控制器中新增命令回显兜底：
  - 若本轮发送的是 slash 命令；
  - 且后端没有返回 user `session_event`；
  - 则保留本地 optimistic 用户命令事件，与 assistant 结果一起展示。

# 测试/验证/验收方式

- `pnpm -C packages/nextclaw-ui tsc`
- `pnpm -C packages/nextclaw-ui build`

# 发布/部署方式

- 本次仅 UI 逻辑调整，按常规前端发布流程发布即可。
- 无后端/数据库变更，无 migration。

# 用户/产品视角的验收步骤

1. 在 Chat 输入 `/commands` 并发送。
2. 确认消息区先后看到：用户命令气泡 + assistant 命令结果。
3. 再测试 `/status`、`/model`，确认同样展示用户命令与输出。
