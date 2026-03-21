# v0.14.102-remote-access-provider-release-closeout

相关迭代：

- [远程访问当前进程运行态修复](../v0.14.100-remote-access-current-process-runtime-fix/README.md)
- [Provider Enabled 开关](../v0.14.101-provider-enable-switch/README.md)
- [账号登录与远程访问产品设计](../../plans/2026-03-21-nextclaw-account-and-remote-access-product-design.md)
- [远程中继休眠与成本优化设计](../../plans/2026-03-21-nextclaw-remote-relay-hibernation-cost-optimization-design.md)

## 迭代完成说明

- 继续完成远程访问与 provider enable switch 这条发布链路的收尾治理，而不是停留在“代码能跑”。
- 将 `ProviderForm` 从 1258 行收缩到 691 行，拆出 auth section、models section、advanced settings section，以及纯归一化辅助模块，避免 provider 配置继续堆进单一表单容器。
- 将 service 内的 plugin runtime bridge 注册逻辑独立到 [`service-plugin-runtime-bridge.ts`](/Users/tongwenwen/Projects/Peiiii/nextclaw/packages/nextclaw/src/cli/commands/service-plugin-runtime-bridge.ts)，避免 `service.ts` 在远程访问修复后继续膨胀。
- 补齐本轮继续收尾所需的迭代记录，保证 maintainability guard、发布、提交都能按当前变更集闭环执行。

## 红区触达与减债记录

### packages/nextclaw-server/src/ui/config.ts

- 本次是否减债：否。
- 说明：本轮主要做发布收尾，没有继续把新的行为塞进该文件；该文件仍承载 provider/search/session 多域配置聚合，是当前服务端配置入口的主要热点。
- 下一步拆分缝：先按 chat/session/provider 三个域拆分配置构建与默认值归一化。

### packages/nextclaw-ui/src/components/config/ProviderForm.tsx

- 本次是否减债：是，显著减债。
- 说明：将 provider auth、models、advanced settings 三个 UI 区块拆到独立组件，并把归一化/比较逻辑下沉到 [`provider-form-support.ts`](/Users/tongwenwen/Projects/Peiiii/nextclaw/packages/nextclaw-ui/src/components/config/provider-form-support.ts)；文件从 1258 行降到 691 行，`ProviderForm` 从“超长巨型表单”收缩为状态编排壳层。
- 下一步拆分缝：继续把 auth polling 和 submit adapter 下沉到专用 hook，使 `ProviderForm` 进一步回到 500 行预算内。

### packages/nextclaw/src/cli/commands/diagnostics.ts

- 本次是否减债：否。
- 说明：本轮只带着上一轮 provider enabled 相关诊断字段进入发布闭环，没有继续扩展新的诊断采集流程；该文件仍接近预算线。
- 下一步拆分缝：先拆 diagnostics collector、runtime status mapper、user-facing renderer。

## 测试/验证/验收方式

- Provider 开关与远程访问测试：
  - `pnpm -C packages/nextclaw-core exec vitest run src/config/schema.provider-routing.test.ts src/config/provider-runtime-resolution.test.ts`
  - `pnpm -C packages/nextclaw-server exec vitest run src/ui/router.provider-test.test.ts src/ui/router.provider-enabled.test.ts`
  - `pnpm -C packages/nextclaw exec vitest run src/cli/commands/remote-access-host.test.ts`
- 类型检查：
  - `pnpm -C packages/nextclaw-ui tsc`
  - `pnpm -C packages/nextclaw tsc`
- 受影响包构建：
  - `pnpm -C packages/nextclaw-ui build`
  - `pnpm -C packages/nextclaw-core build`
  - `pnpm -C packages/nextclaw-server build`
  - `pnpm -C packages/nextclaw-remote build`
  - `pnpm -C packages/nextclaw build`
- Maintainability guard：
  - `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths packages/nextclaw-ui/src/components/config/ProviderForm.tsx packages/nextclaw-ui/src/components/config/provider-form-support.ts packages/nextclaw-ui/src/components/config/provider-auth-section.tsx packages/nextclaw-ui/src/components/config/provider-models-section.tsx packages/nextclaw-ui/src/components/config/provider-advanced-settings-section.tsx packages/nextclaw-ui/src/components/config/provider-pill-selector.tsx packages/nextclaw-server/src/ui/config.ts packages/nextclaw/src/cli/commands/diagnostics.ts packages/nextclaw/src/cli/commands/service.ts packages/nextclaw/src/cli/commands/service-plugin-runtime-bridge.ts`
  - 结果：`Errors: 0`，仅保留历史热点 warning。
- dev 冒烟：
  - 现有 `pnpm dev start` 实例 `http://127.0.0.1:18793` 上执行 `POST /api/remote/service/restart` 后，`/api/remote/status` 返回 `runtime.state=connected`、`service.currentProcess=true`、`deviceId=079d7794-5a25-4bf6-a827-a7f89966d5a8`。
  - `/api/remote/doctor` 返回 `service-runtime=connected`。
  - 平台设备列表接口返回该设备 `status=online`、`localOrigin=http://127.0.0.1:18793`。
- 生产版冒烟：
  - `node packages/nextclaw/dist/cli/index.js serve --ui-port 18897`
  - `/api/remote/status` 返回 `runtime.state=connected`、`service.currentProcess=true`、`localOrigin=http://127.0.0.1:18897`。
  - `/api/remote/doctor` 返回 `service-runtime=connected`。
  - 平台设备列表接口返回同一设备 `status=online`、`localOrigin=http://127.0.0.1:18897`。

## 发布/部署方式

- 本轮不涉及 migration。
- 已执行：
  - `pnpm release:version`
  - `pnpm release:publish`
- 已校验线上版本：
  - `nextclaw@0.13.20`
  - `@nextclaw/server@0.10.16`
  - `@nextclaw/mcp@0.1.16`
  - `@nextclaw/ncp-mcp@0.1.16`
  - `@nextclaw/remote@0.1.12`
  - `@nextclaw/core@0.9.6`
  - `@nextclaw/ui@0.9.8`

## 用户/产品视角的验收步骤

1. 通过 `pnpm dev start` 启动本地实例，进入“远程访问”，确认状态能反映当前 UI 进程，而不是历史 managed service。
2. 点击“查看我的设备”后，在平台设备列表中看到当前本地实例，并可进入对应页面。
3. 打开 Providers 页面，确认 `Enabled` 开关、`Disabled` 状态徽标与模型路由行为一致。
4. 使用生产版 `nextclaw serve --ui-port <port>` 重复远程访问流程，确认 dev 与生产版语义一致。
