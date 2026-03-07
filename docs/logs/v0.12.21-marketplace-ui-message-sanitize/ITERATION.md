# v0.12.21 marketplace ui message sanitize

## 迭代完成说明（改了什么）

- 处理技能/插件安装反馈中的技术路径泄露问题：UI 可见提示不再出现 `Path: /Users/...` 这类绝对路径。
- 在 `ServiceCommands` 增加 `pickUserFacingCommandSummary`，会过滤：
  - `Path:`/`Install path:` 等技术行
  - 含绝对文件系统路径的行
- marketplace 相关安装/启用/禁用/卸载返回改为仅回传用户摘要 `message`，不再携带原始 `output` 技术细节。
- 新增单测覆盖路径过滤与兜底文案逻辑。

## 测试/验证/验收方式

- 单测：
  - `pnpm -C packages/nextclaw test -- --run src/cli/commands/service.summary.test.ts`
- 构建与静态检查：
  - `pnpm -C packages/nextclaw build`
  - `pnpm -C packages/nextclaw lint`
  - `pnpm -C packages/nextclaw tsc`
- 冒烟（真实调用服务安装流程，模拟子命令输出含绝对路径）：
  - `pnpm -C packages/nextclaw exec tsx -e "import { ServiceCommands } from './src/cli/commands/service.ts'; (async () => { const svc:any = new ServiceCommands({ requestRestart: async () => {} }); svc.runCliSubcommand = async () => '✓ Installed docx (marketplace)\\nPath: /Users/tongwenwen/.nextclaw/workspace/skills/docx'; const res = await svc.installMarketplaceSkill({ slug: 'docx', kind: 'marketplace' }); console.log(JSON.stringify(res)); })();"`
  - 预期输出：`{"message":"✓ Installed docx (marketplace)"}`（无绝对路径）。

## 发布/部署方式

- 此变更在 `nextclaw` CLI/UI API 层，按常规发布 `nextclaw` 包即可。
- 若与 marketplace worker 同轮发布，沿用既有 worker 发布闭环，不影响本改动生效判定。

## 用户/产品视角的验收步骤

1. 在 UI Marketplace 安装任意 skill（例如 `docx`）。
2. 观察成功 toast：应为简洁业务文案（如 `Installed skill: docx` 或 `✓ Installed docx (marketplace)`）。
3. 不应再出现 `Path: /Users/...`、`Install path: ...` 等技术路径提示。
