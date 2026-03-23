# v0.14.129-workspace-path-persist-fix

## 迭代完成说明

- 修复 Model 页面修改 workspace 后“保存成功但刷新回旧值”的问题。
- 前端 `ModelConfig` 提交时改为同时发送 `model` 与 `workspace`。
- 服务端 `PUT /api/config/model` 改为同时持久化 `agents.defaults.workspace`，并在 workspace 变更时发布 `config.updated` 事件。
- 保存时会对 workspace 做规范化：去掉首尾空白；若用户提交空白值，则回退到默认 `~/.nextclaw/workspace`，避免把空字符串写入配置导致运行路径异常。
- 补充前后端回归测试，并同步更新相关设计/PRD 文档，移除“workspace 不持久化”的过期描述。

## 测试/验证/验收方式

- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/server exec vitest run src/ui/router.provider-test.test.ts src/ui/router.model-config.test.ts`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/ui test src/components/config/ModelConfig.test.tsx`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/server tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/ui tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/server exec eslint src/ui/router/config.controller.ts src/ui/config.ts src/ui/router.provider-test.test.ts`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/ui exec eslint src/api/config.ts src/components/config/ModelConfig.tsx src/components/config/ModelConfig.test.tsx`

## 发布/部署方式

- 本次为前端与 UI API 行为修复；合入后按常规前端/UI 服务发布流程重新构建并发布 `@nextclaw/server` 与 `@nextclaw/ui` 所在产物。
- 若使用 `packages/nextclaw/ui-dist` 的打包产物，需要在正式发布流程中重新执行 UI 构建与产物同步，确保最终分发包包含修复后的 Model 页面逻辑。

## 用户/产品视角的验收步骤

1. 打开设置里的 Model 页面。
2. 修改 Workspace 输入框为一个新的自定义路径，例如 `~/projects/my-nextclaw`。
3. 点击保存，并确认出现保存成功提示。
4. 刷新页面或重新进入 Model 页面。
5. 观察 Workspace 字段仍显示刚才保存的新路径，而不是回退到旧值。
6. 将 Workspace 清空后再次保存。
7. 刷新页面，确认字段恢复为默认 workspace 路径，而不是空字符串。

## 红区触达与减债记录

### packages/nextclaw-server/src/ui/config.ts

- 本次是否减债：否
- 说明：本次只为 `updateModel` 增加 workspace 持久化与空白值规范化，避免在修复用户问题时继续引入隐藏路径异常；未在本迭代内展开 `config.ts` 的大规模拆分。
- 下一步拆分缝：先把 Model/Search/Provider/Runtime 这几类配置写入逻辑拆成独立模块，再把 view builder 与 mutation logic 从 `config.ts` 中分离。
