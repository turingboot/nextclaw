# v0.13.139-nextclaw-ui-agent-chat-component-adoption

## 迭代完成说明

本次迭代将 `packages/nextclaw-ui` 的聊天展示层正式切换为消费 `@nextclaw/ncp-react-ui` 中已经标准化的 Agent 纯展示组件，目标是让 `ncp-demo` 与 `nextclaw-ui` 共用一套统一、可复用、纯展示的 Agent 场景组件积木。

本次完成内容：

- 为 `packages/nextclaw-ui` 新增 `@nextclaw/ncp-react-ui` 与 `@nextclaw/ncp` 的 workspace 依赖
- 在 `packages/nextclaw-ui/src/main.tsx` 中引入 `@nextclaw/ncp-react-ui/styles.css`
- 将原有超大 `ChatThread.tsx` 替换为标准组件薄包装，内部统一改用 `AgentChatThread`
- 新增 `chat-thread-message-adapter.ts`，负责把 `@nextclaw/agent-chat` 的 `UiMessage` 适配为 `@nextclaw/ncp` 的 `NcpMessage`
- 新增 `agent-chat-labels.ts`，由 `nextclaw-ui` 本地 i18n 向标准组件注入标签文案
- 将 `ChatWelcome.tsx` 改为基于 `AgentChatWelcome` 的薄包装，同时保留 `nextclaw-ui` 现有业务动作入口
- 补充 `chatRoleService`、`chatSourceLabel`、`chatAttachmentLabel` 等展示层文案，完善标准组件在 `nextclaw-ui` 场景下的本地化
- 顺手修复了本次接入过程中暴露出的 `nextclaw-ui` 硬错误，确保 `build/tsc/lint` 可以完成

相关迭代：

- [v0.13.137-agent-chat-display-components-standardization](../v0.13.137-agent-chat-display-components-standardization/README.md)
- [v0.13.138-agent-chat-component-file-structure-normalization](../v0.13.138-agent-chat-component-file-structure-normalization/README.md)

## 测试/验证/验收方式

已执行验证：

- `PATH=/opt/homebrew/bin:$PATH pnpm install`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/ncp-packages/nextclaw-ncp-react-ui build`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/ncp-packages/nextclaw-ncp-react-ui lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/ncp-packages/nextclaw-ncp-react-ui tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui build`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C apps/ncp-demo smoke:ui`

验证结果：

- `@nextclaw/ncp-react-ui` 构建、lint、类型检查通过
- `nextclaw-ui` 构建、类型检查通过
- `nextclaw-ui` 的 `lint` 已无 error，仅剩仓库内原有 warning
- `ncp-demo` UI 冒烟通过，说明标准展示组件在 demo 侧仍然稳定

## 发布/部署方式

本次变更未执行发布。

后续如需发布：

- 继续通过 workspace 方式在仓库内联调 `@nextclaw/ncp-react-ui`
- 若要发布 UI 相关包，按现有 release 流程执行受影响包的 version/publish
- 发布前至少重复执行本迭代记录中的 build/lint/tsc 与 UI 冒烟

本次不适用：

- 远程 migration：不适用，未涉及数据库或后端 schema
- 线上部署：不适用，本次主要为前端展示层复用与解耦

## 用户/产品视角的验收步骤

1. 启动 `nextclaw-ui`，进入聊天页面。
2. 创建一个新会话，确认欢迎空态展示为统一的标准卡片结构。
3. 发送普通文本、包含 markdown 的消息，确认消息线程由统一样式渲染。
4. 触发 reasoning、tool invocation、source、file 等消息 part，确认都通过统一组件正确展示。
5. 切换 session、刷新页面、继续对话，确认展示与原有业务行为保持一致。
6. 启动 `ncp-demo` 并运行 `smoke:ui`，确认 demo 与 `nextclaw-ui` 共同消费同一套展示组件后仍能通过关键路径验证。
