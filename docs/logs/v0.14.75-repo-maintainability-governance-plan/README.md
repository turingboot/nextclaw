# v0.14.75-repo-maintainability-governance-plan

## 迭代完成说明

- 新增仓库级治理方案 [Nextbot Repo Maintainability Governance Plan](../../plans/2026-03-19-repo-maintainability-governance-plan.md)，把可维护性治理从单点文件修复升级为“覆盖层 + 闸门层 + 红区层 + 架构层”的长期机制。
- 方案明确了系统性治理目标：仓库全覆盖、新债务默认拦截、核心红区持续收敛，而不是一次性清零所有 warning。
- 方案补齐了从现状判断、治理原则、治理模型、红区机制、链路拆分模板，到工具闭环、阶段计划、指标验收的完整结构。
- 方案显式引用了已有的 [ESLint And Maintainability Governance Plan](../../plans/2026-03-19-eslint-maintainability-governance-plan.md)，将其作为静态检查与闸门层的子方案，避免重复定义。

## 测试/验证/验收方式

- 文档结构检查：
  - 确认方案包含现状、目标、原则、治理模型、红区机制、链路拆分模板、流程闭环、阶段计划、指标与非目标。
- 链接检查：
  - 确认文档内对 [ESLint And Maintainability Governance Plan](../../plans/2026-03-19-eslint-maintainability-governance-plan.md) 的引用可用。
  - 确认本迭代 README 中对治理方案与子方案的 Markdown 链接可用。
- 适用性说明：
  - `build/lint/tsc` 不适用，本次仅新增治理文档，未触达代码路径。

## 发布/部署方式

- 本次为仓库治理方案文档沉淀，不涉及部署、数据库迁移、NPM/GitHub Release 或运行时发布链路。
- 合并后即可作为后续治理执行、拆分计划与迭代记录的上位参考文档使用。

## 用户/产品视角的验收步骤

1. 打开 [Nextbot Repo Maintainability Governance Plan](../../plans/2026-03-19-repo-maintainability-governance-plan.md)，确认它回答了“如何系统性杜绝同类可维护性问题”，而不是只列零散热点。
2. 确认方案中明确区分了“治理覆盖不完整”“主链路 monolith”“规则只限体积”“存量与增量债务未分层经营”等根因。
3. 确认方案给出了可执行的机制闭环，包括全仓覆盖、diff-only 闸门、红区清单、链路拆分模板、CI 双轨与阶段计划。
4. 确认方案最后给出了明确的下一步行动顺序，而不是停留在原则层面。
