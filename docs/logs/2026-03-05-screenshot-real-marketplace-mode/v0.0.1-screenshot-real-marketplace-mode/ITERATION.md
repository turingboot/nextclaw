# v0.0.1-screenshot-real-marketplace-mode

## 迭代完成说明（改了什么）

本次将产品截图脚本升级为“真实技能市场优先”的可切换模式：

1. 新增环境变量 `REAL_MARKETPLACE=1`，开启后截图流程会优先请求真实 marketplace 数据。
2. 新增环境变量 `REAL_MARKETPLACE_BASE`，可指定真实市场源地址（默认 `https://marketplace-api.nextclaw.io`）。
3. 保持原有稳定性：若真实市场请求失败，会自动回退到内置 mock 数据，不中断截图流程。
4. 对技能详情/插件详情截图所需的 `.../content` 接口补充远端适配逻辑，保证“点击卡片后右侧详情”依然可渲染。
5. 更新截图流程文档，补充真实模式使用说明。

## 测试/验证/验收方式

执行：

1. `REAL_MARKETPLACE=1 pnpm screenshots:refresh`
2. `pnpm build`
3. `pnpm lint`
4. `pnpm tsc`

验收点：

1. `REAL_MARKETPLACE=1` 时截图中的 skills 列表来自真实市场数据（非固定 mock 列表）。
2. 点击某个 skill 后，右侧详情浏览器可正常显示。
3. 若真实接口不可用，日志会提示 fallback，脚本仍可完成全部截图。
4. `build/lint/tsc` 通过（lint 允许历史 warning，无 error）。

## 发布/部署方式

本次仅涉及截图脚本与文档，无后端/数据库 migration。

1. 合并代码后，本地可直接通过 `REAL_MARKETPLACE=1 pnpm screenshots:refresh` 刷新真实市场截图。
2. CI 仍可使用默认 mock 模式，或按需注入环境变量切换为真实模式。

## 用户/产品视角的验收步骤

1. 执行 `REAL_MARKETPLACE=1 pnpm screenshots:refresh`。
2. 打开 `apps/landing/public/nextclaw-skills-doc-browser-en.png` 与 `apps/landing/public/nextclaw-skills-doc-browser-cn.png`。
3. 确认截图中 skills 列表不再是固定演示两条数据，且选中 skill 后右侧有对应详情。
