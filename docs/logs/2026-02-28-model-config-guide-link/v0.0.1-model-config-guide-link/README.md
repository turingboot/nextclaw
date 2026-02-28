# 2026-02-28 模型配置文档入口与选型指南

## 迭代完成说明（改了什么）

- 在 UI 模型配置页新增“查看模型配置指南”链接，点击后命中内嵌文档拦截逻辑，在侧边栏文档浏览器内打开教程。
- 新增文档章节：
  - `apps/docs/zh/guide/model-selection.md`
  - `apps/docs/en/guide/model-selection.md`
- 文档内容覆盖：模型格式规则、OpenRouter 规则与示例、各 provider 推荐起步模型（截至 2026-02-28）与官方文档链接。
- 补充“可直接复制到 Model 输入框”的模型串清单（例如 `deepseek/deepseek-chat`）。
- 按用户反馈改为“前沿优先”清单：基于官方文档与 OpenRouter 实时模型目录更新为更先进模型（例如 `openrouter/openai/gpt-5.3-codex`、`openrouter/anthropic/claude-opus-4.6`、`openrouter/google/gemini-3.1-pro-preview`）。
- 将新章节加入 docs 侧栏导航，并在配置文档中增加跳转链接。

## 测试 / 验证 / 验收方式

```bash
PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/ui build
PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/docs build
PATH=/opt/homebrew/bin:$PATH pnpm lint
PATH=/opt/homebrew/bin:$PATH pnpm tsc
```

验收点：

- UI `Model` 页面可见“查看模型配置指南”链接。
- 点击链接后，不跳外部页面，右侧内嵌文档浏览器自动打开并进入模型选型指南。
- docs 侧栏可看到“模型选型 / Model Selection”，且中英文页面均可访问。

## 发布 / 部署方式

- 本次仅涉及前端 UI 与文档，无后端接口和数据库变更。
- 按前端与文档常规流程发布：

```bash
# 前端构建（UI）
PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/ui build

# 文档构建并部署（Cloudflare Pages）
PATH=/opt/homebrew/bin:$PATH pnpm deploy:docs
```

- 如需发包，按项目发布流程执行并参考 [docs/workflows/npm-release-process.md](../../../workflows/npm-release-process.md)。

## 用户 / 产品视角验收步骤

1. 打开 NextClaw Web UI，进入 `Model`。
2. 在“默认模型”卡片中点击“查看模型配置指南”。
3. 确认右侧文档侧边栏自动打开，并进入“模型选型指南”。
4. 在指南中按 provider 找到推荐模型与官方链接，复制一个模型 id 回到 UI。
5. 保存模型配置并在对话页发起一次请求，确认模型可正常调用。
