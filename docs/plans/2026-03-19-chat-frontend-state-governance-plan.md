# Chat Frontend State Governance Plan

## 这份文档回答什么

这份文档专门回答一个问题：

为什么 chat 前端最近容易出现状态错乱类 bug，以及接下来应该怎样系统治理。

这里的范围不是 NCP runtime 本身，而是 chat 前端这一层的状态组织方式，尤其是：

- 会话级偏好状态
- 流式运行状态
- 页面 hydrate / query refetch / 用户显式操作三者之间的优先级

## 与已有方案的关系

这份文档是对已有 NCP 方案的前端补充，不替代之前的运行时与链路方案。

- [NCP Parallel Chain Cutover Plan](./2026-03-17-ncp-parallel-chain-cutover-plan.md)
  - 回答为什么要并行建设新链路，并在前端做最终切换
- [NCP Native Runtime Refactor Plan](./2026-03-18-ncp-native-runtime-refactor-plan.md)
  - 回答 NCP 链路在 runtime 侧如何走向 fully NCP-native
- 本文
  - 回答 chat 前端为了支撑这条链路长期替代 legacy，需要怎样治理状态边界

换句话说：

- runtime 方案解决“后端怎么变清晰”
- 本文解决“前端怎么不继续因为状态耦合而反复出错”

## 当前问题判断

最近几次 chat 前端 bug，表面上看是不同问题，实际根因高度相似：

- 用户显式选择的状态被自动 hydrate 覆盖
- query refetch 回来的旧数据把当前内存状态抢回去
- draft 会话 materialize 为真实 session 后，页面误判为“切会话”，触发错误回填
- 同一个事实被多个 effect、多个页面层、多个 manager 同时维护

这说明现在的主要问题不是“缺一个 if”或“少一个兜底”，而是：

chat 前端已经出现了状态事实源不够单一、优先级边界不够明确、effect 驱动联动过多的问题。

如果不治理，后面继续加 runtime、session type、model、thinking、skill、tool stream 这些能力时，复杂度还会继续上升。

## 核心判断

我的判断是：

- 当前 chat 前端不是不能继续演进
- 但确实已经开始欠“状态治理”的债
- 这类 bug 不应该继续靠局部止血去压
- 接下来必须把“谁负责最终值决策”收敛清楚

这里最关键的一点是：

不是状态多本身有问题，而是同一个状态被多层同时决策才有问题。

例如 `selectedModel`：

- session summary 可以提供候选值
- recent same-runtime session 可以提供 fallback 候选值
- global default 可以提供最后兜底值
- 但最终值只能由一个地方决定

一旦页面层、data hook、manager、effect 都能改它，就很容易出现竞态和回滚。

## 治理目标

治理目标很明确：

1. 同一事实只保留一个最终决策入口。
2. 用户显式操作的优先级高于自动 hydrate。
3. 页面层不再承担二次业务决策，只负责展示与装配。
4. query / history / session summary 只提供候选输入，不直接覆盖当前前端真值。
5. 新旧 chat 链路在展示层保持一致，但编排层状态边界更清晰。

## 治理原则

### 1. Single Decision Point

每个关键状态都必须只有一个“最终值决策点”。

例如：

- `selectedModel`
- `selectedThinkingLevel`
- `selectedSessionType`
- `isSending / isAwaitingAssistantOutput`

这些状态都不应该由页面层再做第二次 hydrate。

允许多处提供候选值，但只允许一个地方负责最终决策。

### 2. User Intent Wins

用户显式做出的操作，优先级必须高于自动同步。

例如：

- 用户手动选了模型
- 用户手动选了 thinking
- 用户手动选了 session type

在同一会话上下文内，这些值不应该被 refetch、hydrate、fallback 自动抢回。

只有在下面这些场景里，自动同步才应该重新接管：

- 明确切换到另一个会话
- 当前值已经失效
- 当前值为空且需要初始化

### 3. Hydration Is Initialization, Not Ongoing Override

hydrate 的职责应该是初始化，而不是持续覆盖。

也就是说：

- hydrate 负责“补齐”
- 不负责“反复重算并写回”

这条原则很重要，因为现在很多 bug 的根因正是 hydrate 被做成了持续 override。

### 4. Page Layer Stays Thin

页面层不应该再承担偏好状态的二次业务逻辑。

页面层应该只做：

- query 装配
- presenter/store 同步
- 纯展示所需的派发

而不应该在页面 effect 里再写一层“如果 session changed 就改 selectedModel”这类业务逻辑。

### 5. Server State And UI State Must Be Explicitly Separated

必须明确区分三类状态：

- server state
  - session summary
  - history
  - live stream state from backend
- session preference state
  - selected model
  - selected thinking
  - selected session type
- transient UI state
  - composer draft
  - popover open state
  - hover / loading / local temporary flags

这三类状态可以互相影响，但不能混成一个隐式联动网络。

## 推荐治理结构

接下来推荐把 chat 前端状态按下面这个结构治理：

### 1. 会话偏好状态单独治理

把会话偏好类状态当作独立的一组状态来对待：

- `selectedModel`
- `selectedThinkingLevel`
- `selectedSessionType`

这组状态的共同特点是：

- 既受当前会话影响
- 又受用户显式操作影响
- 又可能有 default / fallback / persisted preference

所以它们应该走同一套决策模型，而不是每个字段各自长一堆 effect。

### 2. 统一“候选值 -> 最终值”决策函数

对于每个会话偏好状态，都应统一遵循：

```text
current explicit value
  -> current session persisted preference
  -> recent same-runtime preference
  -> global default
  -> first valid option
```

但要注意：

- 这个顺序只在“允许自动决策”的场景下生效
- 如果用户刚刚显式做了选择，就不应被后面的候选值抢回

### 3. 会话切换与会话 materialize 要区分

这是这次 bug 暴露出的一个关键点。

前端必须明确区分：

- 真的切到了另一个已有会话
- draft 会话刚刚 materialize 为真实 sessionKey

这两者不能按同一套“session changed”处理。

因为前者通常应该重新 hydrate，
后者通常应该保留当前用户刚做出的选择。

### 4. 流式状态与偏好状态解耦

`isSending`、`isRunning`、`activeRunId`、message streaming 这些运行状态，应该与模型/偏好状态解耦。

发送过程可以影响“是否允许选择”，
但不应该反过来成为偏好状态重算的触发器。

## 推进阶段

### Phase 1：收敛重复决策

先把明显重复的状态决策入口收掉。

重点是：

- 删除页面层重复 hydrate
- 只保留一个偏好同步入口
- 修正 draft materialize 与 real session switch 的边界

这一步的目标不是重构全部，而是先阻止同类 bug 继续发生。

### Phase 2：抽出会话偏好治理层

在前端编排层里，把 session preference 的决策抽成明确的治理层。

这里不一定要新建很重的模块，但至少要做到：

- 决策集中
- 规则可测试
- 页面层不再复制逻辑

### Phase 3：把关键规则测试化

后面必须把这类规则补成稳定测试，尤其是：

- 切会话
- draft materialize
- refetch 返回旧 summary
- 当前模型失效
- 同 runtime fallback 生效

这些都应该成为固定回归测试样例，而不是靠手测记忆。

## 非目标

这份方案不追求：

- 把 chat 前端一次性重写成另一套架构
- 把所有 store/manager 全部推倒
- 为了“绝对纯粹”牺牲当前交付节奏

目标是：

以最小但结构正确的方式，把 chat 前端从“多点决策”收敛到“单点决策”。

## 验收标准

当下面这些结果成立时，说明 chat 前端状态治理开始走上正轨：

1. 用户显式选择的 model/thinking/session type 不会被同会话内的自动 hydrate 抢回。
2. draft 会话转为真实会话时，不会误判为普通切会话。
3. 页面层不再存在重复的偏好回填逻辑。
4. 会话偏好规则能通过独立测试稳定验证。
5. 后续新增 runtime type、session type、skill 选择能力时，不需要继续复制一套新的状态决策逻辑。
