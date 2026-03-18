# NCP Native Runtime Refactor Plan

## 这份文档回答什么

这份文档专门回答一个问题：

如何把当前可工作的 bridge runtime，演进成 fully NCP-native runtime。

这里的终局约束非常明确：

- 当选择 `ncp` 链路时，除了存储层之外，更上的所有层都必须基于 NCP 体系实现
- NCP 不只是协议壳和传输壳，而要真正承载 runtime、capability assembly、extension mechanism 与 event model
- 如果现有默认 runtime 能力还不够，就应该补 NCP 的扩展点或新增 NCP 内部组件，而不是长期桥接 legacy runtime

## 与已有方案的关系

这份文档不是替代之前的方案，而是对之前方案的聚焦收束。

- [NCP 定位与愿景](../designs/2026-03-17-ncp-positioning-and-vision.md)
  - 回答我们为什么要做 NCP，以及为什么必须面向通用 building blocks
- [NCP Parallel Chain Cutover Plan](./2026-03-17-ncp-parallel-chain-cutover-plan.md)
  - 回答为什么要保留存储层不变，同时并行建设一条明确分离的新前后端链路
- [NCP Phase 2.5：Nextclaw Capability Assembly Plan](./2026-03-18-ncp-phase2-5-nextclaw-capability-assembly-plan.md)
  - 回答如何先通过 bridge runtime 快速把真实 Nextclaw 能力挂进 NCP 通道，优先打通链路
- 本文
  - 回答 bridge runtime 不是终局之后，下一步怎样演进到 fully NCP-native runtime

换句话说：

- phase 2.5 解决的是“先跑通”
- 第一版 native cutover 解决的是“先把 bridge 拿掉”
- 本文解决的是“怎么从第一版 native cutover，走到结构正确且能力完整”

## 当前状态判定

当前默认 `ncp` 链路已经完成了第一版 native runtime cutover，不再是 bare LLM chain，也不再是 bridge runtime 主执行路径。

当前形态更准确地说，是 first-cut NCP-native runtime：

- 前端链路是 NCP
- 前后端传输协议是 NCP
- session API / stream provider / backend shell 是 NCP
- session store 适配仍保持 legacy storage consistency
- agent 执行核心已经进入 `DefaultNcpAgentRuntime`
- Nextclaw 的 context / tool / metadata 装配，已经通过消费方 NCP 组件接入

当前主链路大致是：

```text
NCP UI
  -> NCP agent endpoint
  -> DefaultNcpAgentBackend
  -> DefaultNcpAgentRuntime
  -> NextclawNcpContextBuilder
  -> NextclawNcpToolRegistry
  -> ProviderManagerNcpLLMApi
  -> NextclawAgentSessionStore
  -> existing storage
```

这意味着我们已经跨过了最关键的一步：

- `NextclawUiNcpRuntime -> runtimePool.processDirect()` 不再是主执行路径
- bridge runtime 已经可以退出主链路
- 当前剩下的重点不再是“要不要 native runtime”，而是“怎样把 capability parity 做完整，并把消费方装配边界继续打磨正确”

## 终局目标

终局目标是：

当选择 `ncp` 链路时，除了存储层之外，更上的所有层都基于 NCP 体系。

也就是：

- UI 链路是 NCP
- transport / backend / session API 是 NCP
- runtime orchestration 是 NCP
- context building 是 NCP
- tool registry 与 capability assembly 是 NCP
- policy hooks / extension mechanism 是 NCP
- event model / stream semantics 是 NCP
- 唯一保留 legacy 一致性的边界，是底层存储适配层

目标态应更接近：

```text
NCP UI
  -> NCP agent endpoint
  -> DefaultNcpAgentBackend
  -> DefaultNcpAgentRuntime
  -> NextclawNcpCapabilityAssembler
  -> NCP-native tools / context / policies / extensions
  -> LLM API / gateways / services
  -> NextclawAgentSessionStore
  -> existing storage
```

这里最关键的判断是：

- `NextclawAgentSessionStore` 可以继续存在，因为它是“存储一致性边界”
- `NextclawUiNcpRuntime -> runtimePool.processDirect()` 不能长期存在，因为它意味着运行时核心还不属于 NCP

## 核心功能不变的口径

这次重构的重点不是追求每一个细枝末节都 100% 字节级一致，而是必须保证 Nextclaw 的核心功能能力不变。

也就是说，用户角度真正重要的契约必须保持：

- 仍然是同一个 Nextclaw agent，而不是退化成一个“只有聊天框的 NCP demo”
- 仍然具备 Nextclaw 原本的产品能力，而不是只剩基础 text generation
- 仍然沿用 Nextclaw 的核心上下文构造方式，而不是换成另一套完全不同的 prompt/runtime 语义

这里要明确，所谓“核心功能不变”，至少包括下面这些能力不能漏：

### 1. Context / Prompt Assembly 不变

必须保留 Nextclaw 原本真正重要的上下文装配能力，包括：

- system prompt 组装
- session context 注入
- memory / history 进入模型上下文的方式
- 产品级 metadata 注入
- model / thinking / session type 等运行参数映射

也就是说，未来不是“随便做一个 NCP context builder”，而是要把 Nextclaw 当前有效的 context/prompt 设计迁移为 NCP-native context builder。

### 2. Skill / Tool / Capability 不变

`skill` 这一层必须明确纳入 native runtime 计划，不能遗漏。

至少要覆盖：

- tools 的注册与调用
- skills 的请求、装配与执行
- Nextclaw 原有 capability modules 的运行时接入
- tool policy / tool visibility / tool execution lifecycle

如果未来切到 NCP-native runtime 后，skills 不能像现在这样成为真实能力的一部分，那就说明这次迁移没有完成。

### 3. Runtime Policy 不变

Nextclaw 原本在 runtime 里承担的一些关键策略，不能在重构时意外丢失。

包括但不限于：

- 模型选择策略
- thinking 策略
- tool 调用策略
- loop guard / reply shaping
- 产品级安全与行为约束

这些都应该迁移成 NCP-native policy hooks，而不是在切换 runtime 时被悄悄简化掉。

### 4. Extension Mechanism 不变且更清晰

Nextclaw 的很多内部能力并不一定都该硬编码在 runtime 里，其中一部分本来就应该通过 extension mechanism 进入。

所以终局不是“把所有东西写死进一个新的 runtime”，而是：

- 保留 Nextclaw 可以注入内部组件的能力
- 把注入机制收敛到 NCP-native extension points
- 让未来新增能力时，不需要回到 bridge runtime 补洞

### 5. Session / Memory / Product Semantics 不变

这次不只是“消息能发出去”就算成功。

真正需要保持的是：

- session 语义不变
- memory 生效方式不变
- 历史会话连续性不变
- 产品级 agent 行为语义不变

因此，存储层虽可保持不迁移，但它上层的 session semantics 仍要由 NCP-native runtime 正确承接。

## 正式开始前的准备判断

这里需要先回答一个更实际的问题：

在正式从 bridge runtime 演进到 fully NCP-native runtime 之前，NCP 体系本身是否还需要先补准备项？

我的判断是：

- 不需要先做一轮大而全的 NCP 重构
- 也不需要先新增一批积木再开始
- 现在的 NCP 已经足够作为 native runtime refactor 的直接起点
- 第一阶段应优先直接基于现有积木实现，再根据真实卡点决定是否沉淀新积木

也就是说，结论不是“现在完全不够”，也不是“现在已经万事俱备”，而是：

NCP 当前基础已经能承接这次重构，而且应该先直接做；只有当实现过程中出现明确阻塞，再把被验证为通用的问题回沉为新的 NCP building blocks。

### 现在已经足够的部分

当前 NCP 体系已经具备以下基础，所以不需要推倒重来：

- 已有清晰的 `NcpAgentRuntime` 抽象
- 已有 `DefaultNcpAgentBackend` 承接 session lifecycle / streaming / abort
- 已有 conversation state manager 能承接前后端事件流
- 已有 `DefaultNcpContextBuilder` 和 `DefaultNcpToolRegistry` 这类基础 runtime 积木
- 已有标准 event model，可让前端保持共享展示层不变

因此，我们不需要先暂停所有工作去重写 NCP 基座。

### 当前体系下可以直接实现什么

在不新增任何 NCP 新积木的前提下，第一版仍然可以直接基于现有体系实现：

- 直接使用 `DefaultNcpAgentRuntime` 作为通用 engine
- 在消费方实现 `NextclawNcpContextBuilder`
- 在消费方实现 `NextclawNcpToolRegistry`
- 复用现有 `llmApi` 接口接入 Nextclaw 的模型与 provider 能力
- 继续通过 `NextclawAgentSessionStore` 保持存储层一致
- 在 `createUiNcpAgent` 中直接装配这套 runtime，而不是继续桥接 `runtimePool.processDirect()`

这条路径的意义是：

- 先验证 `DefaultNcpAgentRuntime` 这套通用 engine 是否足以承接 Nextclaw
- 先把 bridge runtime 从主链路里拿掉
- 先在真实实现里看清楚哪些地方只是 Nextclaw 的消费方装配，哪些地方才是真正缺失的通用抽象

### 当前实现后重点观察的风险点

下面这些点并不构成“开始前必须先补”的阻塞，但它们是实现第一版时要重点观察的抽象边界。

#### 1. Tool contract 是否足够优雅

当前 `NcpTool` 只接受 `args`：

- 见 [tool.ts](/Users/peiwang/Projects/nextbot/packages/ncp-packages/nextclaw-ncp/src/agent-runtime/tool.ts#L7)

这意味着第一版实现时，如果发现大量 Nextclaw 工具都在绕路获取 session / metadata / services / abort signal，那就说明这里后续值得沉淀更强的通用 tool contract。

#### 2. Context builder 是否开始膨胀成黑盒

当前 `NcpContextBuilder` 接口很薄，只是 `prepare(input, options)`：

- 见 [context-builder.ts](/Users/peiwang/Projects/nextbot/packages/ncp-packages/nextclaw-ncp/src/agent-runtime/context-builder.ts#L5)

这本身不阻止第一版实现，但如果 `NextclawNcpContextBuilder` 很快膨胀成一个巨大的 prompt/memory/skill 黑盒，就说明后续值得把其中稳定的模式回沉为更通用的模块接口。

#### 3. Policy / lifecycle 是否只能靠隐式约定

当前 `DefaultNcpAgentRuntime` 已经有通用 loop，但缺少正式的 hooks / lifecycle 装配点：

- 见 [runtime.ts](/Users/peiwang/Projects/nextbot/packages/ncp-packages/nextclaw-ncp-agent-runtime/src/runtime.ts#L20)

如果第一版里 model / thinking / tool policy 只能通过 `metadata + builder 内部约定` 勉强表达，那就说明这里后续值得沉淀更通用的 lifecycle 契约。

#### 4. Skill 是否只是 metadata 别名

当前默认 context builder 中，`requested_skills` 仍只是被并入 tool 过滤：

- 见 [context-builder.ts](/Users/peiwang/Projects/nextbot/packages/ncp-packages/nextclaw-ncp-agent-runtime/src/context-builder.ts#L35)

第一版可以先这样实现，但如果后面发现 skill 在 Nextclaw 里承载的是更强的能力装配语义，那就说明这里后续值得沉淀更明确的通用能力接口。

#### 5. 先建立 capability parity checklist

在代码重构前，必须先列出一份明确的 parity checklist，至少覆盖：

- prompt / context
- skill / tool
- session / memory
- model / thinking
- policy / safety
- extension / internal components

原因很简单：

这次不是“从零做一个新 runtime”，而是“替换一个已经在线、有真实产品语义的 runtime”。

没有 parity checklist，后面非常容易出现“架构看起来更干净，但核心能力悄悄掉了”的问题。

## 开始策略判断

因此，正式开始时的推荐策略是：

1. 不暂停现有方案，不推倒重做 NCP 基座
2. 第一阶段直接基于 `DefaultNcpAgentRuntime` 实现 Nextclaw NCP-native runtime
3. 先用真实实现替换 bridge runtime
4. 再按 capability parity list 复盘哪些模式值得沉淀为新的 NCP building blocks

不建议的两种做法是：

- 先假设 `DefaultNcpAgentRuntime` 不够用，直接另起一套专用 runtime engine
- 先花很长时间抽象一个大而全的 NCP 2.0，再开始迁移

最佳路径是：

- 先基于现有 `DefaultNcpAgentRuntime`、`contextBuilder`、`toolRegistry`、`llmApi` 直接实现第一版
- 让 bridge runtime 尽快退出主执行链路
- 在真实实现中记录抽象痛点
- 等 native runtime 稳定后，再把已被证明通用的模式沉淀回 NCP

## NCP 纯积木原则

这里需要再补一条明确原则，避免后续实现时走偏：

NCP 只提供 building blocks，不提供官方组合好的 runtime 方案。

这意味着：

- NCP 提供通用 contract
- NCP 提供可独立使用的 runtime / context / tool / policy / extension 积木
- NCP 提供这些积木之间的连接契约
- 但 NCP 不提供预组合好的 preset / profile / 套餐式 runtime

换句话说，NCP 要保持纯粹性：

- 不在通用层内置 “官方推荐组合”
- 不在通用层内置 “更开箱即用的产品装配”
- 不把消费方的装配动作反向沉淀成 NCP 的默认实现

如果未来某个消费方需要把多个积木组装成完整 runtime，那是消费方自己的责任，而不是 NCP core 的职责。

因此，后续若我们补 NCP 的能力，补的也应该是：

- 更强的模块接口
- 更清晰的生命周期接口
- 更自然的组合契约

而不是：

- 官方 preset
- 官方 profile
- 官方预装配 runtime

这条原则并不会削弱 NCP，反而能保证 NCP 一直保持通用、解耦、干净。

## 我们要构建的不是另一层桥，而是 NCP-native 运行时装配层

接下来真正要做的，不是再包一层 bridge，也不是先发明大量新积木，而是先把 Nextclaw 的产品能力装进现有 NCP runtime 积木，并在过程中识别真正值得沉淀的通用 building blocks。

核心上需要形成这样几类积木：

### 1. Nextclaw 消费方装配层

它负责按产品配置装配运行时能力，而不是把装配写死在某个 legacy runtime 里。

它应该回答：

- 本次 run 需要哪些工具能力
- 本次 run 需要哪些上下文能力
- 本次 run 需要哪些产品级策略
- 本次 run 需要哪些 extension / hook

第一阶段建议形态：

- `NextclawNcpCapabilityAssembler`

这里要特别说明：

- 如果存在 `NextclawNcpCapabilityAssembler`，它也应属于 Nextclaw 消费方装配层
- 它不是 NCP core 的官方组合层
- NCP 只需要提供让它可以被实现的通用接口和积木

### 2. Nextclaw NCP tool registry

工具能力不应再通过 legacy runtime 的私有装配路径进入，而应进入 NCP runtime 可理解、可扩展、可替换的 tool registry。

建议形态：

- `NextclawNcpToolRegistry`

### 3. Nextclaw NCP context builder

system prompt、session context、memory、product metadata、运行环境信息，都应通过 NCP-native context building 进入 runtime，而不是依赖 `processDirect()` 内部黑盒拼接。

建议形态：

- `NextclawNcpContextBuilder`

### 4. Nextclaw 侧 policy 承载

像模型选择、thinking 策略、tool policy、subagent policy、loop guard、reply shaping 这类策略，应成为 runtime 可插拔 hooks，而不是 legacy runtime 内部隐式逻辑。

第一阶段不要求 NCP 先新增官方 hooks 积木。

更现实的做法是：

- 先在 Nextclaw 消费方实现 policy 决策与装配
- 只在真实实现证明某些 lifecycle 需求稳定存在时，再把它们沉淀为 NCP 通用 hooks

### 5. Nextclaw extension 接入

用户的预期是对的：

默认 runtime 必须可扩展，也必须能注入自定义内部组件。但第一阶段不要求先把 extension mechanism 做成一整套新积木；应先在消费方完成接入，再决定哪些通用点值得回沉。

这意味着：

- extension 的注册点属于 NCP runtime
- extension 的生命周期属于 NCP runtime
- extension 触发的上下文、工具、事件、策略也应属于 NCP runtime

## 演进路线

### Stage A：Bridge Runtime 退出主链路

这一阶段的目标已经基本完成。

这一阶段的要点是：

- bridge runtime 只作为历史过渡方案保留参考，不再承担主执行路径
- 禁止继续把新能力堆进 `NextclawUiNcpRuntime`
- 后续所有 runtime 能力都优先进入当前的 NCP-native 装配链路

当前完成标志：

- 主链路已经切到 `DefaultNcpAgentRuntime`
- `NextclawUiNcpRuntime` 已退出主执行路径并准备删除

### Stage B：能力拆解为 NCP-native modules

这一阶段要把当前依赖 legacy runtime 的关键能力逐块拆出来，但不是复制 legacy 代码，而是先在基于 `DefaultNcpAgentRuntime` 的实现里完成装配，再评估哪些能力边界值得沉淀为 NCP 通用模块。

优先拆解的能力顺序：

- tool registry
- context builder
- policy hooks
- extension mechanism
- capability assembler
- skill assembly
- prompt / context modules

这里的原则是：

- 先抽运行时装配边界
- 再迁移具体能力
- 不要把 legacy runtime 原封不动搬进 NCP

完成标准：

- `createUiNcpAgent` 所需的大部分能力都能由 NCP-native modules 提供
- legacy runtime 逐渐只剩参考实现，而不再是执行依赖

### Stage C：替换执行核心

这一阶段是关键切换点：

`createUiNcpAgent` 不再依赖 `runtimePool.processDirect()`，而是直接装配 NCP-native runtime。

到这一步时，新的运行时应该能够：

- 基于 `DefaultNcpAgentRuntime + NextclawNcpContextBuilder` 生成上下文
- 基于 `NextclawNcpToolRegistry` 执行工具调用
- 在消费方装配策略与能力
- 注入 Nextclaw 所需产品能力
- 直接输出 NCP-native event stream

完成标准：

- `NextclawUiNcpRuntime` 不再是主链路依赖
- 主执行路径进入 `DefaultNcpAgentRuntime + Nextclaw` 消费方装配链路

### Stage D：默认切换、充分验证、删除 bridge

这一阶段做两件事：

- 重新完成默认链路验证
- 在验证充分后删除 bridge runtime

验证重点不是“能回复”，而是“能力是否等价且结构是否正确”。

需要验证：

- 会话读写仍与现有存储层一致
- 工具调用、reasoning、停止、删除会话、切换会话都正常
- skills 能正常请求、装配和执行
- system prompt / context / memory / session metadata 的核心语义保持一致
- model / thinking / policy 行为与当前产品预期一致
- 产品需要的 Nextclaw 内部能力都能通过 NCP-native 机制进入 runtime
- 新增能力时，不需要回到 legacy runtime 补桥

完成标准：

- 默认 `ncp` 链路稳定
- bridge runtime 删除
- `legacy` 链路进入下线准备，而不是继续并行生长

## 设计约束

这次 refactor 必须同时满足下面几条约束。

### 1. 只保留一个 legacy 边界

这个边界就是存储层。

除了存储层外，不再允许出现“外面是 NCP，里面偷偷回到 legacy runtime”的执行路径。

### 2. 不做 Nextclaw 私有黑盒 runtime

如果某项能力具有通用 runtime 价值，就应该作为 NCP 的扩展点或内部组件存在。

不能把它继续包在一个 Nextclaw 私有黑盒里，再从外面用桥接方式消费。

### 3. 允许产品层装配，但不允许产品层重写通用 engine

Nextclaw 可以在消费方完成自己的 capability composition，但 runtime 核心执行模型、extension mechanism、event semantics 必须属于 NCP。

更具体地说：

- 允许消费方使用 NCP 积木组装自己的 runtime
- 第一阶段优先直接复用 `DefaultNcpAgentRuntime`
- 不允许 NCP core 为某个产品内置组合方案
- 不允许产品装配层反向污染 NCP 默认实现

### 4. 前端共享展示层保持稳定

这次文档聚焦 runtime refactor，但它和前端方案并不冲突。

前端仍应保持：

- 共享纯展示层继续复用
- 前端编排层可以新旧分离
- 当 runtime native 化后，前端只切换编排与数据链路，不重写展示层

### 5. 核心能力优先于次要细节

验收时优先盯住核心功能契约，而不是被一些次要细节绑架。

优先级应当是：

- 第一优先级：核心能力是否完整
- 第二优先级：产品语义是否一致
- 第三优先级：交互体验是否稳定
- 最后才是次要表现差异

也就是说，只要 `skill`、context/prompt、session/memory、tool/policy 这些核心能力没有漏，少量非关键细节不应阻碍 native runtime 的推进。

## 最终验收口径

只有同时满足以下条件，才能算 fully NCP-native runtime 成立：

1. `ncp` 链路的执行核心不再依赖 `runtimePool.processDirect()`
2. 除存储层外，运行时上层全部由 NCP 体系承载
3. tool、skill、context、prompt、policy、extension 的装配入口全部是 NCP-native 的
4. 默认 runtime 可以扩展，也可以注入 Nextclaw 的内部组件
5. Nextclaw 当前关键产品能力在 NCP-native runtime 中没有被降级或遗漏
6. 新能力上线时，团队不需要再往 bridge runtime 继续补逻辑

## 结论

phase 2.5 的 bridge runtime 是一次必要过渡，但终局非常明确：

我们不是要“让 NCP 能调用 Nextclaw runtime”，而是要“让 Nextclaw 在选择 NCP 链路时，真正运行在 NCP runtime 之上”。

所以接下来的重点，不再是继续修 bridge，而是把 Nextclaw 的核心运行时能力重组为 NCP-native building blocks，并让存储层成为唯一保留的一致性边界。
