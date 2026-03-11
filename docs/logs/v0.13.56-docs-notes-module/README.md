# v0.13.56-docs-notes-module

## 迭代完成说明（改了什么）
- 在文档站新增 `Notes` 模块（中英双语）：
  - 英文：`/en/notes/`
  - 中文：`/zh/notes/`
- 在导航栏新增入口：
  - English: `Notes`
  - 中文：`更新笔记`
- 新增首条 Note（中英双语），结构采用固定四段：`What changed`、`Why it matters`、`How to use`、`Links`。
- 在中英文首页新增 `Notes` 入口按钮，提升发现率。
- 本次未新增脚手架命令，未接入发布流程自动化。

## 测试/验证/验收方式
- 运行文档站构建验证：`pnpm --filter @nextclaw/docs build`。
- 人工检查点：
  - 顶部导航可进入 `/en/notes/` 与 `/zh/notes/`。
  - Notes 列表可进入详情页。
  - 中英详情页均包含四段式内容。
- 不适用项：`build/lint/tsc` 全量仓库验证不适用（本次仅 docs 站内容与导航改动）。

## 发布/部署方式
- 按现有文档站流程发布：
  - 本地验证：`pnpm --filter @nextclaw/docs build`
  - 部署命令（如需）：`pnpm deploy:docs`
- 本次仅实现能力，不绑定发布流程自动生成。

## 用户/产品视角的验收步骤
1. 打开文档站英文首页，点击 `Notes`，进入 `/en/notes/`。
2. 打开文档站中文首页，点击 `更新笔记`，进入 `/zh/notes/`。
3. 分别进入首条 Note，确认能看到：`What changed`、`Why it matters`、`How to use`、`Links`。
4. 验证首页新增入口按钮可直接跳转到对应语言的 Notes 列表页。
