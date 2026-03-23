# NextClaw Remote App Transport Multiplex Design

日期：2026-03-23

## 1. 背景

当前 NextClaw remote access 已完成两件关键工作：

- 保留 Cloudflare Durable Objects 作为按 `instanceId` 寻址的 relay 中枢。
- 通过 WebSocket Hibernation、去掉高频 heartbeat、节流 session touch，解决了 DO duration 与 D1 高频写入的结构性成本问题。

但线上与本地测试暴露出新的主矛盾：

- 远程页面的动态请求仍然过多，Cloudflare Worker request 免费额度会很快被打满。
- 远程侧浏览器 WebSocket 目前仍未开放，远程页面会退化为大量 HTTP 请求、SSE 请求、健康探测与 query refetch。
- 前端当前同时存在 `fetch`、SSE、`/ws`、React Query 轮询与 invalidate-driven refetch，多条链路在 remote 场景下会共同放大 Worker request 数量。

因此，下一阶段的主问题不再是“如何继续压 DO duration”，而是：

**如何把 remote access 的高频动态通信统一收口，避免一个用户动作对应多个 Worker request。**

## 2. 核心结论

本次设计的立场应当明确收敛为：

1. 一次性定义一个长期稳定的应用传输抽象层 `AppTransport`。
2. 在 `AppTransport` 之上再提供一个前端统一通信收口 `appClient`，让业务层真正依赖的是 `appClient`，而不是直接依赖 transport。
3. 将现有本地链路与新的 remote multiplex 链路都收敛为 `AppTransport` 之下的 adaptor。
4. 让绝大多数页面、hooks、presenter、store、manager 都看不到 `AppTransport` 的存在。
5. 未来即使接入 WebRTC / P2P，也应继续接在 `AppTransport` 之下，而不是重新影响业务层。

一句话概括：

**我们要一次性做对“协议无关的应用通信抽象”这一层，并通过 `appClient` 将它稳定地封装起来，让上层业务以后像使用 `apiClient` 一样，不再关心底层 transport。**

## 3. 为什么不是“把所有接口直接改成 WebSocket”

直接让前端各处改成“自己发 WebSocket frame”不是最优方案，原因有三点：

### 3.1 会把协议细节污染整个前端

如果页面、hooks、manager 直接理解 `frame`、`streamId`、`cancel`、`attachment` 等概念，remote transport 的实现细节会扩散到业务层，未来难以维护。

### 3.2 会绑死在 WebSocket 上

当前 remote multiplex 最合适的实现是 WebSocket，但它只是当前阶段最合适的 adaptor，不应成为前端公共抽象本身。未来如需接入 WebRTC DataChannel、WebTransport 或其它 transport，不应要求页面逻辑重写。

### 3.3 会让本地与远程模式分叉

本地 UI 目前已经稳定使用：

- HTTP request
- SSE stream
- `/ws` 实时事件

最优做法不是用 remote 协议重写本地模式，而是把本地现有能力也纳入同一抽象边界之下。

## 4. 设计目标

### 4.1 目标

- 大幅降低 remote access 的高频动态 Worker request。
- 让 remote 场景下的状态同步、聊天流、run stream 收敛到单条长连接。
- 一次性定义长期稳定的 `AppTransport` 边界。
- 建立一个类似 `apiClient` 的前端统一收口 `appClient`。
- 保持 UI 组件、业务组件、store、presenter、manager 几乎不感知 transport 协议细节。
- 保持本地模式与远程模式共享同一套前端业务逻辑。
- 为未来接入 WebRTC / P2P 保留稳定边界。

### 4.2 非目标

- 不在本阶段重写所有 REST API。
- 不在本阶段处理静态资源脱离 Worker 的问题。
- 不在本阶段把所有 NCP transport 一并迁移到 multiplex。
- 不在本阶段把 remote access 变成“纯 WebSocket-only 应用”。
- 不在本阶段把 query cache、一致性策略、重试策略等全部硬塞进 `AppTransport` 定义。

## 5. 核心架构

### 5.1 应用传输抽象层

前端统一只依赖一个协议无关的应用级 transport 接口：

```ts
type AppTransport = {
  request<T>(input: RequestInput): Promise<T>;
  openStream<TEvent = unknown, TFinal = unknown>(
    input: StreamInput<TEvent, TFinal>
  ): StreamSession<TFinal>;
  subscribe(handler: (event: AppEvent) => void): () => void;
};

type StreamSession<TFinal> = {
  finished: Promise<TFinal>;
  cancel(): void;
};
```

这个接口表达的是应用级能力：

- `request`
- `stream`
- `event`

而不是底层协议：

- HTTP
- SSE
- WebSocket
- WebSocket frame
- WebRTC DataChannel frame

这层就是本次设计真正要“一次性做对”的层。只要这层边界定义正确：

- 页面
- hooks
- manager
- store
- presenter

都应长期稳定，不再关心底层到底是哪种 transport。

### 5.2 前端统一通信收口 `appClient`

`AppTransport` 是通信内核，但它不应成为业务层直接使用的对象。  
真正给全前端使用的稳定收口应是 `appClient`。

建议语义形态如下：

```ts
type AppClient = {
  request<T>(input: RequestInput): Promise<T>;
  openStream<TEvent = unknown, TFinal = unknown>(
    input: StreamInput<TEvent, TFinal>
  ): StreamSession<TFinal>;
  subscribe(handler: (event: AppEvent) => void): () => void;
};

type StreamSession<TFinal> = {
  finished: Promise<TFinal>;
  cancel(): void;
};
```

设计意图：

- 对业务层呈现出类似 `apiClient` 的使用体验
- 只保留最小且长期稳定的三类原语：
  - `request()`
  - `openStream()`
  - `subscribe()`
- `cancel()` 不作为顶层函数暴露，而是收敛在 stream session 返回值上
- `get / post / put / delete` 这种语法糖放在更上层 facade，而不是塞进核心接口
- 让业务层不需要直接 import `AppTransport`

### 5.3 Transport Adapter 层

在统一抽象之下提供两类适配器：

#### A. LocalAppTransport

职责：

- `request` -> 现有 HTTP
- `openStream` -> 现有 SSE
- `subscribe` -> 现有 `/ws`

#### B. RemoteSessionMultiplexTransport

职责：

- 建立一条 `wss://r-<access-session-id>.../_remote/ws` 长连接
- 将 `request / stream / event` 映射为 multiplex frame
- 统一处理重连、错误、流关闭与远程 session 失效

### 5.4 什么应该稳定，什么允许演进

本方案明确区分两层：

#### A. 应长期稳定的层

- `AppTransport` 接口本身
- `appClient` 暴露给业务层的使用方式
- `request / stream / event` 的能力语义
- `openStream()` 返回 `StreamSession`，由 session 自身承载 `cancel()`

这层的目标就是“一劳永逸”。如果后续切换底层协议仍然要求页面或业务逻辑改写，说明抽象层设计失败。

#### B. 允许演进的层

- adaptor 内部 frame 编解码
- 连接重连策略
- 远程 session 恢复策略
- query patch 与 invalidate 的实现策略
- 轮询与事件驱动之间的切换策略
- facade 层是否提供 `get / post / put / delete` 这类便捷包装

这些都属于抽象层之下的运行时实现细节。它们可以演进，但不应反向污染业务层。

### 5.5 UI / 业务层边界

UI 与业务层只调用领域通信模块，不允许：

- 直接 `fetch`
- 直接 `new WebSocket(...)`
- 直接理解远程 frame 协议
- 直接 import `AppTransport`

## 6. 全前端收口模型

忽略 legacy 链路后，整个前端应统一落在以下模型上：

```text
UI / 页面 / hooks / presenter / store / manager
  -> 领域通信模块
    -> appClient
      -> AppTransport
        -> LocalAppTransport / RemoteSessionMultiplexTransport
```

各层职责如下：

### 6.1 UI / 页面 / hooks / presenter / store / manager

职责：

- 处理业务交互与状态
- 依赖领域通信模块

禁止职责：

- 不直接调用 transport
- 不直接判断 local / remote
- 不理解底层协议与 frame 细节

### 6.2 领域通信模块

这是各业务域自己的通信门面，负责把业务语义翻译成统一通信调用。

例如：

- `configApi`
- `remoteApi`
- `marketplaceApi`
- `ncp endpoint factory`
- `appRealtimeHub`

它们面向业务语义，对下统一调用 `appClient`。

### 6.3 `appClient`

这是全前端稳定收口。

职责：

- 暴露 `request() / openStream() / subscribe()`
- 统一错误包装
- 统一 local / remote runtime 切换
- 调用底层 `AppTransport`

### 6.4 `AppTransport`

这是通信内核。

职责：

- 定义稳定的协议能力边界
- 不理解业务

### 6.5 Transport Adaptor

职责：

- 将 `AppTransport` 的能力绑定到具体协议实现

## 7. 哪些模块应该感知 transport

应严格限制为极少数基础设施模块：

- `appClient` 实现
- `LocalAppTransport`
- `RemoteSessionMultiplexTransport`
- transport bootstrap / factory（如有）

除此之外，其它模块默认不应感知 transport。

## 8. 哪些模块不应该感知 transport

以下层级应尽量完全无感：

- 页面组件
- React hooks
- presenters
- stores
- managers
- NCP 页面
- Config 页面
- Marketplace 页面
- Remote Access 设置页

这些模块理想上看到的是：

- `configApi.fetchConfig()`
- `remoteApi.fetchStatus()`
- `appRealtimeHub.subscribe(...)`
- `createNcpClientEndpoint(appClient)`

而不是：

- `transport.request(...)`
- `transport.openStream(...)`
- `transport.subscribe(...)`

## 9. 最小正确实现

如果按“长期稳定抽象层”这个目标来设计，前端最小正确实现其实只需要：

```text
packages/nextclaw-ui/src/transport/
  types.ts
  local.transport.ts
  remote.transport.ts
  app-client.ts
  index.ts
```

各文件职责如下：

### `types.ts`

- 定义 `AppTransport`
- 定义 `RequestInput` / `StreamInput`
- 定义 `TransportConnectionSnapshot`
- 定义 transport 级事件类型

### `local.transport.ts`

- 复用现有 `fetch + SSE + /ws`
- 负责把本地 `/ws` 消息映射为统一 `AppEvent`

### `remote.transport.ts`

- 管理 remote session multiplex websocket
- frame 编解码
- request / stream / event 多路复用
- reconnect / resume / cancel

### `app-client.ts`

- 在 `AppTransport` 之上暴露统一的 `request() / openStream() / subscribe()` 收口
- 提供类似传统 `apiClient` 的稳定使用方式

### `index.ts`

- 提供单一入口，按当前运行环境返回 `LocalAppTransport` 或 `RemoteSessionMultiplexTransport`
- 同时创建并导出单例 `appClient`

## 10. 为什么不需要一开始引入很多模块

本次设计的重点是“一次性定义稳定抽象层”，不是“一次性把所有未来运行时模块建满”。

因此：

- `transport.store`
- `transport.manager`
- `realtime-query-bridge`
- `refetch-policy`

这些都不是第一阶段必须存在的概念层级。

它们可以在后续复杂度真实出现时再拆出独立文件，但不应被误解为当前方案的核心。

换句话说：

- 核心架构只有：`一个稳定抽象层 + 两个 adaptor`
- `appClient` 是对外唯一收口
- 其它模块只是潜在的实现拆分位点，不是本方案成立的前提

## 11. 前端最小改造策略

### 11.1 第一批必须改造的点

#### A. `useWebSocket.ts`

当前职责过重，既负责协议连接，也负责：

- health fallback
- UI connection status
- query invalidate

应调整为：

- transport 连接能力统一改为从 `appClient.subscribe` 驱动的 realtime hub 获取
- `useWebSocket` 收敛为应用级事件桥，或被更名为 `useRealtimeQueryBridge`
- remote 模式下取消 `/api/health` 定时探测

#### B. `chat-stream/transport.ts`

这是最适合迁移到统一 transport 的切点。

应改为：

- `openSendTurnStream()` -> 依赖 `appClient.openStream`
- `openResumeRunStream()` -> 依赖 `appClient.openStream`
- `requestStopRun()` 第一阶段可暂时保留 HTTP，第二阶段再迁移

#### C. `App.tsx`

在应用入口注入统一 `appClient` 单例或 provider；若使用 provider，也应只给基础设施层消费，不应鼓励业务层直接拿 transport。

### 11.2 第一批暂不改造的点

- 低频 config CRUD
- remote access 设置页自身的控制面接口
- marketplace 查询
- 所有低频、可缓存、非实时接口

原因：

- 这些并不是当前 request 爆炸的主来源
- 过早迁移会扩大改动面

## 12. 领域接入方式预览

### 12.1 Config / Remote / Marketplace

这些模块最适合继续保留自己的 API facade，但底层统一改为 `appClient.request`。

理想形态：

```ts
export const configApi = {
  fetchConfig: () =>
    appClient.request<ConfigView>({
      method: 'GET',
      path: '/api/config',
    }),
  updateConfig: (body: ConfigUpdate) =>
    appClient.request<ConfigView>({
      method: 'PUT',
      path: '/api/config',
      body,
    }),
};
```

```ts
export const remoteApi = {
  fetchStatus: () =>
    appClient.request<RemoteAccessView>({
      method: 'GET',
      path: '/api/remote/status',
    }),
};
```

这样页面、hooks、store 不需要知道 transport。

### 12.2 Realtime

建议统一建立一个 `appRealtimeHub`，作为全局事件入口：

```ts
export const appRealtimeHub = {
  subscribe: (handler: (event: AppEvent) => void) => appClient.subscribe(handler),
};
```

然后：

- `useWebSocket.ts` 退化为 realtime query bridge
- 业务层只看应用事件，不看 transport

### 12.3 NCP

NCP 不应直接理解 `AppTransport`。  
最优雅的方式是继续保留 `NcpAgentClientEndpoint` 这一层，只新增一个基于 `appClient` 的 endpoint adaptor。

理想形态：

```ts
const ncpClient = createNcpClientEndpoint(appClient);
```

然后继续：

```ts
const agent = useHydratedNcpAgent({
  sessionId,
  client: ncpClient,
  loadSeed,
});
```

这样：

- NCP 页面不需要理解 transport
- `useHydratedNcpAgent` 不需要理解 transport
- 只是在 NCP endpoint 这一层内部对接 `appClient`

## 13. 优先迁移的高频动态链路

### 13.1 全局实时事件

优先将当前 `/ws` 承担的应用级事件统一接入 transport：

- `config.updated`
- `run.updated`
- `session.updated`
- `connection.*`

当前 `WsEvent` 类型已存在，可以继续作为应用级事件模型复用。

### 13.2 聊天 SSE

优先迁移：

- `POST /api/chat/turn/stream`
- `GET /api/chat/runs/:runId/stream`

原因：

- 这是当前远程场景下最明显的高频动态流量之一
- 适合天然映射为 multiplex stream

### 13.3 轮询型状态同步

当前高频轮询主要集中在：

- active runs
- NCP sessions

这些在 remote 模式下应优先改为：

- transport 事件驱动
- 低频或关闭轮询

## 14. 什么属于抽象层，什么不属于

为避免抽象层失控，本方案明确规定：

### 14.1 属于 `AppTransport` 的内容

- 请求语义
- 流式语义
- 事件订阅语义
- stream session 的取消语义

### 14.2 属于 `appClient` 的内容

- `request() / openStream() / subscribe()` 三个对外原语
- local / remote 底层切换
- 与业务无关的统一错误包装

### 14.3 不属于核心接口但允许由返回值或事件表达的内容

- 顶层 `cancel()`
- 顶层 `getConnectionState()`
- 顶层 `get / post / put / delete`

这些能力可以存在，但不应直接膨胀为 `appClient` 的核心接口面。  
更合适的承载方式是：

- `cancel()` 作为 `openStream()` 返回的 `StreamSession` 方法
- 连接状态通过事件表达，或由更上层 hub / store 派生
- `get / post / put / delete` 由 facade 层按需包装

### 14.4 不属于 `AppTransport` / `appClient` 的内容

- React Query 的 cache patch 细节
- 页面级轮询策略
- 业务级重试与 toast 逻辑
- token 刷新流程
- 页面级路由恢复策略

这些不应混入 `AppTransport` 或 `appClient` 的核心定义，否则会把一个稳定通信抽象层膨胀成整个前端 runtime 框架。

## 15. Remote Multiplex Frame 建议

这一层不是业务协议，也不是对 HTTP / SSE / WebSocket 名字级别的一比一代理。  
它的目标只有一个：为 remote transport 提供一个最小、通用、协议无关的内部多路复用信封层。

因此，frame 应只表达最本质的传输语义：

- 连接建立
- 单次请求应答
- 流的打开 / 数据分片 / 结束 / 取消
- 独立事件推送

第一阶段建议支持以下 frame：

```ts
type RemoteTarget = {
  method: string;
  path: string;
  body?: unknown;
};

type RemoteFrame =
  | { type: "connection.ready"; connectionId: string; protocolVersion: 1 }
  | { type: "request"; id: string; target: RemoteTarget }
  | { type: "response"; id: string; status: number; body?: unknown }
  | { type: "request.error"; id: string; message: string; code?: string }
  | { type: "stream.open"; streamId: string; target: RemoteTarget }
  | { type: "stream.data"; streamId: string; payload?: unknown }
  | { type: "stream.end"; streamId: string; result?: unknown }
  | { type: "stream.error"; streamId: string; message: string; code?: string }
  | { type: "stream.cancel"; streamId: string }
  | { type: "event"; name: string; payload: unknown }
  | { type: "connection.error"; message: string; code?: string };
```

设计原则：

- `frame` 只是 remote transport 的内部实现细节
- `frame` 不承载业务属性，不理解 query patch / invalidate / snapshot 等上层概念
- 每个 `type` 只表达一种明确语义，不依赖可选字段去猜上下文
- 连接级 frame 统一使用 `connection.*` 命名空间，避免 `ready` 这类悬空命名
- `stream.data` 只是“流中的一段数据”，不暗示业务 delta 语义
- 上层不直接使用 frame 类型
- `remote.transport.ts` 负责在 frame 与 `AppTransport` 之间做映射

## 16. Query 层最佳实践

### 16.1 第一阶段

保守做法：

- 远程模式下降低或关闭高频 `refetchInterval`
- 继续复用 `invalidateQueries`

### 16.2 第二阶段

优化做法：

- 将 `run.updated`、`session.updated` 等高频事件变为 `setQueryData` 精确 patch
- 避免事件一来就整块 query 重拉

推荐优先 patch：

- `chat-runs`
- `sessions`
- `session-history`
- `ncp-sessions`

## 17. 分阶段实施建议

### 阶段一：Realtime Event 收敛

目标：

- 建立 `appClient` 基础设施层
- 远程模式不再依赖 `/api/health` 探活
- `/ws` 缺口通过 remote session ws 补齐
- 全局事件与 query bridge 接入 `appClient.subscribe`

### 阶段二：Chat Stream 收敛

目标：

- 聊天发送流与 run stream 迁移到 `appClient.openStream`
- 远程模式下显著减少 SSE request

### 阶段三：Polling Debt 收敛

目标：

- 远程模式下降低或移除 `800ms` 轮询
- 将高频 query 更新逐步迁移到事件驱动 patch

### 阶段四：扩展低频接口（可选）

仅在有明确收益时，才考虑把更多高频 request 型接口也迁入 `appClient.request` 的 remote 底层通道。

## 18. 成功标准

该方案成功的标志不是“整个远程页面只发一次 Worker request”，而是：

- 页面打开后的动态交互阶段，新增 Worker HTTP request 大幅下降
- 聊天、run、状态同步主要依赖单条长连接
- 页面长时间停留时，不再持续出现高频探活与轮询请求
- 本地模式与远程模式仍共享同一套页面与业务逻辑
- `AppTransport` 只被极少数基础设施模块感知
- `appClient` 核心接口长期保持为 `request() / openStream() / subscribe()`
- 业务层默认通过 `api facade / endpoint adapter / realtime hub` 间接使用统一收口

## 19. 结论

当前 remote access 的下一阶段最优方向，不是“把所有接口都改成 WebSocket”，而是：

**一次性定义长期稳定的 `AppTransport`，并在其上建立全前端统一收口 `appClient`；让本地 HTTP/SSE/WS 与远程 multiplex WebSocket 都成为该抽象层下的 adaptor。**

在这个结构下：

- 上层业务可以与底层 transport 完全解耦
- 整个前端可以像使用 `apiClient` 一样使用统一收口，而不是直接接触 transport
- 当前最严重的 remote 动态 request 问题可以在不重写页面逻辑的前提下被治理
- 后续无论继续用 WebSocket 还是接入 WebRTC / P2P，都可以复用这条稳定边界
