# v0.14.35 Chat Inline Skill Chip Icon Semantic Align

## 迭代完成说明

- 将聊天输入框内联 skill chip 的图标从 `Tag` 调整为 `Puzzle`。
- 本次调整的目标是让 chip 图标继续表达“skill 单元/能力块”的语义，而不是落到普通标签分类的语义上。
- 同时保留下方 skill picker 入口的 `BrainCircuit`，形成“上方已选 skill 单元 / 下方打开 skill 选择器”的角色区分。

## 测试/验证/验收方式

- `pnpm -C packages/nextclaw-agent-chat-ui lint`
- `pnpm -C packages/nextclaw-ui build`
- `python3 .codex/skills/post-edit-maintainability-guard/scripts/check_maintainability.py --paths packages/nextclaw-agent-chat-ui/src/components/chat/ui/chat-input-bar/chat-input-bar-textarea.tsx`
- 观察点：
  - 输入框内联 chip 图标保留 skill 语义，不再像普通 tag。
  - 与下方 skill picker 入口图标区分明确。

## 发布/部署方式

- 本次修改尚未单独发布。
- 后续按既有前端发布流程一并发布即可；发布前建议补一次聊天页手工 UI 冒烟，确认 chip 图标替换后的感知符合预期。

## 用户/产品视角的验收步骤

1. 打开聊天页并选择一个或多个 skill。
2. 确认输入框内联 chip 使用 `Puzzle` 风格图标，更像一个已挂载的 skill 单元。
3. 确认下方 skill picker 按钮仍是 `BrainCircuit`，二者语义分工清晰，不会让人误以为是同一个入口。
