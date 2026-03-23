# v0.14.153 Remote Platform Daily Budget Guard

本次技术方案文档：[`docs/plans/2026-03-24-remote-platform-daily-budget-guard-design.md`](/Users/peiwang/Projects/nextbot/docs/plans/2026-03-24-remote-platform-daily-budget-guard-design.md)

## 迭代完成说明

- 在 remote 平台 quota guard 中新增“平台每日总预算保护”：
  - 平台 Worker daily budget
  - 平台 Durable Object daily budget
  - 安全水位 reserve percent
- 新增“公平分配”：
  - 单用户每日 Worker 预算
  - 单 session 每日 Worker 预算
  - 单用户每日 DO 预算
  - 单 session 每日 DO 预算
- 把 quota guard 从“按 userId 分片 DO”收敛为“单个全局平台预算 DO”，避免平台总预算无法统一判断。
- remote relay 的浏览器 `request` / `stream.open` 不再每条消息都调用 quota DO，而是改成 relay 本地 lease + 全局批量补货，降低 DO request 放大。
- 保留并兼容已有分钟级限流和连接数上限。
- 新增平台保护错误码，超预算后明确返回降级状态，不继续放大流量。

## 测试/验证/验收方式

- 构建：`PATH=/opt/homebrew/bin:$PATH pnpm -C workers/nextclaw-provider-gateway-api build`
- Lint：`PATH=/opt/homebrew/bin:$PATH pnpm -C workers/nextclaw-provider-gateway-api lint`
- 类型检查：`PATH=/opt/homebrew/bin:$PATH pnpm -C workers/nextclaw-provider-gateway-api tsc`
- 策略测试：`PATH=/opt/homebrew/bin:$PATH pnpm -C workers/nextclaw-provider-gateway-api test:quota`
- 可维护性检查：`PATH=/opt/homebrew/bin:$PATH node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths workers/nextclaw-provider-gateway-api/src/remote-quota-contract.ts workers/nextclaw-provider-gateway-api/src/remote-quota-budget-support.ts workers/nextclaw-provider-gateway-api/src/remote-quota-state-support.ts workers/nextclaw-provider-gateway-api/src/remote-quota-policy.ts workers/nextclaw-provider-gateway-api/src/remote-quota-do.ts workers/nextclaw-provider-gateway-api/src/services/remote-quota-guard.service.ts workers/nextclaw-provider-gateway-api/src/controllers/remote-controller.ts workers/nextclaw-provider-gateway-api/src/controllers/remote-controller-quota-support.ts workers/nextclaw-provider-gateway-api/src/remote-relay-do.ts workers/nextclaw-provider-gateway-api/src/remote-relay-quota-support.ts workers/nextclaw-provider-gateway-api/src/remote-relay-client-frame-support.ts workers/nextclaw-provider-gateway-api/tests/remote-quota-policy.test.mjs workers/nextclaw-provider-gateway-api/tests/run-remote-quota-policy-test.mjs`

自动化测试覆盖：

- session / user 分钟级请求限流
- session / instance / user 连接上限
- 平台 Worker daily budget
- user daily Worker budget
- ws message lease 批量发放
- browser connect 的 daily budget 准入

## 发布/部署方式

- 本次不涉及 D1 schema 变更，`platform:db:migrate:remote` 不适用。
- 发布命令：`PATH=/opt/homebrew/bin:$PATH pnpm -C workers/nextclaw-provider-gateway-api run deploy`
- 发布后检查：
  - `NEXTCLAW_REMOTE_RELAY`
  - `NEXTCLAW_REMOTE_QUOTA`
  - quota 相关新环境变量
- 本次实际发布结果：
  - Route：`ai-gateway-api.nextclaw.io` / `*.claw.cool/*`
  - Current Version ID：`aa39568f-a136-4c05-9dfb-a87c378faee7`

## 用户/产品视角的验收步骤

- 正常远程访问单个实例，确认 remote 页面仍能连上，基础请求和流式输出仍可工作。
- 单个用户高频刷新或频繁远程操作时，平台应优先返回明确降级状态，而不是持续放大 Worker / DO 请求。
- 在一个远程会话内持续触发消息流量时，relay 不应再为每条消息新增一次 quota DO request，而应批量补货。
- 当平台接近或超过每日安全水位时，新请求应被明确拒绝，并提示稍后重试，而不是把全天额度池继续耗光。
- 本次线上最小验收：
  - `curl -sS https://ai-gateway-api.nextclaw.io/health`
  - 返回：`{"ok":true,"data":{"status":"ok","service":"nextclaw-provider-gateway-api","authRequired":true,"billingMode":"usd-only"}}`

## 红区触达与减债记录

### workers/nextclaw-provider-gateway-api/src/controllers/remote-controller.ts

- 本次是否减债：否
- 说明：本轮没有继续把平台预算逻辑堆入 controller，而是继续通过 `remote-controller-quota-support.ts` 承载；但主 controller 文件仍接近预算上限。
- 下一步拆分缝：把 remote session 校验 / proxy request 编排继续拆到更细的 support 文件。

### workers/nextclaw-provider-gateway-api/src/remote-relay-do.ts

- 本次是否减债：否
- 说明：本轮增加了 ws lease 逻辑，但控制在 budget 内，并把 quota 细节继续外提到 `remote-relay-quota-support.ts`。
- 下一步拆分缝：把 browser command forwarding 与 connector response routing 再拆为两个独立协作模块。
