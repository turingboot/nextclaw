# v0.14.197-remote-auth-bootstrap-failure-state

## 迭代完成说明

- 继续收敛远程访问的“白屏 / 无限加载”问题，但这次不改 `remote-transport` 主设计，仍保持普通远程请求走 WebSocket multiplex 主链路。
- 在 `packages/nextclaw-ui/src/App.tsx` 为首屏 `AuthGate` 新增明确的启动失败态：当远程页面首个 `auth-status` 请求失败时，不再继续停留在近似白屏的 fallback，而是直接展示可见错误信息和手动重试按钮。
- 在 `packages/nextclaw-ui/src/api/config.ts` 为 `fetchAuthStatus()` 加入 `5s` 启动超时；同时把 `packages/nextclaw-ui/src/hooks/use-auth.ts` 中的 `useAuthStatus()` 自动重试从 `3` 次调整为 `0` 次，避免启动阶段长时间重复重试，把页面锁死在空白态。
- 扩展 `packages/nextclaw-ui/src/transport/transport.types.ts`、`packages/nextclaw-ui/src/api/client.ts`、`packages/nextclaw-ui/src/transport/local.transport.ts`、`packages/nextclaw-ui/src/transport/remote.transport.ts`，让请求级 `timeoutMs` 可以显式下发到 transport，而不是只能依赖全局默认超时。
- 这次修复解决的是“首屏失败不可见、失败反馈太慢”的产品缺陷。即使真实根因来自认证桥、旧 connector、失效 session 或环境差异，用户也不该继续看到白屏。

## 测试/验证/验收方式

- 浏览器实测真实链接（无认证上下文）：
  - `https://r-c65507cb-88c1-49e7-af22-3a28bc978528.claw.cool/chat/sid_bmNwLW1uNjNkcjBsLTRpMHNpbTVv`
  - 结果是顶层导航直接返回 `404`，正文为 `Remote access session not found.`；说明我本地未复现到“带认证 cookie 后的真实白屏”，但确认了无 cookie 直开并不是正常可用链路。
- 单测：
  - `pnpm -C packages/nextclaw-ui test -- --run src/App.test.tsx src/api/client.test.ts src/transport/remote.transport.test.ts src/transport/app-client.test.ts`
- 类型检查：
  - `pnpm -C packages/nextclaw-ui tsc`
- 构建验证：
  - `pnpm -C packages/nextclaw-ui build`
- 可维护性自检：
  - `node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths packages/nextclaw-ui/src/App.tsx packages/nextclaw-ui/src/App.test.tsx packages/nextclaw-ui/src/api/client.ts packages/nextclaw-ui/src/api/config.ts packages/nextclaw-ui/src/hooks/use-auth.ts packages/nextclaw-ui/src/transport/local.transport.ts packages/nextclaw-ui/src/transport/remote.transport.ts packages/nextclaw-ui/src/transport/transport.types.ts packages/nextclaw-ui/src/api/client.test.ts packages/nextclaw-ui/src/transport/remote.transport.test.ts`
- 当前可维护性提示：
  - `packages/nextclaw-ui/src/api/config.ts` 仍高于预算。
  - `packages/nextclaw-ui/src/transport/remote.transport.ts` 接近预算。

## 发布/部署方式

- 本次未自动发布。
- 若要让线上远程白屏修复真正生效，至少需要发布包含最新 `@nextclaw/ui` 的产物。
- 若同时要覆盖“已失效 remote session 顶层导航不再纯白页”的修复，则还需要一并部署 `workers/nextclaw-provider-gateway-api` 的最新 worker 代码。

## 用户/产品视角的验收步骤

1. 用远程访问链接进入聊天页，尤其是曾经会白屏或长时间空白的场景。
2. 如果远程链路正常，页面应继续正常加载，不受这次改动影响。
3. 如果远程首屏认证状态请求失败，不应再长时间白屏；应在短时间内看到明确错误信息和“重试”按钮。
4. 点击“重试”，确认页面会重新尝试启动，而不是卡死。
5. 如仍失败，继续结合浏览器控制台、remote relay 日志和本地 NextClaw 版本，排查是否存在旧 connector、auth bridge 不匹配或 session/cookie 失效问题。
