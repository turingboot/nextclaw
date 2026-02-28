# v0.8.54-provider-test-connection-button

## 迭代完成说明（改了什么）

本次在提供商配置页新增“测试连接”能力，用于在保存前检查配置是否可用。

- 后端新增 provider 探活接口：`POST /api/config/providers/:provider/test`
  - 支持使用当前表单草稿参数（apiKey/apiBase/extraHeaders/wireApi/model）进行测试
  - 不写入配置文件，不触发配置落盘
  - 返回结构化结果（success/message/latency/model）
- 前端 Provider 表单新增“测试连接”按钮
  - 点击后调用测试接口
  - 显示测试中状态
  - 返回成功/失败 toast，并展示失败原因
- 补充后端路由测试（provider test 路由）

## 测试 / 验证 / 验收方式

- 单测：
  - `pnpm -C packages/nextclaw-server test -- --run src/ui/router.provider-test.test.ts`
- 全量校验：
  - `pnpm build`
  - `pnpm lint`
  - `pnpm tsc`

## 发布 / 部署方式

- 前端 + UI API 联动改动，按常规版本流程执行：
  1. 提交代码
  2. `pnpm release:version`
  3. `pnpm release:publish`
  4. 推送分支与 tags

## 用户/产品视角的验收步骤

1. 打开 Providers 页面并选择任一 provider。
2. 在 API Key / API Base URL 中填写（或修改）配置。
3. 点击“测试连接”。
4. 观察结果：
   - 成功：提示“连接测试通过”，并显示耗时。
   - 失败：提示“连接测试失败”并给出具体错误原因。
5. 验收标准：可在保存前判断配置是否有效，错误信息可定位问题。
