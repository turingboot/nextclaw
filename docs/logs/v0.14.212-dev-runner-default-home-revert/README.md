# 2026-03-26 v0.14.212-dev-runner-default-home-revert

## 迭代完成说明

- 按用户要求，将 `scripts/dev-runner.mjs` 的默认 `NEXTCLAW_HOME` 恢复为 `~/.nextclaw`，不再默认切到仓库内 `.nextclaw-dev`。
- 保留了“把 `NEXTCLAW_HOME` 显式传给 backend 子进程”的修复，避免 dev runner 只在父进程里计算路径、子进程却使用另一套目录。
- 同步回退 `.gitignore` 与 [README](../../../../README.md) 中关于 `.nextclaw-dev` 默认行为的说明。

## 测试/验证/验收方式

- 语法检查：
  - `/Users/peiwang/.nvm/versions/node/v22.16.0/bin/node --check scripts/dev-runner.mjs`
- 文本核对：
  - `pnpm dev start` 启动时打印的 `NEXTCLAW_HOME` 默认应为 `~/.nextclaw` 对应绝对路径。
- 运行链路：
  - backend 子进程仍会收到显式的 `NEXTCLAW_HOME` 环境变量。

## 发布/部署方式

- 本次改动仅为开发脚本默认值调整，不涉及 npm 发布或线上部署。
- 合并后，仓库根目录执行 `pnpm dev start` 会默认复用 `~/.nextclaw`。
- 如需隔离开发数据目录，手动指定：
  - `NEXTCLAW_HOME=/path/to/isolated-home pnpm dev start`

## 用户/产品视角的验收步骤

1. 在仓库根目录执行 `pnpm dev start`。
2. 观察终端输出的 `NEXTCLAW_HOME`，确认是 `~/.nextclaw` 的绝对路径。
3. 如需隔离开发环境，再用显式 `NEXTCLAW_HOME=/tmp/... pnpm dev start` 启动一轮确认可覆盖默认值。
