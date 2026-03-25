# v0.14.193-remote-ws-request-timeout-guard

## 迭代完成说明

- 保留 `packages/nextclaw-ui/src/transport/remote.transport.ts` 的远程浏览器普通请求主链路为 WebSocket multiplex，不再把普通 `/api/*` 请求切到 HTTP 代理主路径。
- 为远程普通请求新增明确的 client-side timeout 守卫：当浏览器已经连上远程 ws、但某个 request frame 长时间拿不到 `response/request.error` 时，不再无限 pending，而是以清晰错误结束。
- 这个改动直接针对“固定域名打开后，左侧边栏一直停在加载会话中...”的坏体验，把不可预测的无限 loading 收敛成可失败、可观测、可继续排查的行为。
- 新增远程访问失效页渲染逻辑：当浏览器顶层导航命中已失效/不存在的 remote session 时，不再返回白底纯文本，而是返回明确的 HTML 错误页，说明“session 不存在 / 已过期 / 已撤销”并引导返回 NextClaw Web。
- 这个改动只作用于浏览器顶层导航请求；程序请求和普通 API/协议响应仍保持原有机器可读语义，不把 HTML 混入接口链路。
- 新增 `packages/nextclaw-ui/src/transport/remote.transport.test.ts`，覆盖：
  - 普通请求继续走远程 ws multiplex，而不是退回 HTTP。
  - request frame 长时间无返回时，会按超时明确失败。
- 当前判断：
  - 本次修复解决的是“前端无限等待”的可预测性问题。
  - 固定域名场景下 request frame 为何未返回，仍值得继续做更深的链路排查。
- 可维护性备注：
  - `packages/nextclaw-ui/src/transport/remote.transport.ts` 当前 384 行，已接近 400 行预算。
  - 下一步拆分缝：将“请求超时/挂起治理”“连接管理”“frame 分发与解包”拆成更小模块。

## 测试/验证/验收方式

- 单测：
  - `pnpm -C packages/nextclaw-ui test -- --run src/transport/remote.transport.test.ts src/transport/app-client.test.ts`
- 类型检查：
  - `pnpm -C packages/nextclaw-ui tsc`
- Worker 类型检查：
  - `pnpm -C workers/nextclaw-provider-gateway-api tsc`
- 构建验证：
  - `pnpm -C packages/nextclaw-ui build`
- 错误页渲染验证：
  - `node -e` / 本地脚本直接调用 `renderRemoteAccessErrorPage(...)`，确认返回 `text/html; charset=utf-8`
- 可维护性自检：
  - `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths packages/nextclaw-ui/src/transport/remote.transport.ts packages/nextclaw-ui/src/transport/remote.transport.test.ts`
- 可维护性自检（worker）：
  - `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths workers/nextclaw-provider-gateway-api/src/controllers/remote-controller.ts workers/nextclaw-provider-gateway-api/src/remote-access-error-page-renderer.ts`
- 验收关注点：
  - 固定域名远程页面不应再无限显示“加载会话中...”。
  - 若远程 request frame 异常丢失或未返回，页面应转为明确失败，而不是持续 pending。
  - 若用户打开的是已失效 remote session，不应再看到白页式纯文本，而应看到可理解的错误页。

## 发布/部署方式

- 本次未自动发布。
- 如需上线该修复，重新构建并发布包含 `@nextclaw/ui` 的最新产物。
- 若发布的是 `nextclaw` CLI / 内置 UI 产物，需同步刷新 `ui-dist` 后再走既有发布流程。

## 用户/产品视角的验收步骤

1. 通过固定域名打开某个远程实例。
2. 进入聊天页，观察左侧会话栏：
   - 正常时应完成加载并展示会话列表。
   - 异常时不应无限 loading，而应在超时后转为明确失败。
3. 继续验证聊天页其它依赖普通 query 的初始化请求，确认不会长期卡死。
4. 打开一个已失效或已过期的 remote session 链接，确认页面显示明确错误说明，而不是白底纯文本。
5. 如需继续根因排查，再结合浏览器网络面板和远程 relay 日志查看是否存在 request frame 发出后未返回的链路问题。
