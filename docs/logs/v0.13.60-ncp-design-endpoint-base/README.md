# v0.13.60-ncp-design-endpoint-base

## 迭代完成说明（改了什么）

- 将外部计划文件 `/Users/peiwang/.claude/plans/wondrous-knitting-cake.md` 的核心实施内容正式迁移到项目 design：
  - `docs/designs/2026-03-11-ncp-universal-endpoint-implementation.plan.md`
- 在迁移版 design 中补充了“通用 Endpoint 抽象基类”设计（`AbstractEndpoint` + `AbstractAgentEndpoint`）：
  - 明确统一 `Endpoint` 接口能力边界（`start/stop/send/subscribe`）
  - 明确 `EndpointManifest`、`EndpointEvent`、统一错误分类与消息 Part 扩展模型
  - 明确 Agent/Profile 与 Platform/Profile 的分层关系与演进路径
- 在实现阶段规划中增加了“非 Agent Endpoint PoC（飞书优先）”建议，确保目标不被收敛成仅 `codex/claude` 接入。

## 测试/验证/验收方式

- 文档结构校验：
  - 确认新 design 文件存在且可读：`docs/designs/2026-03-11-ncp-universal-endpoint-implementation.plan.md`
  - 确认迭代日志路径与命名符合规范：`docs/logs/v0.13.60-ncp-design-endpoint-base/README.md`
- 内容验收点：
  - design 中已包含“迁移计划 + Endpoint 抽象基类 + 协议分层 + 实施阶段 + 验收方式”。
- 不适用项：
  - `build/lint/tsc` 不适用（本次仅 design/log 文档改动，未触达构建、类型或运行时代码链路）。

## 发布/部署方式

- 本次为设计文档与迭代日志更新，无需部署。
- 后续按 design 进入实现时，再按影响范围执行对应发布流程（npm/desktop/docs）。

## 用户/产品视角的验收步骤

1. 打开 `docs/designs/2026-03-11-ncp-universal-endpoint-implementation.plan.md`。
2. 确认文档不再以“接入 codex/claude”作为唯一目标，而是明确“任意通信端点”目标。
3. 确认文档中存在 `Endpoint` 抽象基类设计（接口、生命周期、事件、错误分类）。
4. 确认实施顺序包含从 Agent 重构到 Platform PoC 的通用演进路径。

