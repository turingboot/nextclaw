# 2026-02-23 v0.8.15-frontend-ui-refresh

## 迭代完成说明（改了什么）

- 统一配置页卡片与状态呈现组件（`ConfigCard`、`StatusDot`、`ActionLink`），提升一致性与可维护性。
- 优化配置/运行时/渠道/市场等页面的布局与样式，强化层级与可读性。
- 设计系统样式与基础控件（button/card/input/tabs/select/switch/dialog）完成整体风格对齐。

## 测试 / 验证 / 验收方式

- 工程级验证（规则要求）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm lint`（有历史 max-lines 警告，无错误）
  - `PATH=/opt/homebrew/bin:$PATH pnpm tsc`
- 冒烟测试（非仓库目录）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/ui exec tsx --tsconfig tsconfig.json /tmp/nextclaw-ui-smoke.tsx`
  - 观察点：组件可正常 render，不抛异常（输出 `rendered:731`）。

## 发布 / 部署方式

- NPM 发布按流程执行：[`docs/workflows/npm-release-process.md`](../../../workflows/npm-release-process.md)
  1. `pnpm changeset`
  2. `pnpm release:version`
  3. `pnpm release:publish`
- 执行结果：已发布并打 tag。
  - `@nextclaw/ui@0.5.8`
  - `nextclaw@0.8.15`
  - 受本地未发布版本影响同步发布：
    - `@nextclaw/channel-plugin-discord@0.1.6`
    - `@nextclaw/channel-runtime@0.1.18`
    - `@nextclaw/openclaw-compat@0.1.26`
    - `@nextclaw/server@0.5.9`

## 用户 / 产品视角验收步骤

1. 打开 UI 配置页（Channels / Providers / Runtime / Sessions / Marketplace）。
2. 检查卡片布局与状态展示是否统一、清晰。
3. 验证关键交互（切换、选择、输入）视觉反馈是否一致。
4. 确认整体页面层级与可读性较旧版更清楚。

## 文档影响检查

- 本次为 UI 样式与组件更新，无新增使用方式或行为变化，文档更新不适用。
