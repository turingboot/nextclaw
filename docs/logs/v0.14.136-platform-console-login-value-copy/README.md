# v0.14.136 Platform Console Login Value Copy

## 迭代完成说明

- 调整 `apps/platform-console` 登录页左侧 hero 与三张 highlight 卡文案，不再重复描述“登录/注册怎么操作”的交互流程。
- 将左侧信息改为产品价值表达，突出统一账号、网页远程访问、可撤销分享三类核心价值。
- 同步更新 `scripts/platform-console-smoke.mjs`，让登录页冒烟断言跟随新的中英文文案。

## 测试/验证/验收方式

- `PATH=/opt/homebrew/bin:$PATH pnpm -C apps/platform-console build`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C apps/platform-console lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C apps/platform-console tsc`
- `PATH=/opt/homebrew/bin:$PATH PLATFORM_CONSOLE_BASE_URL=http://127.0.0.1:4173 pnpm smoke:platform:console`
- `PATH=/opt/homebrew/bin:$PATH node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths apps/platform-console/src/i18n/locales/zh-CN.json apps/platform-console/src/i18n/locales/en-US.json scripts/platform-console-smoke.mjs`

## 发布/部署方式

- 本次仅修改平台前端文案与对应冒烟断言。
- 如需上线，执行平台前端现有发布流程：`PATH=/opt/homebrew/bin:$PATH pnpm deploy:platform:console`
- 本次不涉及后端或数据库变更，remote migration 不适用。

## 用户/产品视角的验收步骤

1. 打开 `https://platform.nextclaw.io/` 登录页。
2. 检查左侧主视觉区不再出现“登录使用密码”“注册先验证邮箱”这类流程说明。
3. 确认左侧改为表达产品价值，例如统一账号、网页打开实例、可控分享访问。
4. 切换到 `English` 后，确认英文文案也保持同样的价值表达，而不是注册流程教学。
