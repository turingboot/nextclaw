# v0.8.35-chat-tool-merge-streaming

## 迭代完成说明（改了什么）

- 系统性升级 Chat 工具渲染体验：
  - 新增消息预处理 `combineToolCallAndResults`，按 `tool_call_id` 将工具调用与工具结果合并。
  - 工具卡从“调用卡/结果卡分离”升级为“单卡展示调用 + 输出结果”。
  - 对无法匹配到调用的 `tool` 消息保留兜底结果卡，避免信息丢失。
- 增强会话线程渲染：
  - 在分组前执行工具消息合并，减少冗余消息气泡，提升可读性。
- 增强低成本流式体验（前端渐进流式）：
  - 在 `POST /api/chat/turn` 返回后，对 `reply` 做字符渐进渲染预览。
  - 渲染完成后自动回落到真实历史数据，保持数据一致性。

关键文件：

- `packages/nextclaw-ui/src/lib/chat-message.ts`
- `packages/nextclaw-ui/src/components/chat/ChatThread.tsx`
- `packages/nextclaw-ui/src/components/chat/ChatPage.tsx`

## 测试 / 验证 / 验收方式

已执行：

- 定向验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui lint`
- 全量验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm tsc`
- 运行态冒烟（隔离目录，避免写入仓库）：
  - `NEXTCLAW_HOME=/tmp/... node packages/nextclaw/dist/cli/index.js ui --port 18765 --no-open`
  - `GET /api/health` 返回 `{"ok":true,"data":{"status":"ok"}}`
  - `POST /api/chat/turn` 在未配置 provider 时返回 `500 + CHAT_TURN_FAILED`（预期行为，证明链路可达）

## 发布 / 部署方式

按项目 NPM 发布流程执行：

1. `PATH=/opt/homebrew/bin:$PATH pnpm release:frontend`

实际发布结果：

- `nextclaw@0.8.35`
- `@nextclaw/ui@0.5.23`

生成标签：

- `nextclaw@0.8.35`
- `@nextclaw/ui@0.5.23`

## 用户 / 产品视角的验收步骤

1. 启动：`nextclaw start`
2. 打开 UI：`http://127.0.0.1:18791`
3. 进入 Chat，发送会触发工具调用的问题（如搜索/读文件类请求）
4. 观察工具展示是否为“单卡（调用 + 输出）”，而非分离两张卡
5. 连续发送多轮，确认消息分组仍正常
6. 发送普通问题，观察助手回复是否先渐进显示，再稳定落库到历史
7. 切换会话并返回，确认历史中工具卡与文本均正常可读
