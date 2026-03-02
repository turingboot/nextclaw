# v0.0.1-electron-desktop-semi-auto-update

## 迭代完成说明（改了什么）

- 新增桌面端方案文档：
  - [`docs/designs/electron-desktop-semi-auto-update-plan.md`](../../../designs/electron-desktop-semi-auto-update-plan.md)
- 文档明确以下关键决策：
  - 桌面端采用 Electron，不维护双前端代码。
  - 面向普通用户的安装包不依赖预装 Node/npm。
  - 更新策略采用半自动更新（应用内检查/下载 + 用户确认重启安装）。
  - 保留手动更新兜底路径，保障失败可恢复。
- 文档给出架构边界、打包发布原则、安全基线、分阶段交付与验收标准。

## 设计结论

- 当前阶段以“低维护成本 + 稳定可交付”为第一目标，Electron 路线与现有仓库结构匹配度最高。
- 版本升级不依赖“每次手动重新下载”，应优先落地半自动更新闭环。
