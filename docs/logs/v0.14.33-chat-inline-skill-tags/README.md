# v0.14.33 Chat Inline Skill Tags

## 迭代完成说明

- 将聊天输入框里已选 skill 的展示，从输入框外的独立 chips 区改成输入主体内部的内联标签流。
- 输入区改为更接近现代 composer 的布局：skill 标签与文本输入共享同一容器，发送前的上下文选择不再割裂。
- skill 标签视觉进一步收敛：移除 `skill` 文案前缀，改为统一图标识别，并缩小 chip 高度、左右 padding 与整体间距。
- 为输入框补上自适应高度逻辑，保证在内联标签存在时，多行输入仍保持稳定。
- 删除旧的外部 selected-items 组件渲染路径，并补充测试覆盖“标签与 textarea 在同一输入容器内”的行为。

## 测试/验证/验收方式

- `pnpm -C packages/nextclaw-agent-chat-ui test`
- `pnpm -C packages/nextclaw-agent-chat-ui tsc`
- `pnpm -C packages/nextclaw-agent-chat-ui build`
- `pnpm -C packages/nextclaw-agent-chat-ui lint`
- `pnpm -C packages/nextclaw-agent-chat-ui test -- --run src/components/chat/ui/chat-input-bar/chat-input-bar.test.tsx`
- `pnpm -C packages/nextclaw-ui build`
- `python3 .codex/skills/post-edit-maintainability-guard/scripts/check_maintainability.py --paths packages/nextclaw-agent-chat-ui/src/components/chat/ui/chat-input-bar/chat-input-bar-textarea.tsx`
- 组件级冒烟观察点：
  - 已选 skill 以图标化 chip 形式出现在输入框内部，而不是输入框外。
  - 点击内联 chip 仍可移除对应 skill。
  - 构建后的 `@nextclaw/ui` 可正常通过集成构建。

## 发布/部署方式

- 本次修改尚未单独发布。
- 后续按项目既有前端发布流程执行即可；若随完整版本发布，建议在真实聊天页补一次手工 UI 冒烟，重点确认：
  - `/` 选中 skill 后 chip 是否内联出现；
  - 多个 skill 同时选择时换行与输入光标是否自然；
  - 点击 chip 移除后发送 payload 中的 `requested_skills` 是否同步更新。

## 用户/产品视角的验收步骤

1. 打开 nextclaw 聊天页，在输入框中输入 `/` 并选择一个 skill。
2. 确认选中的 skill 以紧凑的图标化标签形式直接出现在输入框内部，而不是独立悬浮在输入框外。
3. 连续选择 2 到 3 个 skill，确认标签间距紧凑、整体不显臃肿，输入光标仍自然接在标签后方。
4. 输入多行内容，确认输入框高度会随内容增长，不会把 skill 标签和正文挤压错位。
5. 点击任一 skill 标签，确认它会立即从输入框中移除，再发送消息时该 skill 不再参与本轮请求。
