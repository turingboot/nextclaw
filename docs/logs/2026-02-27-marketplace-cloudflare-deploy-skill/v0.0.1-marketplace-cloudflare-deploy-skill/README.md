# 2026-02-27 v0.0.1-marketplace-cloudflare-deploy-skill

## 迭代完成说明（改了什么）

- 在 Marketplace Worker 数据源新增 1 个 Skills 条目：`cloudflare-deploy`。
- 条目来源：`openai/skills` 仓库的 `skills/.curated/cloudflare-deploy/SKILL.md`。
- 安装方式采用现有 Git Skill 机制：
  - `install.kind = git`
  - `install.spec = openai/skills/skills/.curated/cloudflare-deploy`
  - `install.command = npx skild install openai/skills/skills/.curated/cloudflare-deploy --target agents --local --skill cloudflare-deploy`
- Skills 推荐分组新增 `Cloudflare Mastery`，将该条目加入推荐位。
- 同步更新 `catalog.generatedAt`。

## 测试 / 验证 / 验收方式

- 数据校验：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C workers/marketplace-api run validate:catalog`
- 构建校验：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C workers/marketplace-api build`
- Lint 校验：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C workers/marketplace-api lint`
- TypeScript 校验：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C workers/marketplace-api tsc`
- 冒烟（隔离目录 `/tmp`，只读检查 catalog）：
  - `cd /tmp && PATH=/opt/homebrew/bin:$PATH node -e 'const fs=require("fs");const p="/Users/peiwang/Projects/nextbot/workers/marketplace-api/data/catalog.json";const c=JSON.parse(fs.readFileSync(p,"utf8"));const item=c.skills.items.find(i=>i.slug==="cloudflare-deploy");const rec=c.skills.recommendations.find(r=>r.id==="cloudflare");if(!item) throw new Error("missing cloudflare-deploy item");if(item.install?.kind!=="git") throw new Error("install kind is not git");if(!rec||!rec.itemIds.includes(item.id)) throw new Error("cloudflare recommendation missing item id");console.log("smoke ok", item.id, item.install.spec);'`
- 观察点：
  - 输出 `smoke ok skill-cloudflare-deploy-openai openai/skills/skills/.curated/cloudflare-deploy`。
  - `cloudflare-deploy` 条目存在且 `install.kind=git`。
  - 推荐分组 `cloudflare` 包含该条目 ID。

## 发布 / 部署方式

1. 合并变更到 `main/master`。
2. 按 [Marketplace Worker Deploy & Sync](../../../../workflows/marketplace-worker-deploy.md) 触发发布流程。
3. 发布后执行：
   - `curl -sS https://marketplace-api.nextclaw.io/health`
   - `curl -sS 'https://marketplace-api.nextclaw.io/api/v1/skills/items?q=cloudflare-deploy&page=1&pageSize=5'`
4. 验证返回结果包含 `slug=cloudflare-deploy` 条目。

## 用户 / 产品视角的验收步骤

1. 打开 NextClaw UI 的 Skills Marketplace。
2. 在搜索框输入 `cloudflare` 或 `cloudflare-deploy`。
3. 确认可看到 `Cloudflare Deploy` 条目。
4. 进入推荐分组，确认可看到 `Cloudflare Mastery` 场景。
5. 点击安装并确认安装成功提示；在已安装列表中可看到该技能。
