# v0.13.64 landing download dedicated route

## 迭代完成说明（改了什么）
- 将 Desktop 下载大卡片从官网首页拆分为独立路由：`/en/download/` 与 `/zh/download/`。
- 首页“下载桌面版”按钮改为跳转独立下载页，不再在首页承载下载大卡片内容。
- 导航与语言切换支持路由感知：在下载页切语言仍停留在下载页。
- 新增下载页入口 HTML：
  - `apps/landing/en/download/index.html`
  - `apps/landing/zh/download/index.html`

## 测试/验证/验收方式
- 构建验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/landing build`
- 路由产物验证：
  - 检查 `dist/en/download/index.html` 与 `dist/zh/download/index.html` 存在。
  - 检查打包 JS 中包含 `__NEXTCLAW_ROUTE__` 路由分支逻辑。
- 冒烟验证（页面内容分离）：
  - 首页保留产品介绍模块，不出现下载大卡片。
  - 下载页显示下载大卡片和小白教程。

## 发布/部署方式
- 前端发布：执行 `pnpm deploy:landing`。
- 发布后检查：
  - `https://nextclaw.io/en/download/`
  - `https://nextclaw.io/zh/download/`
  - 首页下载按钮跳转到对应语言下载页。

## 用户/产品视角的验收步骤
1. 打开官网首页，点击“下载桌面版”。
2. 页面应跳转到独立下载页（非首页锚点滚动）。
3. 下载页可见 macOS/Windows 下载入口和小白打开教程。
4. 在下载页切换语言，仍停留在对应语言的下载页。
