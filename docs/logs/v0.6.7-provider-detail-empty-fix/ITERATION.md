# v0.6.7-provider-detail-empty-fix

## 迭代完成说明
- 修复前端 Providers 页面在选择“未写入 `config.providers` 的内置提供商”时，右侧详情面板退回空态的问题。
- 根因是左侧列表使用 `config meta` 的全量 provider，而右侧表单强依赖 `config.providers[providerName]` 已存在；重构后这两个数据源未完全对齐。
- 现在 `ProviderForm` 会对缺失配置的 provider 使用默认展示态兜底，仍然展示 API Key、API Base、模型、认证等配置项，并允许首次保存时由后端创建对应配置。

## 测试/验证/验收方式
- 执行 `pnpm -C packages/nextclaw-ui build`：通过。
- 执行 `pnpm -C packages/nextclaw-ui tsc`：通过。
- 执行 `pnpm -C packages/nextclaw-ui lint`：未通过，但失败项为仓库内既有无关问题（`ChatPage`/`useChatStreamController`/`MaskedInput` 等），非本次改动引入。
- 冒烟：启动 UI 后，用浏览器脚本模拟 `/api/config*` 返回仅包含部分已配置 provider 的数据，点击一个未配置的内置 provider，确认右侧仍出现可编辑表单而非空白。

## 发布/部署方式
- 本次为前端 UI 修复。
- 本地确认后可按项目既有流程执行 `pnpm release:frontend`（仅 UI 变更场景）。
- 若本次不立即发布，可随下一个前端版本一并发布；无需 migration。

## 用户/产品视角的验收步骤
- 打开前端的 Providers 页面。
- 切换到“全部提供商”。
- 选择一个尚未配置过的内置 provider（例如 `Qwen Portal`）。
- 预期右侧立即展示该 provider 的配置表单，而不是空白/空态。
- 输入 API Key 或调整 API Base 后点击保存，预期保存成功，后续再次进入该 provider 仍可正常显示。
