# v0.13.175-remove-ncp-http-forward-timeout

## 迭代完成说明

- 去掉 `@nextclaw/ncp-http-agent-server` 默认的 forward SSE 120 秒超时。
- 现在 `requestTimeoutMs` 默认为不启用；只有显式传入正数时，才会启用 server-side timeout。
- 同步更新类型声明、解析逻辑、stream handler 说明和 README。
- 补充测试，验证默认禁用与显式超时仍可用。

## 测试/验证/验收方式

- 运行：
  - `pnpm --filter @nextclaw/ncp-http-agent-server exec vitest run src/index.test.ts`
- 观察点：
  - `sanitizeTimeout(undefined | null | 0 | 负数)` 返回 `null`
  - 显式超时值仍会被保留并做最小值规整

## 发布/部署方式

- 这是库内行为调整，无需单独部署流程。
- 若依赖该包的本地运行链路使用 workspace 包，重新执行受影响包构建/测试即可生效。

## 用户/产品视角的验收步骤

- 启动当前 Nextclaw UI + NCP agent 链路。
- 发起一个可能超过 2 分钟的长回复或多轮工具调用。
- 确认不再出现 `NCP HTTP stream timed out before terminal event.`。
- 如后续确实需要保护性截断，可在 server 侧显式配置 `requestTimeoutMs`。
