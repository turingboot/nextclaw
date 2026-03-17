# v0.13.137-agent-chat-display-components-standardization

## 迭代完成说明

本次迭代继续扩展 `@nextclaw/ncp-react-ui`，把 `nextclaw-ui` 中已经验证过的对话展示模式进一步标准化，沉淀成更适合复用的 Agent 纯展示组件，并在 `ncp-demo` 中完成接入验证。

本次完成内容：

- 在 `packages/ncp-packages/nextclaw-ncp-react-ui/src/agent-chat` 下新增标准化对话展示组件：
  - `agent-chat-panel`
  - `agent-chat-header`
  - `agent-chat-thread`
  - `agent-chat-composer`
  - `agent-chat-welcome`
  - `agent-chat-types`
  - `agent-chat-utils`
  - `agent-chat-markdown`
- 将 `nextclaw-ui` 中更成熟的对话展示能力抽象为纯展示实现，包括：
  - markdown 消息渲染
  - reasoning 折叠区
  - tool invocation 展示卡片
  - source/file 等消息 part 的标准展示
  - typing 状态与标准化对话气泡布局
- 保持边界纯净：
  - 未下沉 presenter/store/runtime/model/skills 等业务编排
  - 所有新组件仍然只通过 props 驱动
- 将 `apps/ncp-demo/frontend/src/components/chat-panel.tsx` 改造为直接消费新的 `AgentChatPanel` 与 `AgentChatWelcome`
- 为标准消息节点补充稳定的 `data-agent-chat-*` 属性，避免自动化验证依赖脆弱的视觉 class
- 同步更新 `apps/ncp-demo/scripts/smoke-ui.mjs`，使 UI 冒烟脚本对接新的标准组件结构

相关设计文档：

- [`@nextclaw/ncp-react-ui` 设计文档](../../plans/2026-03-17-ncp-react-ui-design.md)

## 测试/验证/验收方式

已执行验证：

- `PATH=/opt/homebrew/bin:$PATH pnpm install`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/ncp-packages/nextclaw-ncp-react-ui build`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/ncp-packages/nextclaw-ncp-react-ui lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/ncp-packages/nextclaw-ncp-react-ui tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C apps/ncp-demo/frontend build`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C apps/ncp-demo/frontend lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C apps/ncp-demo/frontend tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C apps/ncp-demo lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C apps/ncp-demo smoke:ui`

验证结果：

- 新增的标准化 Agent 对话组件可独立构建、lint、类型检查通过
- `ncp-demo` 前端在切换到新标准组件后构建、lint、类型检查通过
- UI 冒烟验证通过，覆盖 session 创建、消息发送、切换、刷新恢复、运行中 stop 等关键路径

## 发布/部署方式

本次变更未执行发布。

后续如需发布：

- 本地联调阶段：继续通过 workspace 依赖消费 `@nextclaw/ncp-react-ui`
- 包级校验阶段：执行新包与 `ncp-demo` 的 build/lint/tsc
- 若后续要将该包正式纳入外部发布流程，再根据 release/version 流程补充版本管理与发布动作

本次不适用：

- 远程 migration：不适用，未涉及数据库或后端 schema 变更
- 线上部署：不适用，本次仅涉及前端展示层标准化与 demo 接入

## 用户/产品视角的验收步骤

1. 启动 `ncp-demo` 前后端。
2. 打开页面后，确认聊天主区变为新的标准化对话界面，而不是旧版基础列表样式。
3. 在空会话状态下，确认 welcome 区块与示例动作卡片正常显示。
4. 点击 welcome 卡片，确认输入框草稿被正确填充。
5. 发送一条消息，确认用户消息和 Agent 消息以新标准气泡样式渲染。
6. 如消息包含工具调用、reasoning、source 或附件 part，确认对应展示卡片结构清晰可读。
7. 创建新 session、切回旧 session、刷新页面并 stop 运行中的任务，确认关键行为仍然正常。
