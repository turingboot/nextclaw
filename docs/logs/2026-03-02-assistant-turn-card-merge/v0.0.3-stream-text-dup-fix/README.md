# 2026-03-02 v0.0.3-stream-text-dup-fix

## 迭代完成说明（改了什么）

- 修复 assistant turn 卡片末尾“重复展示一份汇总文本”的问题。
- 根因：`ChatPage.runSend` 中的局部变量 `streamText` 在每次 assistant `session_event` 后未重置，跨 tool loop 累积了前面轮次的 delta 文本。
- 结果：后续流式预览会把“无工具文本的累计汇总”再次显示在卡片末尾。
- 修复：当收到 assistant `session_event` 时，同时执行 `streamText = ''` 与 `setStreamingAssistantText('')`，确保下一个流式阶段从空状态开始。

关键文件：

- `packages/nextclaw-ui/src/components/chat/ChatPage.tsx`

## 测试 / 验证 / 验收方式

已执行：

- `pnpm -C packages/nextclaw-ui exec eslint src/components/chat/ChatPage.tsx`
- `pnpm -C packages/nextclaw-ui tsc`
- `pnpm -C packages/nextclaw-ui build`

结果：

- 定向 eslint 通过（仅仓库既有 max-lines warning）。
- tsc 通过。
- build 通过。

## 发布 / 部署方式

1. 合并代码。
2. 执行前端发布流程。
3. 发布后进行 chat 冒烟验证。

## 用户 / 产品视角的验收步骤

1. 在 Chat 发起一个会触发多次工具调用的请求。
2. 观察同一 assistant 卡片：不应在卡片末尾再出现“把前面文本汇总后重复展示一次”的段落。
3. 连续测试 3~5 次，确认复现率为 0。
