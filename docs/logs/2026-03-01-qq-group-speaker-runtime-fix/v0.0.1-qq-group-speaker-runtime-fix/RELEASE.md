# Release

## 发布/部署方式

本次涉及运行时代码（QQ channel runtime），按常规 NPM 发布流程执行：

```bash
pnpm changeset
pnpm release:version
pnpm release:publish
```

详细流程见：[docs/workflows/npm-release-process.md](docs/workflows/npm-release-process.md)。

## 发布闭环说明

- 代码变更：已完成（QQ 群聊发言者区分入模逻辑）。
- 构建验证：见 [VALIDATION.md](docs/logs/2026-03-01-qq-group-speaker-runtime-fix/v0.0.1-qq-group-speaker-runtime-fix/VALIDATION.md)。
- 发布动作：按需执行上述命令。

## 不适用项

- 远程 migration：不适用（无后端/数据库变更）。
- 线上关键 API 冒烟：不适用（本次为渠道入站文本处理逻辑，非 API 变更）。
