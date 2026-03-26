# v0.14.208 Remote Fixed Domain Cache Guard

## 迭代完成说明

- 修复 fixed-domain 远程访问在共享域名 `remote.claw.cool` 下可能复用旧页面壳子的风险。
- `workers/nextclaw-provider-gateway-api` 现在会对 remote access 的 HTML 导航响应统一追加 `Cache-Control: private, no-store, max-age=0, must-revalidate`，并补 `Vary: Cookie`，避免不同实例/不同 session 之间复用错误的 `index.html`。
- `GET /platform/remote/open` 的 302 跳转也同步禁用缓存，避免浏览器复用旧跳转结果后继续落到错误的远程会话页面。
- 这样 fixed-domain 入口在通过实例列表按钮打开时，不会再因为共享 host 的缓存串页而引用到别的实例版本的 `assets/vendor-*.js` 等 chunk。

## 测试/验证/验收方式

- 受影响模块静态验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C workers/nextclaw-provider-gateway-api build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C workers/nextclaw-provider-gateway-api lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C workers/nextclaw-provider-gateway-api tsc`
- 可维护性闸门：
  - `PATH=/opt/homebrew/bin:$PATH node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths workers/nextclaw-provider-gateway-api/src/controllers/remote-controller.ts`
  - 结果：通过，无阻塞项；存在 1 条 near-budget warning，`remote-controller.ts` 当前 506 行，建议后续继续拆分 orchestration / IO / state transition
- 本次未执行真实远程实例冒烟。
  - 原因：当前会话没有现成的可复用 remote access 在线实例与对应浏览器态，无法在不引入额外环境副作用的前提下完成真实 fixed-domain 打开验证

## 发布/部署方式

- 本次未执行发布。
- 如需发布本修复，执行：
  - `PATH=/opt/homebrew/bin:$PATH pnpm deploy:platform:backend`
- 发布后建议立即做 fixed-domain 远程访问回归，重点确认 `remote.claw.cool` 下首次打开、重复打开、切换不同实例打开三条路径。

## 用户/产品视角的验收步骤

1. 在桌面端确保目标实例在线，并已开启 remote access。
2. 打开 `https://platform.nextclaw.io`，进入实例列表。
3. 点击“用固定域名打开”。
4. 浏览器应先进入 `https://remote.claw.cool/platform/remote/open?...`，随后跳转到 fixed-domain 远程页面。
5. 打开浏览器 Network，确认文档响应带有 `Cache-Control: private, no-store, max-age=0, must-revalidate`，且不会再出现错误实例版本的 `assets/vendor-*.js` 资源加载失败。
6. 切换到另一个实例，再次从实例列表点击“用固定域名打开”，页面应加载对应实例内容，而不是复用上一个实例的旧页面壳子。
