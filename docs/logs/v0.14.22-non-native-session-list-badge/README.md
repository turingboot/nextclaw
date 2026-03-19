# v0.14.22 non-native session list badge

## 迭代完成说明

- 在会话列表中为非 `native` 会话新增了轻量类型标记，便于快速区分 `Codex` 等非默认链路会话。
- 标记文案优先复用当前可用的 session type label；当插件暂时不可用时，仍会对已存在会话做稳妥回退展示。
- 补充了 `ChatSidebar` 测试，覆盖“非 native 显示标记”和“native 不显示标记”两个约束。

## 测试/验证/验收方式

- 运行 `pnpm --filter nextclaw-ui test -- --run src/components/chat/ChatSidebar.test.tsx`
- 人工验证：打开聊天侧边栏，确认 `Codex` 等非 native 会话带有类型 badge，`Native` 会话不展示该 badge。

## 发布/部署方式

- 本次为前端 UI 代码改动，按常规前端发布流程发布 `nextclaw-ui` 相关产物即可。
- 若仅本地开发验证，可通过 `pnpm dev start` 直接查看效果，无需额外迁移。

## 用户/产品视角的验收步骤

1. 安装并启用至少一个非 native 会话类型插件，例如 Codex SDK 插件。
2. 新建一个非 native 会话，再保留一个 native 会话。
3. 回到聊天侧边栏，确认非 native 会话标题旁有清晰的类型标记。
4. 确认 native 会话仍保持简洁，不出现多余标记。
