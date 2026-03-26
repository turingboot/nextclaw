# v0.14.210-ncp-image-inline-display

## 迭代完成说明

- 调整 `@nextclaw/ncp-react-ui` 的消息图片渲染逻辑：当消息 part 为图片附件时，只渲染图片本体，不再在图片下方追加文件名 / MIME 的附件横幅。
- 保留非图片附件的原有文件卡片展示，避免把普通文件附件也误简化。
- 移除消息图片的圆角样式，避免图片边缘内容被裁切或遮挡。

## 测试/验证/验收方式

- 构建验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/ncp-packages/nextclaw-ncp-react-ui build`
- Lint 验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/ncp-packages/nextclaw-ncp-react-ui lint`
- 类型验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/ncp-packages/nextclaw-ncp-react-ui tsc`
- 冒烟验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C apps/ncp-demo/frontend exec node --input-type=module <<'EOF'`
  - `import React from 'react';`
  - `import { renderToStaticMarkup } from 'react-dom/server';`
  - `import { MessagePart } from '../../../packages/ncp-packages/nextclaw-ncp-react-ui/dist/index.js';`
  - `// 分别渲染 image/png 与 text/plain，断言图片分支不包含 part-file-meta，文件分支保留 part-file-meta`
  - `EOF`
  - 观察点：
    - 图片附件输出仅包含 `<img class="part-file-image" ...>`，不包含 `part-file-meta`
    - 非图片附件仍输出 `part-file-meta` 与 MIME 文本
- 可维护性自检：
  - `PATH=/opt/homebrew/bin:$PATH node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths packages/ncp-packages/nextclaw-ncp-react-ui/src/chat/message-part.tsx packages/ncp-packages/nextclaw-ncp-react-ui/src/styles/index.css`

## 发布/部署方式

- 本次未执行正式发布。
- 如需带出该改动，至少需要重新构建并发布 `@nextclaw/ncp-react-ui`，并同步验证消费方（如 `apps/ncp-demo/frontend`）使用的是包含本次修改的版本。

## 用户/产品视角的验收步骤

1. 打开带消息列表的 NCP 聊天界面。
2. 发送一条包含图片附件的消息。
3. 确认图片下方不再出现“图标附件”或文件元信息横幅。
4. 确认图片四角不再有圆角裁切，边缘内容完整可见。
5. 如再发送一个非图片文件附件，确认它仍然以文件卡片形式展示，没有影响普通附件信息。
