# ITERATION

## 迭代完成说明（改了什么）
- 为以下此前缺失的包补齐 ESLint 行数约束：
  - `apps/platform-admin/.eslintrc.cjs`
  - `apps/platform-console/.eslintrc.cjs`
  - `workers/marketplace-api/eslint.config.mjs`
  - `workers/nextclaw-provider-gateway-api/eslint.config.mjs`
- 统一新增规则：
  - `max-lines`: `warn`，`max=800`，`skipBlankLines=true`，`skipComments=true`
  - `max-lines-per-function`: `warn`，`max=150`，`skipBlankLines=true`，`skipComments=true`，`IIFEs=true`
- 按“除已有例外外不新增新例外”要求，已移除本轮临时添加的 3 处文件级例外，当前不新增任何新的 override 例外条目。

## 测试/验证/验收方式
- 执行命令：
  - `pnpm -C apps/platform-admin lint`
  - `pnpm -C apps/platform-admin build`
  - `pnpm -C apps/platform-admin tsc`
  - `pnpm -C apps/platform-console lint`
  - `pnpm -C apps/platform-console build`
  - `pnpm -C apps/platform-console tsc`
  - `pnpm -C workers/marketplace-api lint`
  - `pnpm -C workers/marketplace-api build`
  - `pnpm -C workers/marketplace-api tsc`
  - `pnpm -C workers/nextclaw-provider-gateway-api lint`
  - `pnpm -C workers/nextclaw-provider-gateway-api build`
  - `pnpm -C workers/nextclaw-provider-gateway-api tsc`
- 结果：
  - `build` / `tsc`：全部通过。
  - `lint`：
    - `apps/platform-admin` 失败（`AdminDashboardPage` 338 > 150）。
    - `apps/platform-console` 失败（`AdminDashboardPage` 155 > 150）。
    - `workers/nextclaw-provider-gateway-api` 失败（`chargeUsage` 183 > 150）。
    - `workers/marketplace-api` 通过。
- 结论：规则补齐已生效；在“不新增例外”前提下，需后续拆分上述超限函数以恢复 lint 全绿。

## 发布/部署方式
- 本次仅为 lint 规则配置收敛与治理，不涉及发布/部署。
- `release/deploy/migration`：不适用。

## 用户/产品视角的验收步骤
1. 在仓库根目录执行：
   - `pnpm -C apps/platform-admin lint`
   - `pnpm -C apps/platform-console lint`
   - `pnpm -C workers/marketplace-api lint`
   - `pnpm -C workers/nextclaw-provider-gateway-api lint`
2. 确认四个目标包均已启用 `max-lines` 与 `max-lines-per-function` 规则。
3. 确认当前没有新增文件级例外配置（除历史既有例外外）。
4. 对超限函数开展拆分后，再次执行 lint 验证直至全绿。
