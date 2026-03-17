# v0.13.138-agent-chat-component-file-structure-normalization

## 迭代完成说明

本次迭代对 `@nextclaw/ncp-react-ui` 的 `agent-chat` 组件目录进行了结构性重构，目标是统一遵循“每个组件一个文件，必要时再用目录组织”的规则，同时不改变对外功能与行为。

本次完成内容：

- 将 `agent-chat` 中原本多组件混放的文件拆分为单组件单文件结构
- 对于确实存在子组件集合的场景，使用目录承载：
  - `src/agent-chat/markdown/*`
  - `src/agent-chat/thread/*`
- 将以下能力拆分为独立组件文件：
  - code block
  - markdown renderer
  - role avatar
  - message part renderer
  - message card
  - thread
  - reasoning block
  - tool card
  - source card
  - file card
  - step badge
- 更新 `agent-chat-panel` 与包入口 `src/index.ts` 的导出和引用路径
- 保持 `ncp-demo` 消费方式不变，仅验证重构后行为未回归

## 测试/验证/验收方式

已执行验证：

- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/ncp-packages/nextclaw-ncp-react-ui build`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/ncp-packages/nextclaw-ncp-react-ui lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/ncp-packages/nextclaw-ncp-react-ui tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C apps/ncp-demo smoke:ui`

验证结果：

- 组件拆分后新包构建、lint、类型检查通过
- `ncp-demo` UI 冒烟验证通过，说明目录重构未引入展示或交互回归

## 发布/部署方式

本次变更未执行发布。

后续如需发布：

- 本地继续通过 workspace 依赖联调
- 发布前按现有流程执行受影响模块的 build/lint/tsc 与 UI 冒烟验证

本次不适用：

- 远程 migration：不适用
- 线上部署：不适用

## 用户/产品视角的验收步骤

1. 启动 `ncp-demo` 前后端。
2. 打开聊天页面，确认页面样式与上一版标准化对话界面保持一致。
3. 发送消息、切换 session、刷新恢复、stop 运行中任务，确认行为与重构前一致。
4. 从代码结构上检查 `packages/ncp-packages/nextclaw-ncp-react-ui/src/agent-chat`，确认组件已按单文件拆分，只有在存在子组件集合时才使用目录组织。
