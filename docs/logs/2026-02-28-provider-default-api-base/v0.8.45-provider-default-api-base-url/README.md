# v0.8.45-provider-default-api-base-url

## 迭代完成说明（改了什么）

本次迭代实现“每个 Provider 都有默认 API Base URL”，并在 UI 中统一以 `API Base URL` 命名展示。

- 补齐所有 provider 的 `defaultApiBase`（不再有空值）：
  - `anthropic`: `https://api.anthropic.com`
  - `openai`: `https://api.openai.com/v1`
  - `deepseek`: `https://api.deepseek.com/v1`
  - `gemini`: `https://generativelanguage.googleapis.com/v1beta/openai`
  - `zhipu`: `https://open.bigmodel.cn/api/paas/v4`
  - `dashscope`: `https://dashscope.aliyuncs.com/compatible-mode/v1`
  - `vllm`: `http://127.0.0.1:8000/v1`
  - `groq`: `https://api.groq.com/openai/v1`
- 前端文案从 `API Base` 调整为 `API Base URL`。

涉及文件：
- [`packages/nextclaw-core/src/providers/registry.ts`](../../../../packages/nextclaw-core/src/providers/registry.ts)
- [`packages/nextclaw-ui/src/lib/i18n.ts`](../../../../packages/nextclaw-ui/src/lib/i18n.ts)

## 测试 / 验证 / 验收方式

- 工程验证（仓库级）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm tsc`
- 规则化冒烟（默认 base 覆盖检查）：
  - `PATH=/opt/homebrew/bin:$PATH node -e "..."`
  - 结果：`default-api-base-smoke-ok 12`（12 个 provider 全部有默认 `defaultApiBase`）
- 前端运行态冒烟：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui preview --host 127.0.0.1 --port 4177`
  - `curl http://127.0.0.1:4177/` 与 `curl http://127.0.0.1:4177/providers`
  - 结果：均返回 `200`

## 发布 / 部署方式

- 本次变更为 Provider 默认配置与 UI 文案，不涉及数据库/后端 migration，远程 migration：不适用。
- 如需发布包，按项目流程执行：
  1. `pnpm changeset`
  2. `pnpm release:version`
  3. `pnpm release:publish`

## 用户/产品视角的验收步骤

1. 打开 Providers 页面，切换任意 provider。
2. 确认右侧字段名称为 `API Base URL`。
3. 对每个 provider 观察 `API Base URL` 输入框，确认都有预置默认值。
4. 点击“恢复默认”，确认该字段回到该 provider 的默认 URL。
5. 切换不同 provider，确认默认 URL 随 provider 变化。
6. 验收标准：所有 provider 都有默认 API Base URL，命名统一清晰。
