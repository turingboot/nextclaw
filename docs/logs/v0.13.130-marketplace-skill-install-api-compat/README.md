# v0.13.130-marketplace-skill-install-api-compat

## 迭代完成说明（改了什么）

- 修复 `packages/nextclaw/src/cli/skills/marketplace.ts` 的 marketplace skill 安装兼容性：
  - `files` 清单新增解析 `contentBase64` 字段。
  - 安装时优先使用 `contentBase64` 直接落盘，缺失时再回退旧的 `downloadPath/files/blob` 下载逻辑。
  - 新增 `contentBase64` 校验与解码，避免无效数据落盘。
- 根因：线上 marketplace API 返回的 skill 文件清单已可直接内联文件内容，且 `files/blob` 端点不可用；CLI 仍仅走旧端点，导致安装统一失败。

## 测试/验证/验收方式

- 冒烟（真实接口，非仓库目录写入）：
  - `tmpdir=$(mktemp -d /tmp/nextclaw-skill-install-smoke-XXXXXX)`
  - `pnpm -C packages/nextclaw exec tsx src/cli/index.ts skills install agent-browser --api-base https://marketplace-api.nextclaw.io --dir "$tmpdir"`
  - 结果：成功输出 `Installed agent-browser (marketplace)`，并生成 `$tmpdir/agent-browser/SKILL.md`。
- 代码校验：
  - `pnpm -C packages/nextclaw lint`（通过；存在仓库既有 warning，无新增 error）
  - `pnpm -C packages/nextclaw tsc`（通过）
  - `pnpm -C packages/nextclaw build`（通过）

## 发布/部署方式

- 本次仅修改本地 CLI 安装逻辑，不涉及后端或数据库变更，`migration` 不适用。
- 合入后按常规发版流程发布 `nextclaw` 包即可生效（无需额外服务端部署）。

## 用户/产品视角的验收步骤

1. 在任意空目录执行：
   - `nextclaw skills install agent-browser --api-base https://marketplace-api.nextclaw.io --dir ./skills`
2. 期望结果：
   - 命令返回 `Installed agent-browser (marketplace)`。
   - 本地生成 `./skills/agent-browser/SKILL.md`。
3. 回归检查：
   - 安装 builtin skill（如 `weather`）仍可成功。
   - 当服务端仅返回旧 `downloadPath` 时，安装路径仍可工作（兼容旧协议）。
