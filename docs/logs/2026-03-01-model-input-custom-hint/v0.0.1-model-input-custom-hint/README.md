# v0.0.1-model-input-custom-hint

## 迭代完成说明（改了什么）

- 在模型输入相关界面补充“列表没有也可自定义输入”的明确提示，并随界面语言自动切换中/英文：
  - Model 配置页模型输入区新增提示文案。
  - Provider 配置页模型输入区新增提示文案。
- 更新 i18n 文案键，确保中文和英文界面都使用对应语言：
  - `modelInputCustomHint`
  - `providerModelInputHint`
  - `providerModelInputPlaceholder`（增强描述）
- 变更文件：
  - `packages/nextclaw-ui/src/components/config/ModelConfig.tsx`
  - `packages/nextclaw-ui/src/components/config/ProviderForm.tsx`
  - `packages/nextclaw-ui/src/lib/i18n.ts`

## 测试 / 验证 / 验收方式

```bash
PATH=/opt/homebrew/bin:$PATH pnpm build
PATH=/opt/homebrew/bin:$PATH pnpm lint
PATH=/opt/homebrew/bin:$PATH pnpm tsc
```

验证观察点：

- 中文界面显示中文提示；英文界面显示英文提示。
- 模型输入区域明确说明“列表没有也可输入自定义模型 ID”。

## 发布 / 部署方式

- 本次为前端文案与提示增强，按常规前端发布流程发布 UI 包即可。
- 无数据库变更，无 migration。

## 用户 / 产品视角验收步骤

1. 打开 `Model` 页面，切换到中文，确认模型输入区看到中文“可自定义输入”提示。
2. 切换到英文，确认同一位置显示英文提示。
3. 打开 `Providers` 页面任一 provider，在模型输入框下确认有同样双语适配提示。
4. 在列表外输入一个自定义模型 ID，确认仍可添加/保存。
