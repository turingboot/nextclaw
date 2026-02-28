# v0.8.46-deepseek-default-base-no-v1

## 迭代完成说明（改了什么）

根据官方文档核对，DeepSeek 推荐 `base_url` 为 `https://api.deepseek.com`（`/v1` 可兼容但非必须）。

- 将 DeepSeek 默认 `defaultApiBase` 从 `https://api.deepseek.com/v1` 调整为 `https://api.deepseek.com`。

涉及文件：
- [`packages/nextclaw-core/src/providers/registry.ts`](../../../../packages/nextclaw-core/src/providers/registry.ts)

参考来源：
- [DeepSeek API Docs - Your First API Call](https://api-docs.deepseek.com/)
- [DeepSeek API Docs（中文）- 首次调用 API](https://api-docs.deepseek.com/zh-cn/)

## 测试 / 验证 / 验收方式

- 工程验证（仓库级）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm tsc`
- 冒烟验证（规则化断言）：
  - `PATH=/opt/homebrew/bin:$PATH node -e "..."`
  - 结果：`deepseek-default-api-base-ok https://api.deepseek.com`

## 发布 / 部署方式

- 本次仅默认配置修正，不涉及数据库/后端 migration，远程 migration：不适用。
- 如需发布，按既有流程执行：
  1. `pnpm changeset`
  2. `pnpm release:version`
  3. `pnpm release:publish`

## 用户/产品视角的验收步骤

1. 打开 Providers 页面并切换到 DeepSeek。
2. 查看 `API Base URL` 输入框默认值。
3. 验收标准：默认值为 `https://api.deepseek.com`（不带 `/v1`）。
