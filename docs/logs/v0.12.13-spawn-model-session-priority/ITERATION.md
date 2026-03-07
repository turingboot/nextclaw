# v0.12.13-spawn-model-session-priority

## 迭代完成说明（改了什么）
- `spawn` 工具新增可选参数 `model`，支持为单次子代理任务显式指定模型。
- 新增独立模型优先级解析函数 `resolveSubagentModel`，用于统一子代理模型决策。
- 子代理模型优先级落地为：
  1. `spawn.model`
  2. 当前会话模型（由 `AgentLoop` 运行时解析得到的 `runtimeModel`）
  3. 运行时默认模型（`options.model`）
  4. Provider 默认模型（最终兜底）
- `SpawnTool` 新增会话模型上下文传递，`AgentLoop` 在执行 `spawn` 前注入当前 `runtimeModel`。
- `SubagentManager` 在 `spawn` 时解析并固化该次任务使用模型，子代理运行时按任务模型调用，不再固定使用全局默认。
- 新增测试：
  - `src/agent/subagent-model.test.ts`
  - `src/agent/tools/spawn.test.ts`

## 测试/验证/验收方式
- 单测（新增能力覆盖）：
  - `pnpm -C packages/nextclaw-core exec vitest run src/agent/tools/spawn.test.ts src/agent/subagent-model.test.ts`
- 项目级验证：
  - `pnpm build`
  - `pnpm lint`
  - `pnpm tsc`
- 结果：全部通过（lint 仅有仓库既有 warning，无新增 error）。

## 发布/部署方式
- 本次为 core 运行时行为变更，按常规发版流程执行：
  1. 完成代码合并。
  2. 执行 `pnpm build && pnpm lint && pnpm tsc`。
  3. 按项目发布流程进行 version/publish（如需对外发布）。
- 本次不涉及数据库/后端 migration。

## 用户/产品视角的验收步骤
1. 启动 nextclaw 服务并进入可触发 agent 工具调用的会话。
2. 在当前会话先设置/确认会话模型（例如 UI 传入 `model` 或会话元数据已有 `preferred_model`）。
3. 让主代理执行 `spawn`，并显式传入 `model`（例如 `anthropic/claude-sonnet-4-5`）。
4. 观察子代理运行：应优先使用 `spawn.model`。
5. 再执行一次 `spawn`，不传 `model`。
6. 观察子代理运行：应回退使用当前会话模型。
7. 若会话模型为空（极端场景），应继续回退到运行时默认模型/Provider 默认模型，不应因模型缺失导致崩溃。
