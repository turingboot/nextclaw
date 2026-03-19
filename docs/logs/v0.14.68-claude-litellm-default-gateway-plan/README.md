# v0.14.68-claude-litellm-default-gateway-plan

## 迭代完成说明

- 在 Claude runtime 模型契约设计文档基础上，进一步把方案从“能力边界说明”收敛为“激进落地方案”。
- 明确将 `LiteLLM` 定为 Claude 会话的默认推荐 gateway，而不是继续停留在“可选 gateway 示例”。
- 补充了新安装用户的默认推荐路径与 LiteLLM 使用步骤，明确产品应引导用户：
  - 安装 Claude 插件
  - 使用 LiteLLM 作为 Claude gateway
  - 在 Providers 中配置 `apiBase/apiKey/models`
  - 回到聊天页直接创建 Claude 会话
- 补充了面向产品体验的关键要求：
  - Marketplace 插件卡片 readiness
  - 聊天页“新任务”菜单状态
  - Claude 会话默认模型自动选择
  - 设置页对 LiteLLM / gateway 的任务导向提示
- 相关设计文档：
  - [Claude Runtime Model Contract Design](../../plans/2026-03-19-claude-runtime-model-contract-design.md)

## 测试/验证/验收方式

- 本次仅触达设计文档与迭代留痕，不涉及代码路径。
- `build / lint / tsc`：
  - 不适用，原因：未修改项目代码、脚本、测试或运行链路配置。
- 文档自检：
  - 确认方案文档存在且可读取
  - 确认迭代 README 通过 Markdown 链接引用方案文档
  - 确认方案文档已覆盖：
    - LiteLLM 作为默认推荐 gateway
    - 新安装用户的默认使用路径
    - Claude 会话的产品级体验要求
    - 最小闭环实施建议

## 发布/部署方式

- 本次无代码发布、无部署、无 migration。
- 该迭代产物用于后续 Claude gateway / Claude 会话产品化改造的实施依据。

## 用户/产品视角的验收步骤

1. 打开方案文档，确认它不再只是描述 capability 和兜底逻辑，而是明确给出默认推荐路径。
2. 确认文档已经把 `LiteLLM` 写成 Claude 会话的默认推荐 gateway。
3. 确认文档写清楚了新用户如何在现有 NextClaw 页面中完成 Claude 会话的接入与使用。
4. 确认文档写清楚了后续实现必须补的产品改造，而不是只讲后台探测机制。
