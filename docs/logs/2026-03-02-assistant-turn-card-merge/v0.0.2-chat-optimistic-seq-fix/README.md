# 2026-03-02 v0.0.2-chat-optimistic-seq-fix

## 迭代完成说明（改了什么）

- 修复 Chat 流式阶段 `optimistic user event` 的 `seq` 计算问题。
- 将 `seq` 从固定 `0` 改为 `historyEvents` 的最大 `seq + 1`，避免排序时被放到最前，导致 assistant/tool 事件并入错误轮次后再重排。
- 该修复直接针对“工具卡一会出现一会消失/挪位”的高概率触发路径（流式中真实 user 事件未到达前）。

关键文件：

- `packages/nextclaw-ui/src/components/chat/ChatPage.tsx`

## 测试 / 验证 / 验收方式

已执行：

- `pnpm -C packages/nextclaw-ui exec eslint src/components/chat/ChatPage.tsx`
- `pnpm -C packages/nextclaw-ui tsc`
- `pnpm -C packages/nextclaw-ui build`

结果：

- 定向 eslint 通过（仅存在仓库既有函数行数 warning）。
- tsc 通过。
- build 通过。

## 发布 / 部署方式

1. 合并代码。
2. 执行前端发布流程。
3. 发布后做线上 chat 冒烟（重点观察工具卡是否再出现“闪现后消失/换位”）。

## 用户 / 产品视角的验收步骤

1. 打开 Chat，发送会触发工具调用的请求。
2. 在流式返回期间持续观察工具卡顺序与归属。
3. 确认工具卡不再出现“先显示在旧卡片，随后消失或跳到新卡片”的现象。
4. 重复 3~5 次，包含快网络与慢网络场景。
