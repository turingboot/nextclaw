# v0.14.148-settings-account-entry-neutral-tone

## 迭代完成说明

- 将设置侧栏中的账号入口恢复为此前更稳妥的双行信息结构。
- 在恢复结构的同时，去掉此前显得过重的强调样式，使它和主题、语言、帮助文档等底部项保持同一套中性视觉语气：
  - 图标恢复为统一灰色，不再使用特殊状态色。
  - 主标题不再使用更重、更深的强调写法，改为和其它底部项一致的中性色与权重。
  - 保留副标题状态信息，但仅作为辅助说明，不再抢占视觉重心。
- 同步移除了上一轮为单行账号项引入的额外状态文案键。
- 补充测试，确认账号入口继续存在且使用中性样式：
  - [`packages/nextclaw-ui/src/components/layout/sidebar.layout.test.tsx`](../../../packages/nextclaw-ui/src/components/layout/sidebar.layout.test.tsx)

## 测试 / 验证 / 验收方式

- 单测：
  - `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/ui test -- src/components/layout/sidebar.layout.test.tsx`
- 类型检查：
  - `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/ui tsc`
- 构建验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/ui build`
- 定向 lint：
  - `PATH=/opt/homebrew/bin:$PATH pnpm exec eslint src/components/layout/Sidebar.tsx src/components/layout/sidebar.layout.test.tsx src/lib/i18n.remote.ts`
- 可维护性自检：
  - `PATH=/opt/homebrew/bin:$PATH node .codex/skills/post-edit-maintainability-guard/scripts/check-maintainability.mjs --paths packages/nextclaw-ui/src/components/layout/Sidebar.tsx packages/nextclaw-ui/src/components/layout/sidebar.layout.test.tsx packages/nextclaw-ui/src/lib/i18n.remote.ts`

## 发布 / 部署方式

- 本次为前端 UI 微调，无需数据库 migration 或后端发布。
- 按现有前端/桌面应用正常发布流程携带本次构建产物发布即可。

## 用户 / 产品视角的验收步骤

1. 打开设置界面，定位侧栏底部的账号入口区域。
2. 确认账号入口恢复为双行信息结构，而不是单行紧凑版。
3. 确认账号入口图标颜色与其它底部项一致，不再出现特殊强调色。
4. 确认标题文字权重与其它底部项保持一致，没有额外加重。
5. 确认点击账号入口后仍能正常打开账号与设备相关面板。
