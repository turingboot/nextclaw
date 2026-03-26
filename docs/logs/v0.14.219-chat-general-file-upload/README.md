# v0.14.219-chat-general-file-upload

## 迭代完成说明

- 将前端聊天上传能力从“默认仅图片”扩展为“默认支持通用文件上传”，保留图片内联预览。
- 正式 UI 与 NCP demo 同步移除图片专用 `accept` 限制，上传错误文案改为通用文件语义。
- NCP 适配层补齐文件名与大小信息透传，避免正式 UI 回显附件时丢失文件名。
- 非图片附件在共享消息组件与正式聊天 UI 中改为可下载文件卡片，更接近头部产品的附件交互。
- 增补附件渲染与 NCP 适配测试，覆盖命名文件、非图片文件卡片和下载属性。

## 测试/验证/验收方式

- 类型检查：
  - `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/ui tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/agent-chat-ui tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/agent-chat tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/ncp-react tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/ncp-react-ui tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/ncp-demo-frontend tsc`
- UI 级验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/ui test -- chat-message.adapter ncp-session-adapter`
  - `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/agent-chat-ui test -- chat-message-list`
- 可维护性检查：
  - `PATH=/opt/homebrew/bin:$PATH node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths packages/ncp-packages/nextclaw-ncp-react/src/attachments/ncp-attachments.ts apps/ncp-demo/frontend/src/components/chat-panel.tsx packages/ncp-packages/nextclaw-ncp-react-ui/src/chat/message-part.tsx packages/ncp-packages/nextclaw-ncp-react-ui/src/styles/index.css packages/nextclaw-agent-chat/src/types/ui-message.ts packages/nextclaw-ui/src/components/chat/ncp/ncp-session-adapter.ts packages/nextclaw-ui/src/lib/i18n.chat.ts packages/nextclaw-ui/src/components/chat/containers/chat-input-bar.container.tsx packages/nextclaw-ui/src/components/chat/adapters/chat-message.adapter.test.ts packages/nextclaw-ui/src/components/chat/ncp/ncp-session-adapter.test.ts packages/nextclaw-agent-chat-ui/src/components/chat/ui/chat-message-list/chat-message-file.tsx packages/nextclaw-agent-chat-ui/src/components/chat/ui/chat-message-list/chat-message-list.test.tsx`
- 结果：
  - 上述命令通过；维护性检查 `Errors: 0`、`Warnings: 0`。

## 发布/部署方式

- 本次未执行发布。
- 若需随后的前端交付，可按正常 UI 发布流程重新构建包含 `@nextclaw/ui`、`@nextclaw/agent-chat-ui`、`@nextclaw/ncp-react`、`@nextclaw/ncp-react-ui` 的产物并走既有发布链路。

## 用户/产品视角的验收步骤

1. 打开聊天页，点击附件按钮，确认文件选择器不再只允许图片。
2. 选择一个 `pdf`、`txt` 或其它非图片文件，确认输入区出现附件项且可以正常发送。
3. 发送后确认消息区出现文件卡片，展示真实文件名与 MIME 信息。
4. 点击非图片文件卡片，确认浏览器进入下载/打开该附件的数据链接。
5. 选择一张图片发送，确认图片仍以内联预览方式展示，没有退化成普通文件卡片。
