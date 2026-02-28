# v0.8.49-non-gateway-default-api-base

## 迭代完成说明（改了什么）

修复本地 Nextclaw 在 DeepSeek 场景下错误回落到 OpenAI Base URL 的问题。

根因：
- `getApiBase()` 仅对 `isGateway` provider 回退 `defaultApiBase`。
- DeepSeek 属于非网关 provider，且当 `providers.deepseek.apiBase` 未显式保存时，运行时拿到 `null`，最终走 OpenAI 默认地址，触发 OpenAI 401。

修复：
- 将 `getApiBase()` 的默认回退从“仅网关 provider”改为“任意 provider 只要定义了 `defaultApiBase` 就回退使用”。
- 新增回归测试覆盖：
  - 非网关 provider（DeepSeek）在未显式设置 `apiBase` 时，应使用默认 `https://api.deepseek.com`。
  - 显式设置自定义 `apiBase` 时优先使用自定义值。

涉及文件：
- [`packages/nextclaw-core/src/config/schema.ts`](../../../../packages/nextclaw-core/src/config/schema.ts)
- [`packages/nextclaw-core/src/config/schema.provider-routing.test.ts`](../../../../packages/nextclaw-core/src/config/schema.provider-routing.test.ts)

## 测试 / 验证 / 验收方式

- 单测：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-core test -- --run src/config/schema.provider-routing.test.ts`
- 工程验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm tsc`
- 规则化冒烟：
  - `PATH=/opt/homebrew/bin:$PATH node -e "import { ConfigSchema, getApiBase } from './packages/nextclaw-core/dist/index.js'; const cfg=ConfigSchema.parse({providers:{deepseek:{apiKey:'sk-demo'}}}); console.log(getApiBase(cfg,'deepseek-chat'));"`
  - 预期输出：`https://api.deepseek.com`

## 发布 / 部署方式

- 本次为 core 路由逻辑修复，不涉及数据库 migration，远程 migration：不适用。
- 若需发布，按项目既有流程：
  1. `pnpm changeset`
  2. `pnpm release:version`
  3. `pnpm release:publish`

## 用户/产品视角的验收步骤

1. 在 Providers 中配置 DeepSeek API Key（`providers.deepseek`）。
2. 不手动填写 DeepSeek 的 `API Base URL`（保持默认）。
3. 使用 DeepSeek 模型发起一次对话。
4. 验收标准：请求不再错误发往 OpenAI；不再出现 `Incorrect API key provided ... platform.openai.com` 的 401。
