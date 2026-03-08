# v0.12.61 desktop-unsigned-docs-internalization

## 迭代完成说明（改了什么）

- 移除对外文档中的无签名桌面安装页面：
  - 删除 `apps/docs/zh/guide/tutorials/desktop-install-unsigned.md`
  - 删除 `apps/docs/en/guide/tutorials/desktop-install-unsigned.md`
- 移除教程索引中的公开入口：
  - `apps/docs/zh/guide/tutorials.md`
  - `apps/docs/en/guide/tutorials.md`
- 新增内部文档 `docs/internal/desktop-install-unsigned.md`，保留团队验证与排查所需的安装放行步骤（macOS / Windows）。

## 测试/验证/验收方式

- 文档双语镜像校验：`pnpm docs:i18n:check`
- 全仓库搜索校验公开入口已移除：
  - `rg -n "desktop-install-unsigned|Unsigned Desktop|无签名安装" apps/docs -S`
- 内部文档存在性校验：
  - `test -f docs/internal/desktop-install-unsigned.md`

## 发布/部署方式

- 本次仅涉及文档内容调整，无需后端迁移、无需应用发布。
- 按常规合并流程发布文档站点即可；内部文档位于仓库 `docs/internal`，不会进入对外站点路由。

## 用户/产品视角的验收步骤

1. 打开对外教程页（中英文）确认不再出现“桌面端无签名安装教程 / Unsigned Desktop Install Guide”入口。
2. 直接访问旧链接 `/zh/guide/tutorials/desktop-install-unsigned` 与 `/en/guide/tutorials/desktop-install-unsigned`，应为无页面状态（404 或等效）。
3. 内部团队在仓库中查看 `docs/internal/desktop-install-unsigned.md`，可获得完整安装放行与排查步骤。
