# v0.14.148-weixin-auth-ui-state-sync

## 迭代完成说明

- 修复微信扫码连接页的“同页状态不一致”问题。
- 当微信渠道配置已经出现已连接账号时，前端扫码卡片会立即退出“等待扫码确认”状态，切换为“已连接”，不再需要重新进入页面才能看到正确结果。
- 保持此前的登录状态兼容修复：
  - 兼容 `scaned` / `scanned`
  - 当接口已经返回 `bot_token + ilink_bot_id` 时直接视为授权成功

## 测试/验证/验收方式

- `pnpm -C packages/nextclaw-ui test -- --run src/components/config/weixin-channel-auth-section.test.tsx src/components/config/ChannelsList.test.tsx`
- `pnpm -C packages/nextclaw-ui tsc`
- `pnpm -C packages/nextclaw-ui build`
- `pnpm -C packages/extensions/nextclaw-channel-plugin-weixin tsc`
- `pnpm -C packages/extensions/nextclaw-channel-plugin-weixin build`
- `tsx` 回归脚本验证：
  - `status: "scanned"` 映射为 `scanned`
  - `status: "scaned"` 且已返回 `bot_token + ilink_bot_id` 映射为 `authorized`
- `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths packages/nextclaw-ui/src/components/config/weixin-channel-auth-section.tsx packages/nextclaw-ui/src/components/config/weixin-channel-auth-section.test.tsx packages/extensions/nextclaw-channel-plugin-weixin/src/weixin-api.client.ts packages/extensions/nextclaw-channel-plugin-weixin/src/weixin-login.service.ts`

## 发布/部署方式

- 本次未执行发布。
- 如需发布，需同步发出前端包与微信插件包，并按真实扫码链路再次验收。

## 用户/产品视角的验收步骤

1. 重启 `pnpm dev start`。
2. 进入 `Channels > Weixin`。
3. 点击“扫码连接微信”，用微信扫码并在手机确认。
4. 保持当前页面不离开，确认状态会自动从“等待扫码确认”切到“已连接”。
5. 不需要重新进入页面即可看到已连接账号。
