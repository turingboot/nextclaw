# RELEASE

## 发布/部署方式

本次变更属于 CLI 包修复，按项目 NPM 发布流程执行：

```bash
pnpm changeset
pnpm release:version
pnpm release:publish
```

## 发布闭环说明

- 本次不涉及后端或数据库变更：远程 migration 不适用。
- 发布后建议在 Windows 环境执行一次 `nextclaw start` + `/api/health` 验证。
