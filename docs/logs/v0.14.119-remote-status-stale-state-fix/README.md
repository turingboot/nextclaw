# v0.14.119-remote-status-stale-state-fix

## 迭代完成说明

- 修复 `nextclaw remote status` / `remote doctor` / UI remote 状态在受管服务进程已经退出时，仍沿用历史 `connected` 快照的问题。
- 变更点：
  - 在 `packages/nextclaw/src/cli/commands/remote-runtime-support.ts` 中，对受管服务的 remote runtime 状态增加“进程存活校验”。
  - 只要 `service.json` 还在、但 `pid` 已经不再存活，就把 remote runtime 从历史 `connected` 等状态降级为可解释的 `disconnected`，并补充 `Managed service is not running.`。
  - 保留 `deviceId`、`lastConnectedAt` 等诊断上下文，避免把历史连接信息彻底丢掉。
- 新增单测 `packages/nextclaw/src/cli/commands/remote-runtime-support.test.ts`，覆盖：
  - stale managed service 会从 `connected` 降级为 `disconnected`
  - live managed service 保持原状态不变

## 测试/验证/验收方式

- 受影响包验证：
  - `pnpm -C packages/nextclaw test -- --run src/cli/commands/remote-runtime-support.test.ts`
  - `pnpm -C packages/nextclaw tsc`
  - `pnpm -C packages/nextclaw build`
- 验收点：
  - 当 `service.json` 存在但后台服务进程已退出时，`nextclaw remote status --json` 不再返回 `state: connected`
  - `nextclaw remote doctor --json` 的 `service-runtime` 检查不再误报成功

## 发布/部署方式

- 无需新增运维前置条件。
- 该修复随 `nextclaw` 后续正式版本发布即可对所有用户生效。
- 与上一迭代的 server 运行时稳定性修复一起发布，才能同时解决：
  - 服务被低内存机器打死
  - 服务已死但 remote 状态仍假装健康

## 用户/产品视角的验收步骤

1. 启动 NextClaw 并启用 remote，确认初始状态正常。
2. 人为停止或杀掉 NextClaw 后台服务进程。
3. 执行 `nextclaw remote status --json`。
4. 预期：不再显示 `connected`，而是降级为断连状态，并提示服务未运行。
5. 打开 UI 的 remote 页面，预期不再看到“服务已死但状态仍显示连接成功”的误导信息。
