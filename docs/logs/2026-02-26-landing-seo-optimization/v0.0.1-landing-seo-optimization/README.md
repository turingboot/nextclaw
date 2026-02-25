# 2026-02-26 v0.0.1-landing-seo-optimization

## 迭代完成说明（改了什么）

- 为 Landing 页面补齐 SEO 基础信息，更新 `apps/landing/index.html`：
- 新增 `theme-color`、`robots`、`author`、`keywords` 元信息。
- 新增 canonical 与 `hreflang`（`en` / `x-default`）。
- 新增 OpenGraph（`og:*`）与 Twitter Card（`twitter:*`）标签。
- 补充 X（Twitter）分享预览细节字段：
- `twitter:url`、`twitter:image:alt`
- `og:image:secure_url`、`og:image:type`、`og:image:width`、`og:image:height`
- 新增 `application/ld+json` 结构化数据（`SoftwareApplication`），声明官网、文档、NPM、代码仓库关系。
- 新增搜索引擎抓取文件：
- `apps/landing/public/robots.txt`
- `apps/landing/public/sitemap.xml`
- 新增 AI 抓取入口文件：
- `apps/landing/public/llm.txt`

## 测试 / 验证 / 验收方式

- 构建与类型检查：
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/landing build`
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/landing tsc`
- 冒烟验证（用户可见）：
- `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/landing preview --host 127.0.0.1 --port 4173`
- `curl -s http://127.0.0.1:4173/ | rg -n "canonical|og:title|twitter:card|application/ld\\+json|robots|theme-color|keywords"`
- `curl -s http://127.0.0.1:4173/ | rg -n "twitter:url|twitter:image:alt|og:image:secure_url|og:image:type|og:image:width|og:image:height"`
- `curl -s http://127.0.0.1:4173/robots.txt`
- `curl -s http://127.0.0.1:4173/sitemap.xml`
- `curl -s http://127.0.0.1:4173/llm.txt`
- 验收点：
- 首页 HTML 包含 canonical、OG、Twitter、JSON-LD、robots 等关键 SEO 标签。
- 首页 HTML 包含 X 分享关键字段（`twitter:url`、`twitter:image:alt`、`og:image:*` 尺寸/类型）。
- `robots.txt` 与 `sitemap.xml` 可直接访问且内容正确。
- `llm.txt` 可直接访问，包含官网、文档、仓库、NPM 与关键导航链接。
- 说明：`@nextclaw/landing` 当前未配置独立 lint 脚本，本次按包级可用校验执行 `build + tsc + 冒烟`。

## 发布 / 部署方式

- 本次仅为前端静态站 SEO 改动，无后端/数据库变更：
- 远程 migration：不适用。
- Landing 部署命令：
- `PATH=/opt/homebrew/bin:$PATH pnpm deploy:landing`
- 若需要走 NPM 发布闭环，继续按项目流程执行：
- `pnpm release:version`
- `pnpm release:publish`

## 用户 / 产品视角的验收步骤

1. 打开 `https://nextclaw.io/`，查看页面源码，确认存在 canonical、OpenGraph、Twitter Card、JSON-LD 标签。
2. 打开 `https://nextclaw.io/robots.txt`，确认可访问且包含 sitemap 地址。
3. 打开 `https://nextclaw.io/sitemap.xml`，确认首页 URL 被收录。
4. 打开 `https://nextclaw.io/llm.txt`，确认可访问并包含项目核心信息。
5. 在社交平台链接预览工具中粘贴首页 URL，确认标题、描述、预览图展示正常。
