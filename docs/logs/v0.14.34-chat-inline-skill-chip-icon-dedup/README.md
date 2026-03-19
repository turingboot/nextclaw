# v0.14.34 Chat Inline Skill Chip Icon Dedup

## 迭代完成说明

- 将聊天输入框内联 skill chip 的图标从 `BrainCircuit` 调整为 `Tag`。
- 这样可避免与下方 skill picker 入口按钮使用相同图标，降低视觉重复感。
- 新图标语义也更贴近“已挂载的内联标签 / token”，更适合输入框内的 chip 场景。

## 测试/验证/验收方式

- `pnpm -C packages/nextclaw-agent-chat-ui lint`
- `pnpm -C packages/nextclaw-ui build`
- `python3 .codex/skills/post-edit-maintainability-guard/scripts/check_maintainability.py --paths packages/nextclaw-agent-chat-ui/src/components/chat/ui/chat-input-bar/chat-input-bar-textarea.tsx`
- 观察点：
  - 输入框内联 skill chip 图标与下方 skill picker 按钮图标不再重复。
  - 输入框整体布局、chip 尺寸与文本对齐保持稳定。

## 发布/部署方式

- 本次修改尚未单独发布。
- 后续按既有前端发布流程一并发布即可；发布前建议补一次聊天页手工 UI 冒烟，确认 chip 图标替换后视觉层级正常。

## 用户/产品视角的验收步骤

1. 打开聊天页并选择一个 skill。
2. 确认输入框内的 skill chip 使用标签类图标，而不是与下方 skill picker 入口相同的脑图标。
3. 对比下方 skill picker 按钮，确认两个入口的视觉角色已经区分开：上方是“已选标签”，下方是“打开选择器”。
