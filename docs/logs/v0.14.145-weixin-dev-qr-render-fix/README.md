# v0.14.145-weixin-dev-qr-render-fix

## 迭代完成说明

- 修复微信渠道在前端配置页内无法稳定展示二维码的问题。
- 将微信扫码卡片从“直接加载微信返回的外链图片”改为“前端本地生成二维码 data URL”，避免被微信图片响应头或防盗链策略拦截。
- 保留“新窗口打开二维码”作为辅助入口，便于异常场景兜底。
- 修正 `pnpm dev start` 的开发体验：dev 后端不再托管可能过期的静态前端；当端口回退时，明确提示默认端口上可能还是旧实例，减少验收误判。

## 测试/验证/验收方式

- `pnpm -C packages/nextclaw-ui test -- --run src/components/config/ChannelsList.test.tsx`
- `pnpm -C packages/nextclaw-ui tsc`
- `pnpm -C packages/nextclaw-ui build`
- `pnpm -C packages/nextclaw test -- --run src/cli/utils.ui-static-dir.test.ts`
- `pnpm -C packages/nextclaw tsc`
- `node --check scripts/dev-runner.mjs`
- `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths scripts/dev-runner.mjs packages/nextclaw/src/cli/utils.ts packages/nextclaw/src/cli/utils.ui-static-dir.test.ts packages/nextclaw-ui/src/components/config/weixin-channel-auth-section.tsx packages/nextclaw-ui/src/components/config/ChannelsList.test.tsx packages/nextclaw-ui/src/qrcode.d.ts`
- 真实冒烟：
  - `NEXTCLAW_HOME=$(mktemp -d /tmp/nextclaw-weixin-ui-smoke.XXXXXX) NEXTCLAW_DEV_BACKEND_PORT=18820 NEXTCLAW_DEV_FRONTEND_PORT=5180 pnpm dev start`
  - `POST http://127.0.0.1:18820/api/config/channels/weixin/auth/start` 返回二维码会话。
  - Playwright 打开 `http://127.0.0.1:5180/channels`，点击微信扫码后校验页面二维码 `src` 为 `data:image/...`，确认前端内嵌展示成功。

## 发布/部署方式

- 本次未执行发布或部署。
- 如需发布，按现有流程执行受影响包版本变更、`release:version`、`release:publish`，并复验微信渠道配置页扫码展示与 `pnpm dev start` 开发链路。

## 用户/产品视角的验收步骤

1. 执行 `pnpm dev start`，打开终端打印的前端地址。
2. 进入 `Channels`，选择 `Weixin`。
3. 点击“扫码连接微信”。
4. 确认页面卡片内直接显示二维码，而不是破图。
5. 使用微信扫码，并确认“新窗口打开二维码”链接仍可作为备用入口。
