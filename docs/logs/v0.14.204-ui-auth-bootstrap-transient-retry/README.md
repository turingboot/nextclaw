# v0.14.204-ui-auth-bootstrap-transient-retry

## 迭代完成说明

- 保持开发态前端立即启动，不在 `pnpm dev` 的启动链路中增加后端健康拦截。
- 调整 `packages/nextclaw-ui/src/hooks/use-auth.ts` 的首屏认证状态查询策略：当 `GET /api/auth/status` 因启动瞬时网络失败、短暂超时或远程 transport 尚未就绪而失败时，先按短周期自动重试，而不是立刻把页面打进“无法获取认证状态 / Failed to fetch”错误态。
- 只对白屏/启动瞬时失败这类传输层问题做耐受；`Authentication required`、接口契约异常等稳定错误仍然直接暴露，不做隐藏兜底。
- 新增 `packages/nextclaw-ui/src/hooks/use-auth.test.ts`，把这条重试策略固化成可回归验证的单测。

## 测试/验证/验收方式

- 单测：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui test -- --run src/hooks/use-auth.test.ts src/App.test.tsx`
- 语法检查：
  - `PATH=/opt/homebrew/bin:$PATH node --check scripts/dev-runner.mjs`
- 可维护性检查：
  - `PATH=/opt/homebrew/bin:$PATH node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths packages/nextclaw-ui/src/hooks/use-auth.ts packages/nextclaw-ui/src/hooks/use-auth.test.ts`
- `build/lint/tsc`：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc`
  - 本次未执行 `build/lint`；本次问题聚焦于 UI 首屏启动期请求策略，已用针对性单测 + `tsc` 覆盖。

## 发布/部署方式

- 本次无需发布线上服务。
- 若希望该修复在你的本地开发流中生效，拉起最新工作区后直接执行 `pnpm dev` 即可。

## 用户/产品视角的验收步骤

1. 执行 `pnpm dev`，确认前端地址仍然会立即出现，不会等待后端健康后才启动。
2. 在后端刚启动、接口尚未完全就绪的短暂窗口内打开前端。
3. 页面不应立刻显示“无法获取认证状态 / Failed to fetch”错误态，而应在短暂等待后自动恢复。
4. 若后端持续不可用或返回稳定错误，页面仍应明确展示错误信息，而不是无限隐藏问题。
