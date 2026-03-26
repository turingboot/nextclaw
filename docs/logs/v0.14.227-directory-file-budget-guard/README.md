# v0.14.227-directory-file-budget-guard

## 迭代完成说明

- 为 `post-edit-maintainability-guard` 新增目录级预算检查：对被触达目录的直接手写代码文件数执行 `12/20` 双阈值治理，并保持 diff-only 行为。
- 新增目录预算豁免机制：当目录因框架或生成约束必须超过 `20` 个直接代码文件时，可在该目录 `README.md` 中用 `## 目录预算豁免` + `- 原因：...` 留下显式理由。
- 将目录预算逻辑抽到 [`maintainability-guard-directory-budget.mjs`](../../../.codex/skills/post-edit-maintainability-guard/scripts/maintainability-guard-directory-budget.mjs)，避免继续推高 [`maintainability-guard-support.mjs`](../../../.codex/skills/post-edit-maintainability-guard/scripts/maintainability-guard-support.mjs) 与 [`maintainability-guard-core.mjs`](../../../.codex/skills/post-edit-maintainability-guard/scripts/maintainability-guard-core.mjs) 的体积。
- 更新 [`AGENTS.md`](../../../AGENTS.md) 与 [`post-edit-maintainability-guard/SKILL.md`](../../../.codex/skills/post-edit-maintainability-guard/SKILL.md)，统一仓库规则、豁免格式与输出口径。

## 测试/验证/验收方式

- 运行 `node --check .codex/skills/post-edit-maintainability-guard/scripts/maintainability-guard-support.mjs`
- 运行 `node --check .codex/skills/post-edit-maintainability-guard/scripts/maintainability-guard-core.mjs`
- 运行 `node --check .codex/skills/post-edit-maintainability-guard/scripts/maintainability-guard-directory-budget.mjs`
- 运行 `node --test .codex/skills/post-edit-maintainability-guard/scripts/maintainability-guard-hotspots.test.mjs .codex/skills/post-edit-maintainability-guard/scripts/maintainability-guard-directory-budget.test.mjs`
- 运行 `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths .codex/skills/post-edit-maintainability-guard/scripts/maintainability-guard-support.mjs .codex/skills/post-edit-maintainability-guard/scripts/maintainability-guard-core.mjs .codex/skills/post-edit-maintainability-guard/scripts/maintainability-guard-directory-budget.mjs .codex/skills/post-edit-maintainability-guard/scripts/maintainability-guard-directory-budget.test.mjs .codex/skills/post-edit-maintainability-guard/scripts/maintainability-guard-hotspots.test.mjs`
- 运行 `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --json --no-fail --paths scripts/check-release-groups.mjs`，确认 `scripts/` 目录会返回 `directory-budget` 告警。
- `build / lint / tsc` 本次不适用：改动集中在仓库治理脚本、规则文档与迭代日志，未触达现有业务包的构建或类型检查链路；本次以脚本语法检查、Node 原生单测和守卫冒烟作为最小充分验证。

## 发布/部署方式

- 本次无需单独发布或部署。
- 合并后，目录预算检查会自动进入现有 `post-edit-maintainability-guard` 与 `pnpm lint:maintainability` 流程。
- 若某目录确有结构性理由超过 `20` 个直接代码文件，在该目录新增或更新 `README.md` 的 `## 目录预算豁免` 块即可显式留痕。

## 用户/产品视角的验收步骤

1. 在一个普通业务目录中连续新增直接代码文件，直至该目录达到 `12` 个文件后再次运行 `post-edit-maintainability-guard`。
2. 守卫应给出 `directory-budget` 告警，提示目录已进入 review 区间，需要按职责拆分。
3. 若继续让同一目录超过 `20` 个直接代码文件，且目录内没有 `README.md` 豁免说明，守卫应报错阻断。
4. 在该目录 `README.md` 中补上 `## 目录预算豁免` 与 `- 原因：...` 后再次运行守卫，结果应降为可追踪告警而非阻塞错误。
