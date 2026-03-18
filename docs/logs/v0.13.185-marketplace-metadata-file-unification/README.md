# v0.13.185-marketplace-metadata-file-unification

## 迭代完成说明（改了什么）

- 将 `nextclaw skills publish/update` 的 marketplace 文案来源统一为结构化元数据文件：
  - CLI 新增 `--meta <path>`，默认读取技能目录下的 `marketplace.json`
  - 移除“每种语言一个参数”的方向，避免 CLI 参数随语言数量膨胀
- 将 marketplace 技能发布逻辑拆成两层：
  - [`packages/nextclaw/src/cli/skills/marketplace.ts`](/Users/peiwang/Projects/nextbot/packages/nextclaw/src/cli/skills/marketplace.ts) 保留安装/发布主流程
  - [`packages/nextclaw/src/cli/skills/marketplace.metadata.ts`](/Users/peiwang/Projects/nextbot/packages/nextclaw/src/cli/skills/marketplace.metadata.ts) 负责 `marketplace.json` 与 `SKILL.md` frontmatter 解析
- 保留 `SKILL.md` frontmatter 作为兜底来源，但 marketplace 的多语言说明以 `marketplace.json` 为统一主入口
- 新增发布测试，覆盖：
  - `marketplace.json` 中 `summaryI18n/descriptionI18n` 的读取与透传
  - 无 `marketplace.json` 时回退到 `SKILL.md` frontmatter
- 为 [`skills/humanizer/marketplace.json`](/Users/peiwang/Projects/nextbot/skills/humanizer/marketplace.json) 增加一份可直接用于 marketplace 发布的中英双语元数据示例

## 测试/验证/验收方式

- 通过：`pnpm -C packages/nextclaw exec vitest run src/cli/skills/marketplace.install.test.ts src/cli/skills/marketplace.publish.test.ts src/cli/runtime.skills-install-workdir.test.ts`
- 通过：`pnpm -C packages/nextclaw exec vitest run src/cli/skills/marketplace.publish.test.ts`
- 通过：`pnpm -C packages/nextclaw tsc`
- 通过：`pnpm -C packages/nextclaw build`
- 通过（含既有超长文件 warning，无 error）：`pnpm -C packages/nextclaw exec eslint src/cli/index.ts src/cli/runtime.ts src/cli/skills/marketplace.ts src/cli/skills/marketplace.metadata.ts src/cli/skills/marketplace.publish.test.ts`
- 冒烟：
  - 在 `/tmp` 下构造临时 skill + `marketplace.json`
  - 执行 `node packages/nextclaw/dist/cli/index.js skills publish <tmp-skill-dir> --meta <tmp-skill-dir>/marketplace.json --api-base http://127.0.0.1:9999`
  - 观察点：CLI 正常解析 `--meta` 与技能目录，并进入真实网络请求阶段，最终因刻意使用不可达端口返回 `ECONNREFUSED`
- 可维护性自检：
  - 通过：`python3 .codex/skills/post-edit-maintainability-guard/scripts/check_maintainability.py --paths packages/nextclaw/src/cli/index.ts packages/nextclaw/src/cli/runtime.ts packages/nextclaw/src/cli/skills/marketplace.ts packages/nextclaw/src/cli/skills/marketplace.metadata.ts packages/nextclaw/src/cli/skills/marketplace.publish.test.ts`
  - 结果：无阻塞项；保留 warning 为 `runtime.ts`、`marketplace.ts` 历史超长文件，以及 `index.ts` 接近预算线

## 发布/部署方式

1. 发布 `nextclaw` CLI 包，使 `skills publish/update --meta` 能力对外可用
2. 准备技能目录下的 `marketplace.json`，推荐至少包含：
   - `slug`
   - `name`
   - `summary`
   - `summaryI18n`
   - `description`
   - `descriptionI18n`
   - `author`
   - `tags`
3. 发布 skill：
   - `nextclaw skills publish ./my-skill --meta ./my-skill/marketplace.json --api-base <marketplace-api>`
4. 更新已存在 skill：
   - `nextclaw skills update ./my-skill --meta ./my-skill/marketplace.json --api-base <marketplace-api>`

## 用户/产品视角的验收步骤

1. 准备一个技能目录，包含 `SKILL.md` 与 `marketplace.json`
2. 在 `marketplace.json` 中同时填写英文与中文文案，例如 `summaryI18n.en`、`summaryI18n.zh`
3. 执行：
   - `nextclaw skills publish ./my-skill --meta ./my-skill/marketplace.json --api-base <marketplace-api>`
4. 在 marketplace UI 打开该 skill 详情页
5. 验收点：
   - 市场条目展示来自 `marketplace.json` 的中英文摘要/描述
   - 不需要再为每种语言单独增加 CLI 参数
   - 后续新增其他语言时，只需在 `marketplace.json` 追加 locale 键值
