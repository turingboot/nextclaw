# v0.14.113 Remote Token Expiry Status Fix

## 迭代完成说明

- 修复本地 remote access 把任意 `nca.*` token 直接当成“已登录”的问题。
- 新增统一的平台 session token 状态判断，区分 `missing`、`malformed`、`expired`、`valid`。
- `RemoteAccessHost` 现在只有在 token 真实有效时才返回 `account.loggedIn = true`。
- `RemotePlatformClient` 现在会在本地直接拒绝过期或损坏 token，不再继续拿失效 token 去平台注册设备。
- `remote doctor` 现在会明确提示 token 已过期或无效，而不是只看前缀。
- 补充回归测试，覆盖“过期 token 不应被视为已登录”。

## 测试 / 验证 / 验收方式

- `pnpm -C packages/nextclaw-remote tsc`
- `pnpm -C packages/nextclaw-remote lint`
- `pnpm -C packages/nextclaw tsc`
- `pnpm -C packages/nextclaw lint`
- `pnpm -C packages/nextclaw test -- --run src/cli/commands/remote-access-host.test.ts`
- `pnpm -C packages/nextclaw-server test -- --run src/ui/router.remote.test.ts`
- `pnpm -C packages/nextclaw-server build`
- `pnpm -C packages/nextclaw-remote build`
- `pnpm -C packages/nextclaw build`
- `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths packages/nextclaw-remote/src/platform-session-token.ts packages/nextclaw-remote/src/remote-platform-client.ts packages/nextclaw/src/cli/commands/remote-access-host.ts packages/nextclaw/src/cli/commands/remote.ts packages/nextclaw/src/cli/commands/remote-access-host.test.ts`
- 临时脚本验收：
  - 过期 token 下 `RemoteAccessHost.getStatus().account` 返回 `loggedIn: false`
  - 过期 token 下 `RemotePlatformClient.resolveRunContext()` 直接报 `NextClaw platform token expired...`
  - 过期 token 下 `RemoteCommands.getDoctorView()` 返回 `platform-token expired`

## 发布 / 部署方式

- 本次未执行发布或部署。
- 原因：本轮用户要求是本地排查、修复与验证，未要求提交、发版或上线。
- 若后续需要上线，至少需要重新发布 `@nextclaw/remote`、`nextclaw`、`@nextclaw/server` 所在交付物，并基于真实过期 token 场景做一次线上冒烟。

## 用户 / 产品视角的验收步骤

1. 在本地 NextClaw 配置里放入一个已过期的平台 token。
2. 打开本地 UI 的 remote access 页面。
3. 预期不再看到“已登录但远程异常 / 已断开”的误导状态，而是回到需要重新登录的平台账号状态。
4. 运行 `nextclaw remote doctor`。
5. 预期 `platform-token` 检查明确提示 token 已过期，需要重新登录。
6. 重新完成一次平台登录后，再开启 remote access。
7. 预期设备可以重新注册，设备列表里会重新出现本机。
