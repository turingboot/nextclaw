# Validation

## 自动验证

```bash
PATH=/opt/homebrew/bin:$PATH pnpm build
PATH=/opt/homebrew/bin:$PATH pnpm lint
PATH=/opt/homebrew/bin:$PATH pnpm tsc
```

结果：

- `build` 失败（仓库既有问题，非本次改动引入）：
  - `packages/extensions/nextclaw-channel-runtime/src/channels/telegram.ts(345,37)`
  - `TS2322: Type 'string' is not assignable to type 'TelegramEmoji'.`
- `lint` 通过（仅 warnings，无 errors）。
- `tsc` 失败（同一既有类型错误）：
  - `packages/extensions/nextclaw-channel-runtime/src/channels/telegram.ts(345,37)`
  - `TS2322: Type 'string' is not assignable to type 'TelegramEmoji'.`

## 冒烟测试

```bash
PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-core exec tsx --eval "import { SkillsLoader } from './src/agent/skills.ts'; const loader = new SkillsLoader(process.cwd(), './src/agent/skills'); const names = loader.listSkills(false).map((s) => s.name); if (!names.includes('qq-group-speaker-distinction')) { throw new Error('missing skill'); } console.log('skill-loaded: qq-group-speaker-distinction');"
```

验收点：

1. 输出包含 `skill-loaded: qq-group-speaker-distinction`。
2. 命令退出码为 `0`。

冒烟结果：

- 通过，实际输出：`skill-loaded: qq-group-speaker-distinction`。
