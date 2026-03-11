# v0.13.57-docs-notes-bocha-highlight

## 迭代完成说明（改了什么）
- 修订最新 Notes 文案，显式突出 Bocha（博查）搜索集成。
- 同步更新中英文 Notes 详情标题与正文，确保 `What changed / Why it matters / How to use` 均提及 Bocha。
- 同步更新中英文 Notes 列表页与侧边栏条目标题，保持入口文案与详情一致。

## 测试/验证/验收方式
- 执行：`pnpm --filter @nextclaw/docs build`。
- 结果：构建通过。
- 观察点：
  - `/en/notes/` 与 `/zh/notes/` 列表标题包含 Bocha/博查。
  - 对应详情页标题与正文明确提到 Bocha 集成。

## 发布/部署方式
- 本次为 docs 内容修订，无独立发布流程接入。
- 按文档站流程执行：`pnpm --filter @nextclaw/docs build` 验证后，按需 `pnpm deploy:docs`。

## 用户/产品视角的验收步骤
1. 打开英文 `/en/notes/`，确认最新条目标题包含 `Bocha`。
2. 打开中文 `/zh/notes/`，确认最新条目标题包含 `博查`。
3. 进入中英文详情页，确认变更说明和使用步骤都明确提到 Bocha 集成。
