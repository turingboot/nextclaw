# 迭代完成说明

- 落地根级 ESLint 第二层可维护性约束：
  - 新增 `max-statements`
  - 新增 `max-depth`
  - 在编排重区新增 `sonarjs/cognitive-complexity`
  - 为测试文件新增 `max-lines-per-function=220` 与 `max-statements=45`
  - 为 UI 组件新增 `max-statements=60`
  - 保留既有 `max-lines=800` 与默认 `max-lines-per-function=150`
- 本次实现对应的治理方案文档见 [Nextbot ESLint And Maintainability Governance Plan](../../plans/2026-03-19-eslint-maintainability-governance-plan.md)。
- 新增根级依赖 `eslint-plugin-sonarjs`，并更新 `pnpm-lock.yaml`。
- 在根级 `.gitignore` 中新增 `**/__pycache__/`、`*.pyc`、`*.pyo`，避免 Python 缓存产物继续污染工作区。
- 升级 `scripts/eslint-line-limit-report.mjs`，从只汇总 line-limit 扩展为汇总以下规则：
  - `max-lines`
  - `max-lines-per-function`
  - `max-statements`
  - `max-depth`
  - `sonarjs/cognitive-complexity`
- 升级 `post-edit-maintainability-guard`：
  - 文档改为明确“双层闸门”：文件级预算 + 函数级 ESLint 规则
  - 守卫脚本统一迁移到 Node，并收敛为 kebab-case 命名：
    - `check-maintainability.mjs`
    - `maintainability-guard-core.mjs`
    - `maintainability-guard-lint.mjs`
    - `maintainability-guard-support.mjs`
  - 新增 diff-only 逻辑：优先拦截本次新增或恶化的函数级债务，而不是把所有历史 warning 一次性卡死
  - 新增对维护性规则 `eslint-disable` 注释的阻断检测
- 新规则已能命中典型问题样本：
  - `packages/nextclaw-openclaw-compat/src/plugins/loader.ts` 的 `loadOpenClawPlugins`
  - `appendBundledChannelPlugins`
  - 多个 `service` / `controller` / `router` / `channel runtime` 编排函数

# 测试/验证/验收方式

- 语法校验：
  - `node --check .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs`
  - 结果：通过
- 代表性 ESLint 验证：
  - `pnpm exec eslint packages/nextclaw-openclaw-compat/src/plugins/loader.ts --format json`
  - 结果：能命中新增规则
    - `sonarjs/cognitive-complexity`：`appendBundledChannelPlugins`、`loadOpenClawPlugins`
    - `max-statements`：`appendBundledChannelPlugins`、`loadOpenClawPlugins`
    - `max-lines-per-function`：`loadOpenClawPlugins`
- 报告脚本验证：
  - `node scripts/eslint-line-limit-report.mjs --json`
  - 结果摘要：
    - `totalViolations=183`
    - `affectedFiles=77`
    - `violationsByRule`：
      - `max-depth=9`
      - `max-lines=9`
      - `max-lines-per-function=19`
      - `max-statements=78`
      - `sonarjs/cognitive-complexity=68`
- maintainability guard 验证：
  - `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --json --no-fail`
  - `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs .codex/skills/post-edit-maintainability-guard/scripts/maintainability-guard-core.mjs .codex/skills/post-edit-maintainability-guard/scripts/maintainability-guard-lint.mjs .codex/skills/post-edit-maintainability-guard/scripts/maintainability-guard-support.mjs scripts/eslint-line-limit-report.mjs eslint.config.mjs --json --no-fail`
  - 结果：本次改动文件 `errors=0`、`warnings=0`
- `build` / `tsc`：
  - 不适用。理由：本次仅触达 lint 配置与治理脚本，不涉及构建产物、类型链路或运行时行为。

# 发布/部署方式

- 本次改动仅涉及仓库内部 lint 治理与维护性守卫，无独立发布、部署或 migration。
- 合入后即可生效；团队成员后续执行根级 ESLint 与 `post-edit-maintainability-guard` 时会自动使用新规则。

# 用户/产品视角的验收步骤

1. 在仓库根目录执行 `pnpm exec eslint packages/nextclaw-openclaw-compat/src/plugins/loader.ts --format json`。
2. 确认输出不再只包含 `max-lines-per-function`，而是还能看到 `max-statements` 与 `sonarjs/cognitive-complexity`。
3. 运行 `node scripts/eslint-line-limit-report.mjs --json`，确认输出里包含 `max-depth`、`max-statements`、`sonarjs/cognitive-complexity` 的聚合统计。
4. 运行 `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --json --no-fail`，确认输出中有 `file_findings` 与 `function_findings` 两个维度，且本次改动文件未引入新的维护性阻塞项。
