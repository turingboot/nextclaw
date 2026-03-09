# v0.12.99-mvp-skill-relocate-to-codex-skills

## 迭代完成说明（改了什么）

- 纠正上个迭代中的 skill 存放位置错误。
- 将 `mvp-view-logic-decoupling` 从内置技能目录迁移到项目根目录 `.codex/skills`：
  - 迁移前：`packages/nextclaw-core/src/agent/skills/mvp-view-logic-decoupling`
  - 迁移后：`.codex/skills/mvp-view-logic-decoupling`
- 清理内置技能索引中的误加条目：
  - `packages/nextclaw-core/src/agent/skills/README.md` 删除 `mvp-view-logic-decoupling` 索引行。
- 保留上个迭代文档作为历史记录，不回写旧目录，本次以新版本迭代完成纠偏。

## 测试/验证/验收方式

- Skill 结构校验：
  - `python3 /Users/peiwang/.codex/skills/.system/skill-creator/scripts/quick_validate.py /Users/peiwang/Projects/nextbot/.codex/skills/mvp-view-logic-decoupling`
  - 预期：`Skill is valid!`
- 位置校验（文件存在性）：
  - `test -f /Users/peiwang/Projects/nextbot/.codex/skills/mvp-view-logic-decoupling/SKILL.md`
  - `test -f /Users/peiwang/Projects/nextbot/.codex/skills/mvp-view-logic-decoupling/agents/openai.yaml`
- 不适用项：
  - `build/lint/tsc` 不适用（本次仅 skill 目录迁移与文档索引修正，未改动构建/类型/运行链路代码）。

## 发布/部署方式

- 无需发布部署。
- `.codex/skills` 下内容在本地协作流程中可直接使用。

## 用户/产品视角的验收步骤

1. 在项目根目录确认存在：`.codex/skills/mvp-view-logic-decoupling/SKILL.md`。
2. 用该 skill 提一个 MVP 解耦请求，确认输出包含 presenter-manager-store、业务/UI 分层、箭头函数与去 prop 透传原则。
3. 抽查 `.codex/skills` 下是否仍保留 `agents/openai.yaml` 用于技能展示元数据。
