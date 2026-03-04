# VALIDATION

## 本地验证命令

```bash
pnpm -C packages/nextclaw build
pnpm -C packages/nextclaw lint
pnpm -C packages/nextclaw tsc
```

## 冒烟测试（隔离目录，避免写仓库）

```bash
export NEXTCLAW_HOME="$(mktemp -d /tmp/nextclaw-win-start-fix-XXXXXX)"
node packages/nextclaw/dist/cli/index.js init --force
node packages/nextclaw/dist/cli/index.js start --ui-port 19981
curl http://127.0.0.1:19981/api/health
node packages/nextclaw/dist/cli/index.js stop
rm -rf "$NEXTCLAW_HOME"
```

## 验收点

- `start` 输出后台 PID 和 UI/API 地址。
- `curl` 返回 `{"ok":true,...}`。
- `stop` 成功并清理状态文件。
