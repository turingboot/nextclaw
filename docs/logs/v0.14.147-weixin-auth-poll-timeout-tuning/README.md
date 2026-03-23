# v0.14.147-weixin-auth-poll-timeout-tuning

## 迭代完成说明

- 调整微信扫码登录的状态轮询策略。
- 将 `get_qrcode_status` 在登录流程里的客户端超时从消息长轮询复用的 `35s` 拆开，改为更短的登录专用超时，避免扫码/确认后界面长时间持续转圈、看起来像卡住。
- 扩展微信二维码状态兼容逻辑：
  - 兼容 `scaned` 与 `scanned` 两种“已扫码”状态拼写。
  - 当接口已返回 `bot_token + ilink_bot_id` 时，即使状态字面值不是 `confirmed`，也直接视为授权成功，避免因为上游状态字面值变化而一直卡在等待确认。
- 保持消息通道自身的 `getupdates` 长轮询配置不变，只优化扫码登录体验，不影响正常消息收发。

## 测试/验证/验收方式

- `pnpm -C packages/extensions/nextclaw-channel-plugin-weixin tsc`
- `pnpm -C packages/extensions/nextclaw-channel-plugin-weixin build`
- 运行时校验：
  - 使用 `tsx` 直接调用 `fetchWeixinQrStatus({ timeoutMs: 50 })` 并 mock 一个永不返回的 `fetch`，确认函数会在客户端超时后返回 `{ status: "wait" }`，不再无限等待。
  - 使用 `tsx` 直接调用 `startWeixinLoginSession / pollWeixinLoginSession` 并 mock 微信返回，确认：
    - `status: "scanned"` 会映射为前端可见的 `scanned`
    - `status: "scaned"` 且同时带回 `bot_token + ilink_bot_id` 时，会映射为 `authorized`
- `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths packages/extensions/nextclaw-channel-plugin-weixin/src/weixin-api.client.ts packages/extensions/nextclaw-channel-plugin-weixin/src/weixin-login.service.ts`

## 发布/部署方式

- 本次未执行发布。
- 如需发布，按受影响包流程提升 `@nextclaw/channel-plugin-weixin` 版本并完成联动验证。

## 用户/产品视角的验收步骤

1. 打开微信渠道配置页，点击“扫码连接微信”。
2. 使用微信扫码，并在手机上完成确认。
3. 观察页面状态更新速度，应比之前更快，不再长时间停留在“等待扫码确认”。
4. 若仅扫码未在手机确认，页面继续等待属于预期行为。
