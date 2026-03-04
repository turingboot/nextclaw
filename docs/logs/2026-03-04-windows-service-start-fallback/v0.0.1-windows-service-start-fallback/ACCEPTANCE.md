# ACCEPTANCE

## 用户/产品视角验收步骤

1. 在 Windows 机器安装最新 `nextclaw`。
2. 执行 `nextclaw start`。
3. 观察终端：应看到 `started in background`、`UI`、`API`、`Logs` 信息。
4. 在浏览器打开 UI 地址（默认 `http://127.0.0.1:18791`）。
5. 访问 `http://127.0.0.1:18791/api/health`，确认返回 `ok: true`。
6. 执行 `nextclaw stop`，确认服务可正常停止。

## 失败时期望信息

- 若仍失败，终端错误应包含 `Last probe error`，用于快速定位网络/端口/权限问题。
