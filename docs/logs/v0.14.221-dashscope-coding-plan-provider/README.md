# v0.14.221-dashscope-coding-plan-provider

## 迭代完成说明

- 在 NextClaw 内置 provider catalog 中新增 `dashscope-coding-plan` provider，明确区分普通 `dashscope` 与阿里云 DashScope Coding Plan。
- 为 `dashscope-coding-plan` 提供独立的显示名、模型前缀、默认 API Base、默认模型列表、视觉模型列表，以及 `sk-sp-` / `coding.dashscope.aliyuncs.com` 检测规则。
- 将服务端 Provider 列表排序补入 `dashscope-coding-plan`，确保 UI 中以独立 provider 形态暴露。
- 新增回归测试，覆盖 provider meta 暴露与 `dashscope-coding-plan/<model>` 路由解析。
- 将新增 provider 规格拆分到独立模块，避免继续推高 `builtin.ts` 文件体积。

## 测试/验证/验收方式

- 运行 `pnpm -C packages/nextclaw-server exec vitest run src/ui/router.provider-test.test.ts`
- 运行 `pnpm -C packages/nextclaw-core exec vitest run src/config/schema.provider-routing.test.ts`
- 运行 `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths packages/nextclaw-runtime/src/providers/plugins/builtin.ts packages/nextclaw-runtime/src/providers/plugins/dashscope-coding-plan.ts packages/nextclaw-server/src/ui/config.ts packages/nextclaw-server/src/ui/router.provider-test.test.ts packages/nextclaw-core/src/config/schema.provider-routing.test.ts`

## 发布/部署方式

- 本次为仓库代码改动，按正常 NextClaw 发布流程进入后续版本发布。
- 若仅本地验证，可在包含 UI 配置页的运行环境中重启对应 NextClaw 服务，使最新 provider meta 生效。

## 用户/产品视角的验收步骤

1. 打开 NextClaw 配置页的 Provider 列表。
2. 确认能看到独立的 `DashScope Coding Plan` provider，而不是复用普通 `DashScope` 名称。
3. 打开该 provider，确认默认 API Base 为 `https://coding.dashscope.aliyuncs.com/v1`，默认模型列表包含 `qwen3.5-plus`、`qwen3-coder-next`、`glm-5`、`kimi-k2.5` 等模型。
4. 填入 `sk-sp-` 开头的 Coding Plan 专属 API Key 后保存。
5. 选择 `dashscope-coding-plan/qwen3.5-plus` 等模型进行一次 provider 连接测试或实际对话，确认路由落到 Coding Plan provider，而不是普通 `dashscope`。

## 红区触达与减债记录

### packages/nextclaw-server/src/ui/config.ts

- 本次是否减债：否
- 说明：本次仅在 provider 排序常量中插入 `dashscope-coding-plan`，并同步压缩数组写法，避免继续放大红区文件体积；未进一步拆分 `config.ts` 的职责边界。
- 下一步拆分缝：先按 provider 配置视图、search 配置视图、session 配置视图三个域拆出独立构建模块，再让 `config.ts` 只保留聚合与编排。
