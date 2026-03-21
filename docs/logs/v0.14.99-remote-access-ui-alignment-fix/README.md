# v0.14.99-remote-access-ui-alignment-fix

相关方案：

- [账号登录与远程访问产品设计](../../plans/2026-03-21-nextclaw-account-and-remote-access-product-design.md)
- [远程访问整体执行计划](../../plans/2026-03-21-nextclaw-remote-access-overall-execution-plan.md)

## 迭代完成说明

- 根据真实界面反馈，重新收敛远程访问页面，移除偏离项目既有风格的深色 Hero 设计，改回与现有设置页一致的浅色卡片风格。
- 删除主流程里残留的“高级设置 / 诊断 / 服务控制”旧心智入口，远程访问页只保留用户必要信息：账号、设备、连接状态、开启/关闭动作、前往设备列表入口。
- 在远程访问主页面与账号面板中都补上“查看我的设备”入口，直接通往 NextClaw Platform 的设备列表页。
- 对“已断开”状态增加直白提示：若本地服务没运行会明确提示；若平台侧主动断开且没有错误文本，会给出平台中继/登录态/云端配额等可能原因说明。
- 调整设置侧边栏账号入口样式，使其回到项目既有侧边栏语言与视觉体系，不再出现突兀的大卡片样式。

## 测试/验证/验收方式

- 代码验证：
  - `pnpm -C packages/nextclaw-ui tsc`
  - `pnpm -C packages/nextclaw-ui build`
  - `pnpm -C packages/nextclaw-ui lint`
  - `pnpm -C packages/nextclaw build`
- 运行态冒烟：
  - 在隔离目录启动实例：
    - `NEXTCLAW_HOME=/tmp/nextclaw-remote-access-smoke node packages/nextclaw/dist/cli/index.js serve --ui-port 18822`
  - 使用 Playwright 打开 `http://127.0.0.1:18822/remote`
  - 观察点：
    - 页面存在“查看我的设备”
    - 页面不存在“高级设置”
    - 页面主区域为浅色卡片，不再是上一版的深色 Hero
- 可维护性检查：
  - `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths <本次触达文件>`

## 发布/部署方式

- NPM 发布：
  - 新增 changeset，覆盖 `@nextclaw/ui`、`nextclaw`，并按发布组联动 `@nextclaw/mcp`、`@nextclaw/server`
  - 执行 `pnpm release:version`
  - 执行 `pnpm release:publish`
- 本次未触达平台 console 代码，不需要重新部署 `deploy:platform:console`

## 用户/产品视角的验收步骤

1. 设置侧边栏底部的账号入口应与主题/语言行保持同一风格，不再出现突兀的大白卡。
2. 进入“远程访问”页面后，只看到必要信息和必要动作，不再看到旧的高级操作混在主路径里。
3. 登录后，无论当前是否已连接，都可以直接点击“查看我的设备”进入平台设备列表页。
4. 如果页面显示“已断开”，页面会同时给出更直白的提示，不再只显示一个结论而不给任何方向。
