# v0.14.65 Maintainability Command Naming Align

## 迭代完成说明

- 将根目录脚本命名从易误导的 `lint:line-limits` 收敛为 `lint:maintainability:report`，对应全仓 ESLint 可维护性报表。
- 将原先直接绑定 diff-only 闸门的 `lint:maintainability` 下沉为 `lint:maintainability:guard`。
- 新增总入口 `lint:maintainability`，统一串联 `guard + report`，让命令名与实际职责一致。
- 将脚本文件从 `scripts/eslint-line-limit-report.mjs` 重命名为 `scripts/eslint-maintainability-report.mjs`，避免命令名与实现名继续漂移。
- 同步更新维护性治理计划中的命令与脚本引用：
  [2026-03-19-eslint-maintainability-governance-plan.md](/Users/peiwang/Projects/nextbot/docs/plans/2026-03-19-eslint-maintainability-governance-plan.md)

## 测试/验证/验收方式

执行命令：

```bash
PATH=/opt/homebrew/bin:$PATH pnpm lint:maintainability:report -- --json >/tmp/nextbot-maintainability-report.json
PATH=/opt/homebrew/bin:$PATH pnpm lint:maintainability:guard --paths packages/nextclaw-ui/src/components/marketplace/MarketplacePage.tsx
PATH=/opt/homebrew/bin:$PATH pnpm lint:maintainability:guard --paths scripts/eslint-maintainability-report.mjs
PATH=/opt/homebrew/bin:$PATH pnpm lint:maintainability
```

验收点：

- `lint:maintainability:report` 能成功执行并输出 JSON 报表。
- `lint:maintainability:guard` 能以新命令名正常执行。
- `packages/nextclaw-ui/src/components/marketplace/MarketplacePage.tsx` 仍能被识别为超预算文件。
- `scripts/eslint-maintainability-report.mjs` 本次改动未引入新的 maintainability findings。
- `lint:maintainability` 总入口能正确串联执行；本次运行因工作区现有问题在 `packages/nextclaw-ui/src/api/types.ts` 报出 1 条 file-budget error，并按预期返回非零退出码。

## 发布/部署方式

- 本次仅涉及根脚本命名与治理文档，不涉及 npm 发布、线上部署、数据库 migration。
- 若后续需要对外同步，只需在开发文档或团队协作说明中通知新命令名：
  `pnpm lint:maintainability`
  `pnpm lint:maintainability:guard`
  `pnpm lint:maintainability:report`

## 用户/产品视角的验收步骤

1. 在仓库根目录执行 `PATH=/opt/homebrew/bin:$PATH pnpm lint:maintainability:report`，确认看到全仓 maintainability 报表，而不是仅限 line limits 的命名。
2. 执行 `PATH=/opt/homebrew/bin:$PATH pnpm lint:maintainability:guard --paths packages/nextclaw-ui/src/components/marketplace/MarketplacePage.tsx`，确认能看到该文件的超预算提示。
3. 执行 `PATH=/opt/homebrew/bin:$PATH pnpm lint:maintainability`，确认命令语义上表示“完整维护性检查入口”，而不是难以理解的泛命名或旧的 line-limits 命名。
