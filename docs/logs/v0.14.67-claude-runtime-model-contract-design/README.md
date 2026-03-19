# v0.14.67-claude-runtime-model-contract-design

## 迭代完成说明

- 新增 Claude runtime 模型契约设计文档，明确在 NextClaw 产品语境下，`preferred_model` 仍是一等公民，`claude` 是 runtime 而不是独立模型系统。
- 设计文档重点补齐了“已确认能做 / 已确认不能直接承诺 / 必须运行时验证后才可承诺”的边界，避免继续靠臆想定义 Claude 会话能力。
- 在原有技术契约基础上，进一步补强了用户体验导向方案：
  - 插件安装后的 readiness 状态
  - 聊天页“新任务”菜单的 Claude 可用性表达
  - Claude 会话创建后的默认模型自动选择
  - 配置页的明确 CTA 与引导
- 相关设计文档：
  - [Claude Runtime Model Contract Design](../../plans/2026-03-19-claude-runtime-model-contract-design.md)

## 测试/验证/验收方式

- 本次仅触达设计文档与迭代留痕，不涉及代码路径。
- `build / lint / tsc`：
  - 不适用，原因：未修改项目代码、脚本、测试或运行链路配置。
- 文档自检：
  - 确认设计文档路径存在且可读取
  - 确认 README 中已通过 Markdown 链接引用设计文档
  - 确认设计内容覆盖产品流程、能力边界、必要改造项

## 发布/部署方式

- 本次无代码发布、无部署、无 migration。
- 该迭代产物用于后续 Claude runtime 产品化改造的实现依据。

## 用户/产品视角的验收步骤

1. 打开设计文档，确认它回答了“Claude 会话在 NextClaw 中如何选模型、如何判定可用性、用户第一次怎么使用”这三个核心问题。
2. 确认文档不是只讲内部技术兜底，而是明确包含：
   - 插件安装后的 readiness
   - 新任务入口里的 Claude 状态
   - Claude 会话默认模型选择
   - 配置缺失时的 CTA
3. 确认文档明确区分：
   - 什么是已确认能力
   - 什么不能直接承诺
   - 什么必须运行时探测后才能承诺
