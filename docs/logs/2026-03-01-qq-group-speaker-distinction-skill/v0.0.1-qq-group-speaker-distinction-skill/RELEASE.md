# Release

## 发布/部署方式

本次为内置 skill 文档与索引变更，随常规 NPM 发布流程进入版本发布：

```bash
pnpm changeset
pnpm release:version
pnpm release:publish
```

详细流程见：[docs/workflows/npm-release-process.md](docs/workflows/npm-release-process.md)。

## 发布闭环说明

- 代码变更：已完成（新增 skill + 更新索引）。
- 构建验证：见 [VALIDATION.md](docs/logs/2026-03-01-qq-group-speaker-distinction-skill/v0.0.1-qq-group-speaker-distinction-skill/VALIDATION.md)。
- 发布动作：按需执行上述发布命令。

## 不适用项

- 远程 migration：不适用（无后端/数据库变更）。
- 线上 API 冒烟：不适用（本次仅 skill 规则文档变更）。
