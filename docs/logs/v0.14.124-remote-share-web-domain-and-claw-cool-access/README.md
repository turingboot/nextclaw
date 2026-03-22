# v0.14.124 Remote Share Web Domain And Claw Cool Access

## 迭代完成说明

- 修正远程实例分享的公开入口边界：分享链接现在明确落到 `https://platform.nextclaw.io/share/<grantToken>`，不再由 `ai-gateway-api.nextclaw.io` 承载页面访问。
- 平台用户站新增 `SharePage` 与 Pages SPA `_redirects`，保证分享链接直接打开和刷新后都能继续命中同一个页面入口。
- 后端删除旧的 `GET /platform/share/:grantToken` 页面式跳转接口，改为 `POST /platform/share/:grantToken/open` 返回结构化会话信息；`ai-gateway-api.nextclaw.io` 对该旧页面路径现在返回 `404`。
- 远程访问入口从 API 域名拆出到独立访问域名 `https://remote.claw.cool`，用户打开远程实例时不再落到 API 域名。
- 修复 `scripts/remote-relay-hibernation-smoke.mjs`，使其验证新的 share-open API 契约，而不是已删除的旧跳转路径。
- 继续沿用“实例 instance”为主术语，不再把分享和访问入口暴露成 device 语义。
- 设计文档参考：[Remote Instance Sharing Design](/Users/tongwenwen/Projects/Peiiii/nextclaw/docs/plans/2026-03-22-nextclaw-remote-instance-sharing-design.md)

## 测试/验证/验收方式

- `pnpm -C workers/nextclaw-provider-gateway-api build`
- `pnpm -C workers/nextclaw-provider-gateway-api lint`
- `pnpm -C workers/nextclaw-provider-gateway-api tsc`
- `pnpm -C apps/platform-console build`
- `pnpm -C apps/platform-console lint`
- `pnpm -C apps/platform-console tsc`
- `node scripts/remote-relay-hibernation-smoke.mjs`
- `curl -s -o /tmp/platform-share.html -w '%{http_code}\n' https://platform.nextclaw.io/share/test-token`
- `curl -s -o /tmp/api-share-get.out -w '%{http_code}\n' https://ai-gateway-api.nextclaw.io/platform/share/test-token`
- `curl -s -X POST -o /tmp/api-share-open.out -w '%{http_code}\n' https://ai-gateway-api.nextclaw.io/platform/share/test-token/open`
- `curl -s -o /tmp/remote-health.out -w '%{http_code}\n' https://remote.claw.cool/health`

## 发布/部署方式

- 后端无需 migration；直接执行 `pnpm -C workers/nextclaw-provider-gateway-api run deploy`
- 平台用户站执行 `pnpm deploy:platform:console`
- 本次线上部署结果：
  - Worker version id: `9b820e09-7dc3-478e-b677-e8040e493c3f`
  - Platform console preview: `https://98169960.nextclaw-platform-console.pages.dev`
- npm 发包沿用上一轮已完成 version 的 pending release，随后执行正式 publish 闭环

## 用户/产品视角的验收步骤

1. 在桌面端登录 NextClaw Account，并确保远程实例在线。
2. 打开 `platform.nextclaw.io`，在“我的实例”里创建分享链接。
3. 复制得到的链接，应为 `https://platform.nextclaw.io/share/...`，而不是 `ai-gateway-api.nextclaw.io`。
4. 在浏览器直接打开该分享链接，并刷新页面；页面应继续停留在分享打开流程，而不是 404。
5. 分享页继续进入远程实例后，浏览器访问域名应落在 `remote.claw.cool`，而不是 API 域名。
6. 撤销分享链接后，之前通过该链接打开的共享会话应立即失效。

## 红区触达与减债记录

### workers/nextclaw-provider-gateway-api/src/controllers/remote-controller.ts

- 本次是否减债：是
- 说明：移除了 API 域名上的分享页面跳转路径，收敛为结构化 share-open API，并把错误边界显式化，减少了“API 域名兼任页面入口”的职责混杂。
- 下一步拆分缝：把 share grant 相关 handler 从 `remote-controller.ts` 继续拆到独立 `remote-share.controller.ts`，把 owner-open / share-open / proxy 三类职责彻底分开。
