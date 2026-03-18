# v0.13.181-ncp-invalid-tool-args-structured-failure

## 迭代完成说明

- 移除 NCP runtime 中“tool args 解析失败后静默降级成 `{}`”的错误做法。
- 现在 tool args 必须严格满足协议要求：解析后必须是 object，且通过 tool schema 校验，才允许执行真实工具。
- 若参数无效：
  - 不执行真实工具
  - 产出结构化 `invalid_tool_arguments` 错误结果
  - 保留 `rawArgumentsText` 作为原始证据
  - 将该错误结果作为 tool result 反馈到下一轮模型上下文
  - assistant tool call 中保留原始错误参数文本，而不是伪造 `{}` 或伪造“修好后的参数”
- 补充集成测试，验证非法参数不会触发真实工具执行，且原始错误参数会被带入下一轮上下文。

## 测试/验证/验收方式

- 运行：
  - `pnpm --filter @nextclaw/ncp build`
  - `pnpm --filter @nextclaw/ncp-agent-runtime build`
  - `pnpm --filter @nextclaw/ncp-toolkit exec vitest run src/agent/in-memory-agent-backend.test.ts`
  - `pnpm --filter @nextclaw/ncp-toolkit build`
- 观察点：
  - `invalid_tool_arguments` 结果中包含 `toolCallId`、`toolName`、`rawArgumentsText`、`issues`
  - 非法参数时真实工具执行次数应为 0
  - 下一轮模型输入中仍保留原始错误参数文本，供模型自我修正

## 发布/部署方式

- 本次涉及 `@nextclaw/ncp`、`@nextclaw/ncp-agent-runtime`、`@nextclaw/ncp-toolkit`。
- 本地 workspace 环境下，重新构建以上包后即可生效。
- 如需正式发布，按 NCP 相关包的常规发布流程进行联动发布。

## 用户/产品视角的验收步骤

- 触发一个会产生非法 tool args 的场景。
- 确认不会再看到“非法参数被默默当成 `{}` 执行”的行为。
- 确认 UI 中 tool result 显示为结构化 invalid args 错误，而不是误导性的工具执行错误。
- 确认后续模型可以拿到该错误结果和原始参数文本继续修正。
