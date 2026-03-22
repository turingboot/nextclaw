# v0.14.112-default-ui-port-55667

## 迭代完成说明

- 将 NextClaw 默认 UI 端口从 `58891` 统一调整为 `55667`，覆盖配置默认值、CLI 运行时 fallback、remote/local origin、Docker 默认暴露端口、桌面端冒烟脚本以及用户文档入口。
- 同步更新 Web UI 客户端默认 API / WebSocket 基址、服务诊断输出与相关测试用例，确保源码、构建产物、脚本和文档继续保持单一默认端口口径。
- 选择 `55667` 的原因是更容易记忆，读感更像稳定产品默认值，同时仍位于 private/dynamic 端口区间，不容易和常见同类产品默认端口撞车。

## 测试/验证/验收方式

- 构建：
  - `pnpm -C packages/nextclaw-ui build`
  - `pnpm -C packages/nextclaw-core build`
  - `pnpm -C packages/nextclaw-remote build`
  - `pnpm -C packages/nextclaw build`
- 静态与测试：
  - `pnpm -C packages/nextclaw-core tsc`
  - `pnpm -C packages/nextclaw-remote tsc`
  - `pnpm -C packages/nextclaw-ui lint`
  - `pnpm -C packages/nextclaw lint`
  - `pnpm -C packages/nextclaw-server test -- src/ui/router.remote.test.ts --run`
  - `pnpm -C packages/nextclaw test -- --run src/cli/commands/diagnostics.status.test.ts src/cli/commands/remote-access-host.test.ts`
- 冒烟：
  - 在隔离 `NEXTCLAW_HOME` 目录运行 `node packages/nextclaw/dist/cli/index.js start --start-timeout 15000`
  - 观察输出包含 `UI: http://127.0.0.1:55667`
  - 校验 `curl http://127.0.0.1:55667/api/health` 返回 `ok: true`

## 发布/部署方式

- CLI / 源码运行默认改为 `55667`，如需自定义仍可通过 `ui.port` 或 `--ui-port <port>` 覆盖。
- Docker 默认对外暴露 `55667`，部署时可继续通过 `NEXTCLAW_DOCKER_UI_PORT` 覆盖。
- 若对外提供公网入口，仍建议由 Nginx / Caddy 终止 `80/443` 或 `https`，上游回源到 `http://127.0.0.1:55667`。

## 用户/产品视角的验收步骤

1. 执行 `nextclaw start`，不要传 `--ui-port`。
2. 观察终端输出，确认默认 UI 地址为 `http://127.0.0.1:55667`。
3. 浏览器打开 `http://127.0.0.1:55667`，确认首页可正常访问。
4. 访问 `http://127.0.0.1:55667/api/health`，确认返回健康状态。
5. 如需远程访问或 Docker 部署，确认文档、脚本与诊断输出都以 `55667` 为默认端口。

## 红区触达与减债记录

### packages/nextclaw/src/cli/commands/diagnostics.ts

- 本次是否减债: 否
- 说明: 本次仅同步默认 UI 端口 fallback 与诊断输出到 `55667`，未扩张该文件职责，但仍触达红区文件。
- 下一步拆分缝: 先拆 diagnostics collector、runtime status mapper、user-facing renderer。
