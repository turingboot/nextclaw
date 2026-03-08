# v0.12.63-worker-structure-refactor-minimal

## 迭代完成说明（改了什么）
- 将 `workers/nextclaw-provider-gateway-api` 从单文件入口重构为最小可维护结构：
  - `controllers/`：`auth-controller.ts`、`billing-controller.ts`、`admin-controller.ts`、`openai-controller.ts`
  - `services/`：鉴权、额度结算、流式结算、平台初始化
  - `repositories/`：D1 读写与视图映射
  - `utils/`：通用工具、OpenAI 风格响应、加密/签名、计费计算
  - `types/`：Env/业务类型/常量/模型目录
  - `routes.ts`：集中注册全部路由
  - `index.ts`：Worker 入口（CORS、路由挂载、notFound/onError、DO 导出）
  - `main.ts`：收敛为对 `index.ts` 的导出转发
- 修复重构中的关键一致性问题：
  - 去除 service 层动态 `import()`，改为静态依赖
  - `requireAdminUser` 统一使用 `jsonErrorResponse`
  - `chargeFromStream` 恢复为 `isRecord(chunk.usage)` 判定
  - 登录失败锁定阈值改为常量（非魔法数字）
  - 使用量接口统一 USD 字段四舍五入行为

## 测试/验证/验收方式
- Worker 局部验证：
  - `pnpm -C workers/nextclaw-provider-gateway-api tsc`
  - `pnpm -C workers/nextclaw-provider-gateway-api lint`
  - `pnpm -C workers/nextclaw-provider-gateway-api build`
- 平台全量验证（含前端与冒烟）：
  - `pnpm validate:platform:mvp`
- 本次冒烟重点观察：
  - 注册/登录/鉴权
  - 登录失败限流与锁定
  - 双免费额度硬拦截
  - 充值审核与入账
  - 付费余额直扣
  - 账本不可变约束

## 发布/部署方式
- 一键部署：`pnpm deploy:platform`
  - 包含远程 DB migration、Worker 发布、用户站 Pages 发布、管理站 Pages 发布
- 线上基础健康检查：
  - `https://ai-gateway-api.nextclaw.io/health`
  - `https://ai-gateway-api.nextclaw.io/v1/models`
  - `https://platform.nextclaw.io`
  - `https://platform-admin.nextclaw.io`

## 用户/产品视角的验收步骤
1. 打开 `platform.nextclaw.io`，完成用户注册与登录。
2. 在用户侧发起一次充值申请，确认在用户端可见为 `pending`。
3. 打开 `platform-admin.nextclaw.io`，管理员登录后在充值审核页通过该申请。
4. 回到用户侧，确认余额已增加，账本新增 `recharge` 流水。
5. 在用户侧发起模型请求，确认免费额度或余额按真实 USD 成本扣减。
6. 在免费池耗尽或个人免费额度耗尽场景下，确认免费路径被硬拦截（仅余额足够时继续）。
