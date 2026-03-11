# 迭代完成说明

- 搜索渠道设置页新增搜索 provider“激活/已激活”状态，支持同时激活多个搜索 provider。
- 保留单一默认搜索 provider 语义，并新增 `search.enabledProviders` 配置用于持久化已激活 provider 集合。
- 搜索渠道页说明文案更新为“配置网页搜索提供商”。
- 博查区域移除可编辑文档输入框，仅保留“获取博查 API”按钮。

# 测试/验证/验收方式

- 运行 `node node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/tsc.js -p packages/nextclaw-core/tsconfig.json`
- 运行 `node node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/tsc.js -p packages/nextclaw-server/tsconfig.json`
- 运行 `node node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/tsc.js -p packages/nextclaw-ui/tsconfig.json --noEmit`
- 运行 `pnpm.cmd -C packages/nextclaw-core test -- --run src/config/loader.nextclaw-provider.test.ts`
- 运行 `pnpm.cmd -C packages/nextclaw-server test -- --run src/ui/router.provider-test.test.ts -t "updates search config and exposes search metadata"`

# 发布/部署方式

- 本次为常规前后端配置与 UI 改动，按现有 NextClaw 发布流程执行受影响包构建与发布即可。
- 若仅本次改动上线到现有服务，确保前端静态资源与 server 包同步部署，避免 `/search` 页与 `/api/config/search` 返回结构不一致。

# 用户/产品视角的验收步骤

1. 打开设置页“搜索渠道”。
2. 验证标题下方说明文案为“配置网页搜索提供商”。
3. 点击任一 provider 右侧详情中的“激活”按钮，确认按钮立即变为“已激活”。
4. 同时激活 Bocha 与 Brave，保存后刷新页面，确认两个 provider 仍保持激活状态。
5. 切换默认搜索 provider，确认默认 provider 始终处于激活状态。
6. 在 Bocha 详情中确认只有“获取博查 API”按钮，不再显示可编辑输入框。
