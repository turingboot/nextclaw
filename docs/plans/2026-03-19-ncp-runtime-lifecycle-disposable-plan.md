# NCP Runtime Lifecycle Disposable Plan

## 这份文档回答什么

这份文档专门回答一个更聚焦的问题：

怎么把当前插件提供的 NCP runtime，从“靠 reload 间接生效”，演进成“像 VSCode 一样，注册即可撤销，禁用即可清理”的机制。

这次只先覆盖：

- `NCP agent runtime`

但方案本身必须是通用的，后续 tool、provider、channel、command 也应该能沿同一机制接入，而不是为 runtime 单独造一套厚系统。

## 与已有方案的关系

这份文档是下面几份文档的补充：

- [NCP 定位与愿景](../designs/2026-03-17-ncp-positioning-and-vision.md)
- [NCP Parallel Chain Cutover Plan](./2026-03-17-ncp-parallel-chain-cutover-plan.md)
- [NCP Native Runtime Refactor Plan](./2026-03-18-ncp-native-runtime-refactor-plan.md)
- [Codex Plugin Runtime Plan](./2026-03-19-codex-plugin-runtime-plan.md)

它不改变总体方向，只补一个当前已经被真实 bug 验证出来的缺口：

- 我们缺的不是某个 runtime 的特殊热更新逻辑
- 我们缺的是宿主侧统一的“可撤销注册”协议

## 当前问题的根因

现在的问题不只是 `/api/ncp/session-types` 没及时变对。

更本质的根因是：

1. 插件能力注册没有返回 `Disposable`
2. 插件激活没有自己的 registration bucket
3. 插件禁用/卸载时，没有统一的 `dispose` 入口去撤销该插件注册过的副作用

所以当前模式更像：

```text
改配置
  -> 触发 reload
  -> 重建 snapshot
  -> 希望最终状态变对
```

而不是：

```text
插件激活
  -> registerXxx() 返回 Disposable
  -> 收进插件自己的 subscriptions

插件停用
  -> dispose 这批 subscriptions
  -> live registry 立即收敛
```

这就是它为什么不像 VSCode。

## VSCode 真正值得学的点

VSCode 的关键不是“有很多 lifecycle manager”，而是一个很轻、很统一的模型：

1. 注册 API 返回 `Disposable`
2. 每个扩展激活时有一个 `ExtensionContext`
3. `ExtensionContext` 里有 `subscriptions`
4. 扩展把所有注册得到的 `Disposable` 放进 `subscriptions`
5. 扩展停用时，宿主统一 dispose 这批 `subscriptions`

也就是说，VSCode 的核心不是“针对 command 一套、针对 provider 一套、针对 runtime 一套”。

而是：

- 一套统一的 disposable 协议
- 一套统一的 activation scope
- 一套统一的 subscriptions bucket

我们应该学这个，而不是给 runtime 单独造一个专用 lifecycle manager。

## 本次方案调整后的核心判断

这次方案必须收敛成下面这个方向：

- 宿主提供通用 `Disposable`
- 宿主提供通用 `DisposableStore`
- 插件每次激活有自己的 activation scope
- 插件 API 的注册方法都应该逐步变成 `registerXxx(...) => Disposable`

然后本阶段只先让：

- `registerNcpAgentRuntime(...)`

接入这套机制。

这才是轻的、纯的、可通用扩展的做法。

## 本阶段目标

这一阶段只追求一个明确目标：

- 让插件注册的 `NCP runtime` 成为可撤销注册

对应到用户可见行为：

- 安装 `codex` 插件后，`/api/ncp/session-types` 立即出现 `codex`
- 禁用 `codex` 插件后，`/api/ncp/session-types` 立即移除 `codex`
- 卸载 `codex` 插件后，`/api/ncp/session-types` 立即移除 `codex`
- 不依赖服务重启

同时保持这些边界：

- `native` 仍然是内建 runtime
- 不为 `codex` 写特殊逻辑
- 不先重写整个插件系统
- 不要求这次把所有插件能力都接完

## 目标结构

目标结构应该是这样：

```text
Disposable
DisposableStore

PluginActivationScope
  - pluginId
  - subscriptions: DisposableStore

Host Registration APIs
  - registerNcpAgentRuntime(...) => Disposable
  - 后续可扩展为 registerTool/registerProvider/registerChannel...

Live Runtime Registry
  - core registrations
  - plugin registrations

Plugin Loader / Host
  - 激活插件
  - 把该插件注册得到的 Disposable 收进 activation scope
  - 禁用/卸载时 dispose 该 scope

UiNcpAgent
  - 直接读取 live runtime registry
```

重点是：

- `DisposableStore` 是通用积木
- `activation scope` 是通用宿主模型
- runtime 只是第一批接入者

## 设计原则

### 1. 先补通用协议，不补 runtime 专用管理器

我们不应该做一个“plugin runtime lifecycle manager”，因为这会天然把 runtime 做成特例。

更好的做法是：

- 先补宿主统一的 `Disposable` 协议
- 再让 runtime 注册接入它

### 2. 注册 API 必须拥有对称撤销能力

凡是运行时注册，就必须可以撤销。

也就是：

- `register` 和 `dispose` 必须天然成对

后续我们才有机会把同一模式推广到 tool/provider/channel。

### 3. live state 应该来自当前注册状态，而不是靠推导补救

`/api/ncp/session-types` 这类接口，不应该再依赖“先重建某个 snapshot，再从 snapshot 推导当前状态”。

它应该直接读取当前 live runtime registry。

这样当插件 scope 被 dispose 后，结果自然立即正确。

### 4. 内建能力与插件能力明确分层

`native` 这种 core runtime 不应该被插件生命周期误伤。

所以 live runtime registry 至少要区分：

- core registrations
- plugin registrations

但这只是数据来源分层，不是两套不同机制。

二者都应该复用同一个 registry 抽象。

## 实现计划

### Step 1. 引入通用 Disposable / DisposableStore

先补最基础的宿主积木：

- `Disposable`
- `DisposableStore`

要求足够轻，不做复杂框架化设计。

### Step 2. 给插件激活过程增加 activation scope

插件每次被加载/激活时，都拿到一个当前激活作用域。

这个 scope 只做一件事：

- 收集本次插件注册得到的 disposables

这样插件禁用、卸载、重载时，宿主只要 dispose 整个 scope 即可。

### Step 3. 让 `registerNcpAgentRuntime` 返回 Disposable

这一条是本次真正先落地的能力。

也就是：

- runtime 注册进 live registry
- 同时返回可撤销句柄
- 该句柄自动进入当前插件的 activation scope

### Step 4. `createUiNcpAgent` 直接消费 live runtime registry

`createRuntime()` 和 `listSessionTypes()` 都直接从 live runtime registry 读取。

这样一旦插件 scope 被 dispose，session types 就会立即收敛。

### Step 5. 仅把 runtime 链路打通，不扩 scope

本阶段完成标准不是“插件系统全面进化”。

而是：

- 通用 disposable 机制已引入
- runtime 注册已经接进去
- session type 热插拔已经正确

这样就够了。

## 为什么这个方向更通用

因为这里抽象的不是 `runtime manager`，而是：

- 可撤销注册
- 插件激活作用域

这两个概念天然通用。

未来如果要接：

- `registerTool`
- `registerProvider`
- `registerChannel`
- `registerHttpRoute`

理论上都应该走同一模型，而不是再各自发明生命周期。

所以这次不是在破坏 NCP 的纯粹性，恰恰是在把宿主层补成更纯粹、更统一。

## 这次明确不做什么

这次不做：

- 不引入 runtime 专用 lifecycle manager
- 不做 `pluginId -> runtime disposables[]` 这种特化设计为最终模型
- 不把 tool/channel/provider 一次性全部改完
- 不重写整个 openclaw plugin loader
- 不做任何 codex 特例

## 验收标准

必须满足：

1. `native` 默认存在且稳定
2. 安装 runtime 插件后，`/api/ncp/session-types` 立即出现对应类型
3. 禁用 runtime 插件后，`/api/ncp/session-types` 立即移除对应类型
4. 卸载 runtime 插件后，`/api/ncp/session-types` 立即移除对应类型
5. 重新启用后，类型可以立即恢复
6. 全过程不依赖服务重启

如果这几条成立，就说明我们已经把“插件 runtime 热插拔”从 snapshot/reload 思维，推进到了更接近 VSCode 的 disposable/subscriptions 思维。
