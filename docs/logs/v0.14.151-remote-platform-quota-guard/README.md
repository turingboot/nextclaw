# v0.14.151 Remote Platform Quota Guard

## 迭代完成说明

- 在 `workers/nextclaw-provider-gateway-api` 新增平台侧 quota DO（binding class 为 `NextclawRemoteQuotaDurableObject`，保留 `NextclawQuotaDurableObject` 旧导出兼容线上历史依赖），把远程访问的 quota guard 收口到真正的 DO 状态中枢。
- 新增单用户请求限流、单 session 请求限流、单用户连接上限、单 session 连接上限、单实例浏览器连接上限，且都支持环境变量配置。
- 在 remote worker 入口接入 quota guard：
  - `/_remote/runtime`
  - `/_remote/ws`
  - remote proxy HTTP
  - relay DO 内部的 `request` / `stream.open`
- 超预算时不再继续接流量，而是显式返回降级状态：
  - HTTP 返回 `429`（quota guard 自身不可用时返回 `503`）
  - WebSocket 消息返回 `request.error` / `stream.error`
  - 都带明确 `code` / `message` / `retryAfterSeconds`
- 新增纯策略自动化测试，锁定 user/session/instance 三类 quota 行为。

## 测试/验证/验收方式

- 构建：`PATH=/opt/homebrew/bin:$PATH pnpm -C workers/nextclaw-provider-gateway-api build`
- Lint：`PATH=/opt/homebrew/bin:$PATH pnpm -C workers/nextclaw-provider-gateway-api lint`
- 类型检查：`PATH=/opt/homebrew/bin:$PATH pnpm -C workers/nextclaw-provider-gateway-api tsc`
- 配额策略自动化测试：`PATH=/opt/homebrew/bin:$PATH pnpm -C workers/nextclaw-provider-gateway-api test:quota`
- 可维护性检查：`PATH=/opt/homebrew/bin:$PATH node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths workers/nextclaw-provider-gateway-api/src/remote-quota-policy.ts workers/nextclaw-provider-gateway-api/src/remote-quota-do.ts workers/nextclaw-provider-gateway-api/src/services/remote-quota-guard.service.ts workers/nextclaw-provider-gateway-api/src/controllers/remote-controller.ts workers/nextclaw-provider-gateway-api/src/remote-relay-do.ts`
- 线上最小验收：`curl -sS https://ai-gateway-api.nextclaw.io/health`
  - 返回：`{"ok":true,"data":{"status":"ok","service":"nextclaw-provider-gateway-api","authRequired":true,"billingMode":"usd-only"}}`

## 发布/部署方式

- 本次不涉及 D1 schema 变更，`platform:db:migrate:remote` 不适用。
- 需要发布 worker：`PATH=/opt/homebrew/bin:$PATH pnpm -C workers/nextclaw-provider-gateway-api deploy`
- 发布后检查 wrangler deploy 输出，确认 `NextclawRemoteQuotaDurableObject` 和 `NextclawRemoteRelayDurableObject` 都按当前 `wrangler.toml` 生效。
- 本次实际发布结果：
  - Route：`ai-gateway-api.nextclaw.io` / `*.claw.cool/*`
  - Current Version ID：`29d4982c-893c-4725-8a50-b969a9331571`

## 用户/产品视角的验收步骤

- 正常远程访问单个实例，确认页面仍可加载、请求仍可返回、流式输出仍可开始并完成。
- 同一用户连续发起高频远程请求，确认平台不再持续放大 Cloudflare Worker / DO 请求，而是收到明确降级提示，而不是无响应或无限重试。
- 同一 session 开多个页面或重复刷新，超过连接上限后应立即看到明确错误，而不是继续建立更多浏览器连接。
- 同一实例被过多浏览器窗口占用时，新连接应被拒绝，并返回清晰可理解的降级信号。

## 红区触达与减债记录

### workers/nextclaw-provider-gateway-api/src/controllers/remote-controller.ts

- 本次是否减债：是
- 说明：未把 quota 判定继续堆进 controller 内部细节，而是新增 `remote-quota-guard.service.ts` 做统一入口，避免 controller 继续承担状态管理职责。
- 下一步拆分缝：如果 remote 入口继续增长，可把 ws/http 两类接入逻辑各自抽到独立 controller-support 文件。

### workers/nextclaw-provider-gateway-api/src/remote-relay-do.ts

- 本次是否减债：是
- 说明：relay DO 只负责在消息转发前调用 quota service，不直接承载 quota 规则和状态存储；真正状态集中在 quota DO。
- 下一步拆分缝：若 relay frame 继续扩张，可把 browser-side command handling 与 connector-side response handling 再拆成两个协作模块。
