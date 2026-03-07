# v0.12.38-docs-feature-en-align-and-deploy

## 1) 迭代完成说明（改了什么）

本次在文档站 `apps/docs` 范围内完成「功能」模块英文化对齐，保持与中文同一叙事结构（能力优先、命令可选）：

- `apps/docs/en/guide/channels.md`
- `apps/docs/en/guide/cron.md`
- `apps/docs/en/guide/secrets.md`
- `apps/docs/en/guide/sessions.md`
- `apps/docs/en/guide/tools.md`

对齐原则：

- 功能页先说明“用户能做什么 + 推荐操作顺序”。
- 命令行从主内容下沉为“Advanced Entry (Optional)”参考入口。
- 保留进阶链接到 `Commands` 页面，避免影响高级用户。

## 2) 测试/验证/验收方式

已执行：

- `pnpm -C apps/docs build`：通过
- `pnpm lint`：通过（仓库既有 warning，无 error）
- `pnpm tsc`：通过

## 3) 发布/部署方式

已执行文档站发布：

- `pnpm deploy:docs`
- 预览地址：`https://8106f02b.nextclaw-docs.pages.dev`

## 4) 用户/产品视角的验收步骤

1. 打开英文侧边栏 `Features` 下 5 个页面，确认不再以命令示例为主。
2. 确认页面结构统一为“能力说明 + 新手路径 + 进阶入口”。
3. 点击 `Commands` 链接，确认高级命令仍可查。
4. 打开发布预览链接，检查英文页面渲染与跳转正常。
