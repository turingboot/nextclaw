# v0.13.131-ncp-demo-file-store

## 迭代完成说明（改了什么）

- 在 `apps/ncp-demo/backend` 新增基于文件系统的会话与运行记录存储：
  - `src/stores/file-agent-session-store.ts`
  - `src/stores/file-agent-run-store.ts`
  - `src/stores/file-store-utils.ts`
- `createDemoBackend()` 从 in-memory 存储切换为文件存储注入：
  - `sessionStore`: `FileAgentSessionStore`
  - `runStore`: `FileAgentRunStore`
  - `controllerRegistry` 继续使用 `InMemoryRunControllerRegistry`（仅进程内 AbortController 管理）
- 新增环境变量说明：`NCP_DEMO_STORE_DIR`（默认 `.ncp-demo-store`）。

## 测试/验证/验收方式

- 静态检查与编译：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C apps/ncp-demo/backend lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C apps/ncp-demo/backend tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C apps/ncp-demo/backend build`
- 冒烟测试（使用 `/tmp` 隔离目录，不写入仓库）：
  - 使用 `NCP_DEMO_LLM_MODE=mock` + `NCP_DEMO_STORE_DIR=/tmp/...` 启动两次 backend 实例。
  - 第一次发送消息写入文件 store，第二次重建 backend 后读取会话。
  - 观察结果：`sessions=1`、`messageCount=2`、`hasAssistantFinal=true`。

## 发布/部署方式

- 本次仅影响 `apps/ncp-demo/backend` 的 demo 组装层，无 `@nextclaw/ncp-toolkit` 公共库改动。
- 常规部署方式不变：按现有 demo backend 流程启动即可，必要时通过 `NCP_DEMO_STORE_DIR` 指定持久化目录。

## 用户/产品视角的验收步骤

1. 启动 demo backend（可选设置 `NCP_DEMO_STORE_DIR` 指定目录）。
2. 在前端或 API 发送一条用户消息，等待 assistant 回复完成。
3. 重启 backend 进程。
4. 访问 `GET /demo/sessions` 与 `GET /demo/sessions/:sessionId/messages`。
5. 确认会话与历史消息仍可读取，且包含重启前已完成的 assistant 消息。
