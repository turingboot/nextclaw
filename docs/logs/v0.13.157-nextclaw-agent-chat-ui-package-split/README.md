# v0.13.157-nextclaw-agent-chat-ui-package-split

## 迭代完成说明
- 新建独立可发布包 `packages/nextclaw-agent-chat-ui`，将 chat 可复用层正式迁移出 `@nextclaw/ui` 宿主包。
- 迁移内容仅包含可复用层：`default-skin`、`hooks`、`internal`、`ui`、`utils`、`view-models` 与公共导出入口。
- `packages/nextclaw-ui` 保留宿主层职责：`containers`、nextclaw adapters、presenter/store、页面壳子与运行时接线。
- 宿主层已改为消费 `@nextclaw/agent-chat-ui`，包括输入区、消息区、view-model 类型与无业务 hooks。
- 新包补齐了独立 `package.json`、`tsconfig.json`、`vite.config.ts`，并接入 workspace 安装、根级 `build/lint/tsc` 脚本链路。
- 为保证真实可拆包，已将新包源码中的旧宿主别名改为相对导入，避免继续依赖 `@/components/chat/*` 的宿主路径语义。

## 测试 / 验证 / 验收方式
- `PATH=/opt/homebrew/bin:$PATH pnpm install`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-agent-chat-ui tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-agent-chat-ui lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-agent-chat-ui build`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-agent-chat-ui test`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui build`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui exec eslint src/components/chat/ChatConversationPanel.tsx src/components/chat/adapters/chat-input-bar.adapter.ts src/components/chat/adapters/chat-message.adapter.ts src/components/chat/chat-input/chat-input-bar.controller.ts src/components/chat/containers/chat-input-bar.container.tsx src/components/chat/containers/chat-message-list.container.tsx src/components/chat/index.ts`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui test src/components/chat/chat-input/chat-input-bar.controller.test.tsx src/components/chat/adapters/chat-input-bar.adapter.test.ts src/components/chat/adapters/chat-message.adapter.test.ts`

## 发布 / 部署方式
- 本次仅完成包结构拆分与 workspace 接线，未执行 npm publish 或线上部署。
- 后续若需要对外发布，应先为 `@nextclaw/agent-chat-ui` 补 changeset，再走仓库既有的 `release:version` / `release:publish` 流程。
- 若只发布前端宿主应用，继续沿用现有前端发布链路即可；新包已纳入 workspace 构建与校验，不需要额外手工拷贝 chat 代码。

## 用户 / 产品视角的验收步骤
- 打开 `nextclaw-ui` chat 页面，确认欢迎态、空态和 provider hint 仍正常显示。
- 在输入框输入 `/` 并选择 skill，确认 slash 菜单、skill picker、selected chips、send/stop 交互无回归。
- 发送一条普通消息，确认 user / assistant / tool 消息仍可正常渲染。
- 发送或查看包含 markdown / code / tool card / reasoning 的消息，确认复制按钮、语言标签、消息布局与之前一致。
- 确认此次结构拆分后，宿主包仍可正常构建运行，而可复用 chat UI 已具备独立包边界。
