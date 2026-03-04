# v0.0.1-windows-service-start-fallback

## 迭代完成说明

本次修复针对「部分 Windows 用户执行 `nextclaw start` 报 `Failed to start background service` 且日志为空」问题，改动如下：

- 将后台就绪探测从 `fetch` 改为 Node 原生 `http/https` 请求，避免特定运行时环境下探测持续失败。
- 保留 8 秒首段探测，同时对 Windows 增加二段 20 秒宽限（仅在子进程仍存活时触发），降低慢机误判失败概率。
- 启动失败时输出最后一次探测错误（`Last probe error`），提升可诊断性。

## 影响范围

- `packages/nextclaw/src/cli/commands/service.ts`
