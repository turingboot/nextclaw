# v0.13.155-nextclaw-ui-chat-prepackage-boundary-hardening

## 迭代完成说明（改了什么）
- 将 chat 可复用层对宿主 `@/components/ui/*` 的直接依赖切换为 chat 自己的 `default-skin` 实现。
- 新增 `packages/nextclaw-ui/src/components/chat/default-skin`：
  - `button.tsx`
  - `input.tsx`
  - `popover.tsx`
  - `select.tsx`
  - `tooltip.tsx`
- 新增 `packages/nextclaw-ui/src/components/chat/internal/cn.ts`，复用层不再直接依赖项目级 `@/lib/utils`。
- `chat-ui-primitives.tsx` 改为仅组合 chat 自己的 default-skin 原件。
- `chat-input-bar-actions.tsx` 改为使用 chat 自己的按钮实现。
- 消息区复用组件改为使用 chat 内部 `cn`：
  - `chat-message-list.tsx`
  - `chat-message-markdown.tsx`
  - `chat-message-meta.tsx`
  - `chat-message.tsx`
  - `chat-reasoning-block.tsx`
- 至此，chat 复用层的主要边界变为：
  - 包内依赖：`react`、`radix`、`lucide-react`、`react-markdown`、`remark-gfm`、`clsx`、`tailwind-merge`
  - 不再直接依赖 Nextclaw 宿主 UI 基建和项目级 util

## 测试/验证/验收方式
- `pnpm -C packages/nextclaw-ui tsc`
- `pnpm -C packages/nextclaw-ui test src/components/chat/ui/chat-input-bar/chat-input-bar.test.tsx src/components/chat/ui/chat-input-bar/chat-slash-menu.test.tsx src/components/chat/ui/chat-message-list/chat-message-list.test.tsx`
- `pnpm -C packages/nextclaw-ui build`
- `pnpm -C packages/nextclaw-ui exec eslint src/components/chat/default-skin src/components/chat/internal src/components/chat/ui/primitives/chat-ui-primitives.tsx src/components/chat/ui/chat-input-bar/chat-input-bar-actions.tsx src/components/chat/ui/chat-message-list/chat-message-list.tsx src/components/chat/ui/chat-message-list/chat-message-markdown.tsx src/components/chat/ui/chat-message-list/chat-message-meta.tsx src/components/chat/ui/chat-message-list/chat-message.tsx src/components/chat/ui/chat-message-list/chat-reasoning-block.tsx`

## 发布/部署方式
- 本迭代为 `nextclaw-ui` chat 模块拆包前边界硬化，不涉及服务端、协议或 migration。
- 按现有前端发布流程随主线发布即可。

## 用户/产品视角的验收步骤
1. 打开 Chat 页面，确认消息区、输入区、代码块复制等主行为无回归。
2. 打开 slash menu 和 skill picker，确认交互和样式保持正常。
3. 在消息区验证 markdown、code、reasoning、tool card 仍可正常渲染。
