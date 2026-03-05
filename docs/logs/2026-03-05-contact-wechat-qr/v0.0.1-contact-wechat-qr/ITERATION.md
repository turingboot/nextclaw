# v0.0.1-contact-wechat-qr

## 迭代完成说明（改了什么）

本次将对外联系方式从 QQ 群二维码切换为微信群二维码。

1. 官网落地页联系方式二维码资源切换为微信群二维码：
   - `/contact/nextclaw-contact-wechat-group.jpg`
2. 官网文案同步替换：
   - `QQ Group / QQ 群` 改为 `WeChat Group / 微信群`
   - 社群描述改为“微信群 + Discord”
3. GitHub README（英文 + 中文）社群联系方式由 QQ 群改为微信群二维码。
4. 将图片文件同步到 landing 公共资源目录：
   - `apps/landing/public/contact/nextclaw-contact-wechat-group.jpg`

## 测试/验证/验收方式

执行：

1. `pnpm --filter @nextclaw/landing build`
2. `pnpm build`
3. `pnpm lint`
4. `pnpm tsc`

验收点：

1. 官网社群模块展示“微信群二维码”，不再显示 QQ 群信息。
2. 官网顶部联系方式按钮文案为“加入微信群 / WeChat Group”。
3. `README.md` 与 `README.zh-CN.md` 的社群二维码均指向微信群图片。

## 发布/部署方式

本次仅涉及前端静态资源与文档更新，无后端/数据库变更。

1. 合并后走 landing 常规发布流程。
2. GitHub 页面随代码同步更新 README 联系方式。

## 用户/产品视角的验收步骤

1. 打开官网，滚动到 Community/社群区域，确认二维码为微信群。
2. 点击社群按钮，弹层二维码与社区卡片二维码一致。
3. 打开 GitHub 仓库首页，确认 README 社群联系方式已改为微信群二维码。
