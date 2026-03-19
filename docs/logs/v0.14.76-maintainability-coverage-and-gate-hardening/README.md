# v0.14.76 Maintainability Coverage And Gate Hardening

## 迭代完成说明（改了什么）

- 落地仓库可维护性治理方案的 `Phase 0: Coverage Closure` 与 `Phase 1: Gate Hardening`。
- 为 `apps/landing` 和 10 个 `packages/extensions/nextclaw-channel-plugin-*` workspace 补齐 `lint` 入口，消除代码 workspace 治理盲区。
- 扩展根级 `lint` 闭环，使上述 workspace 进入统一日常校验路径。
- 强化 [`scripts/eslint-maintainability-report.mjs`](../../../scripts/eslint-maintainability-report.mjs)，新增 code workspace coverage 审计与 `--fail-on-coverage-gaps` 阻断能力，避免未来再新增“有代码但未纳管”的 workspace。
- 调整 [`eslint.config.mjs`](../../../eslint.config.mjs) 的 JS / MJS / CJS 分层配置，补足脚本与配置文件的运行环境 globals，确保全仓 maintainability audit 可用且不会被大量环境假阳性淹没。
- 相关治理背景与阶段目标见 [Repo Maintainability Governance Plan](../../../docs/plans/2026-03-19-repo-maintainability-governance-plan.md)。

## 测试/验证/验收方式

- `pnpm -C apps/landing lint`
- `pnpm -C packages/extensions/nextclaw-channel-plugin-dingtalk lint`
- `pnpm -C packages/extensions/nextclaw-channel-plugin-discord lint`
- `pnpm -C packages/extensions/nextclaw-channel-plugin-email lint`
- `pnpm -C packages/extensions/nextclaw-channel-plugin-feishu lint`
- `pnpm -C packages/extensions/nextclaw-channel-plugin-mochat lint`
- `pnpm -C packages/extensions/nextclaw-channel-plugin-qq lint`
- `pnpm -C packages/extensions/nextclaw-channel-plugin-slack lint`
- `pnpm -C packages/extensions/nextclaw-channel-plugin-telegram lint`
- `pnpm -C packages/extensions/nextclaw-channel-plugin-wecom lint`
- `pnpm -C packages/extensions/nextclaw-channel-plugin-whatsapp lint`
- `node scripts/eslint-maintainability-report.mjs --json --fail-on-coverage-gaps`
- `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths eslint.config.mjs scripts/eslint-maintainability-report.mjs`

验收结果要点：

- `coverage.uncoveredCodeWorkspaces = []`
- 新增纳管的 `apps/landing` 与 10 个 channel plugin workspace 已全部进入 report 扫描范围
- 目前 report 仅剩 5 条历史非目标错误，未再出现大批 JS 环境假阳性
- `apps/landing` 仍存在既有 `max-lines` / `max-lines-per-function` warning，属于存量热点，不是本次新增债务

## 发布/部署方式

- 不适用。本次为仓库治理与校验机制改动，无独立部署动作。
- 合入主干后，后续开发默认通过根级 `lint`、maintainability report 与 post-edit maintainability guard 进入统一闭环。

## 用户/产品视角的验收步骤

1. 在仓库根目录执行 `pnpm lint`，确认 `apps/landing` 与 channel plugin workspace 被纳入统一 lint 流程。
2. 执行 `node scripts/eslint-maintainability-report.mjs --fail-on-coverage-gaps`，确认不会再出现“有代码 workspace 未覆盖”的情况。
3. 新增一个带代码的 workspace 但不配置 `lint` 时，重新运行 maintainability report，应能被 `coverage gap` 明确暴露。
4. 修改 `eslint.config.mjs` 或维护性检查脚本后，执行 `pnpm lint:maintainability:guard`，确认新增债务会被守卫发现。
