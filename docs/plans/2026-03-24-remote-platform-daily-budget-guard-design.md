# NextClaw Remote Platform Daily Budget Guard Design

## 背景

当前 remote 平台已经有分钟级与连接级 quota guard，但它还没有解决两个更本质的问题：

1. 它不能保护 Cloudflare 每日总额度，无法保证平台在全天流量下不会提前耗尽免费池。
2. relay WebSocket 消息阶段仍然会频繁调用 quota DO，这会额外放大 Durable Objects request 数量，反过来挤压平台可承载用户数。

因此，本次目标不是再加一组更小的阈值，而是把平台保护升级为：

- 有日预算上限
- 有平台公平分配
- 有明确降级
- 不再用“每条 ws 消息一次 quota DO”这种高成本路径

## 官方额度基线

参考 Cloudflare 官方文档：

- Workers Free plan：`100,000 requests / day`，每日 `00:00 UTC` 重置  
  来源：<https://developers.cloudflare.com/workers/platform/limits/>
- Durable Objects Free plan：`100,000 requests / day`，每日 `00:00 UTC` 重置  
  来源：<https://developers.cloudflare.com/durable-objects/platform/pricing/>
- Durable Objects WebSocket incoming messages 在 compute request billing 上按 `20:1` 计费换算  
  来源：<https://developers.cloudflare.com/durable-objects/platform/pricing/>

这意味着我们不能只盯住“功能是否通”，而必须显式管理：

- Worker request 日预算
- Durable Object request 日预算
- 安全水位
- 单用户 / 单 session 的公平占用上限

## 备选方案

### 方案 A：继续沿用“每次消息都打 quota DO”

- 优点：实现最直接，计数最精确。
- 缺点：每条 relay ws 消息都会多出一次 quota DO request，本身就在放大 DO 免费额度消耗。
- 结论：不采用。它违背“平台要容纳更多用户/实例”的目标。

### 方案 B：完全在 relay DO 本地做预算

- 优点：最省 DO 请求。
- 缺点：无法跨实例、跨 session 做全平台公平分配，也无法准确保护 Worker request 总池。
- 结论：不采用。它不能承担平台 contract。

### 方案 C：全局预算 DO + relay 本地小批量租约

- 做法：
  - 用单个全局 quota DO 作为“平台预算中枢”
  - HTTP 路径继续逐次准入
  - relay ws 消息改成“小批量 lease”，不是每条消息都打 quota DO
- 优点：
  - 能保护全平台每日预算
  - 能做单用户 / 单 session 公平分配
  - 能显著减少 ws 阶段 quota DO request 数量
- 结论：采用

## 设计原则

- primary contract：remote 平台在 Cloudflare 免费额度下，必须优先保证“平台全天不崩、可预测降级、尽可能容纳更多用户”，而不是“谁先来谁把池子吃光”。
- 不做隐藏兜底。超预算后明确返回 degraded 状态，不继续接流量碰运气。
- 日预算以 `UTC day` 为唯一重置边界，避免环境差异。
- 所有平台预算都以“billable unit 估算值”管理，而不是只看业务请求数量。

## 预算模型

### 1. 平台每日预算

- `REMOTE_PLATFORM_DAILY_WORKER_REQUEST_BUDGET`
- `REMOTE_PLATFORM_DAILY_DO_REQUEST_BUDGET`
- `REMOTE_PLATFORM_DAILY_RESERVE_PERCENT`

有效预算：

- `effectiveWorkerBudget = configuredWorkerBudget * (100 - reservePercent) / 100`
- `effectiveDoBudget = configuredDoBudget * (100 - reservePercent) / 100`

默认值建议：

- Worker daily budget：`100000`
- DO daily budget：`100000`
- reserve percent：`20`

也就是默认只允许消耗到 80% 安全水位，避免把平台推到 Cloudflare 硬错误边缘。

### 2. 单用户 / 单 session 每日公平预算

- `REMOTE_QUOTA_USER_DAILY_WORKER_REQUEST_UNITS`
- `REMOTE_QUOTA_SESSION_DAILY_WORKER_REQUEST_UNITS`
- `REMOTE_QUOTA_USER_DAILY_DO_REQUEST_UNITS`
- `REMOTE_QUOTA_SESSION_DAILY_DO_REQUEST_UNITS`

默认值建议：

- user daily worker：`1200`
- session daily worker：`600`
- user daily do：`6000`
- session daily do：`3000`

这不是“最终商业配额”，而是免费池保护阈值，防止单用户或单 session 吃掉平台大头。

### 3. relay ws 小批量租约

- `REMOTE_QUOTA_WS_MESSAGE_LEASE_SIZE`

默认值建议：

- `10`

含义：

- relay DO 在浏览器 `request` / `stream.open` 时，不再每条消息调用 quota DO
- 当本地 lease 用完时，再向全局 quota DO 申请下一批
- 每批提前保留 minute + daily 配额

这样可以把 ws 阶段的 quota DO 请求数从“每条消息一次”降到“大约每 10 条一次”。

## 计费单位估算

### Worker request units

- `runtime`：1
- `proxy`：1
- `browser ws upgrade`：1
- relay ws message：0

### Durable Object request units

为避免浮点，内部使用 `milli-units`：

- 1 个 DO billing request = `1000`
- 1 条 relay WebSocket incoming message = `50`（20:1）

估算：

- `runtime`：quota DO 一次 => `1000`
- `proxy`：quota DO 一次 + relay DO proxy 一次 => `2000`
- `browser ws upgrade`：quota DO 一次 + relay DO upgrade 一次 => `2000`
- `relay ws request/stream.open`：
  - 当前消息本身 => `50`
  - 若触发新 lease，再加一次 quota DO => `1000`
  - 单条平均成本会随 lease size 摊薄

## 数据结构

全局 quota DO 改为单对象命名，例如 `remote-platform-budget-v1`，内部维护：

- `platformDailyUsage`
- `users[userId].dailyUsage`
- `users[userId].requestWindow`
- `users[userId].browserConnections`
- `users[userId].sessions[sessionId].dailyUsage`
- `users[userId].sessions[sessionId].requestWindow`

以及每个 relay client 的本地 lease 状态：

- `remaining`
- `grantedAt`
- `leaseSize`

relay 本地 lease 不作为新的跨进程 contract，只用于连接存活期间减少 quota DO 调用。

## 接入点

### Worker HTTP 入口

- `/_remote/runtime`
- `/_remote/ws`
- remote proxy HTTP

都改为调用全局 quota DO 的 admission：

- 先校验 platform daily budget
- 再校验 user/session daily budget
- 再校验现有 minute / connection quota

### relay DO

- 浏览器 ws 建连时初始化本地 lease 状态
- `request` / `stream.open` 先消费本地 lease
- lease 不足时再向全局 quota DO 申请下一批
- 超预算时返回明确错误 frame

## 错误契约

新增明确错误码：

- `REMOTE_PLATFORM_WORKER_DAILY_BUDGET_EXCEEDED`
- `REMOTE_PLATFORM_DO_DAILY_BUDGET_EXCEEDED`
- `REMOTE_USER_DAILY_WORKER_BUDGET_EXCEEDED`
- `REMOTE_SESSION_DAILY_WORKER_BUDGET_EXCEEDED`
- `REMOTE_USER_DAILY_DO_BUDGET_EXCEEDED`
- `REMOTE_SESSION_DAILY_DO_BUDGET_EXCEEDED`

已有分钟级与连接级错误码继续保留。

返回仍保持 transport 层无感知：

- HTTP：`429` 或 quota guard 自身不可用时 `503`
- WS：`request.error` / `stream.error`
- 都带：
  - `code`
  - `message`
  - `retryAfterSeconds`
  - `degraded: true`

## 验证计划

- 纯策略测试：
  - 平台 worker 日预算打满
  - 平台 DO 日预算打满
  - user/session 每日预算打满
  - ws lease 批量分配与耗尽
- build / lint / tsc
- maintainability guard
- 发布后线上 health 检查

## 我的推荐

采用“全局日预算 DO + relay 小批量 lease”的组合方案。

原因：

- 它是当前阶段最接近“既能保护总池子、又不把 DO 请求数继续打爆”的方案。
- 它不改变上层 transport 语义，仍然只是替换 HTTP / SSE / WS 的平台准入与转发成本模型。
- 它把平台 contract 明确化：优先保护全天可用性和公平承载，而不是让局部高频流量抢光 Cloudflare 免费额度。
