# 迭代完成说明

- 新增治理方案文档 [Nextbot ESLint And Maintainability Governance Plan](../../plans/2026-03-19-eslint-maintainability-governance-plan.md)，把 `nextbot` 下一阶段的可维护性治理收束为一套正式、可执行的方案。
- 文档明确区分了两层职责：
  - ESLint 负责通用静态约束，重点补齐函数职责复杂度相关规则
  - `post-edit-maintainability-guard` 负责仓库语义化、diff-only 的新增债务闸门
- 方案中给出了适合当前仓库现状的规则取舍：
  - 保留既有 `max-lines` / `max-lines-per-function` 主基线
  - 新增 `max-statements`、`max-depth`、面向编排重区的 `sonarjs/cognitive-complexity`
  - 对测试与 UI 场景分别给出专门 override，避免“一刀切”噪音
- 方案还明确了 maintainability skill 的升级方向：
  - 保留文件级预算漂移检查
  - 新增函数级 ESLint 结果汇总
  - 只阻断本次改动新增的可维护性债务
  - 输出更具体的下一步拆分位点

# 测试/验证/验收方式

- 本次改动仅新增治理方案文档与迭代留痕，不触达代码路径。
- 验证方式：
  - 检查方案文档存在：`test -f docs/plans/2026-03-19-eslint-maintainability-governance-plan.md`
  - 检查迭代文档存在：`test -f docs/logs/v0.14.37-eslint-maintainability-governance-plan/README.md`
  - 检查 README 中已使用 Markdown 链接引用方案文档：`rg -n "Nextbot ESLint And Maintainability Governance Plan" docs/logs/v0.14.37-eslint-maintainability-governance-plan/README.md`
- `build` / `lint` / `tsc`：不适用。理由：本次未触达项目代码、脚本、测试或影响运行链路的配置。
- `post-edit-maintainability-guard`：不适用。理由：本次仅为治理文档新增，不触达代码路径。

# 发布/部署方式

- 不适用。本次为仓库内部治理方案沉淀，无独立发布、部署或 migration 动作。
- 后续如要按该方案实施，可直接以 [Nextbot ESLint And Maintainability Governance Plan](../../plans/2026-03-19-eslint-maintainability-governance-plan.md) 为执行基线展开代码改动。

# 用户/产品视角的验收步骤

1. 打开 [治理方案文档](../../plans/2026-03-19-eslint-maintainability-governance-plan.md)。
2. 确认文档中明确回答了三个问题：
   - 当前 `nextbot` 的 ESLint 基线应保留什么
   - 下一步具体新增哪些规则、加在哪些范围
   - `post-edit-maintainability-guard` 应如何升级为“只拦新增债务”的闸门
3. 确认文档中包含可执行的实施顺序、目标文件和建议验证命令，而不是只停留在原则讨论。
4. 以该文档为准，再进入后续实现阶段。
