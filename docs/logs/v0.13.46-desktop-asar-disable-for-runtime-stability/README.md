# v0.13.46 desktop asar disable for runtime stability

## 迭代完成说明（改了什么）

- 为恢复 desktop 打包运行稳定性，临时关闭 Electron `asar` 打包：
  - 文件：`apps/desktop/package.json`
  - 配置：`build.asar` 从 `true` 调整为 `false`。
- 回退 Windows smoke 日志上传路径到 workflow 可接受范围（移除仓库外路径），避免 `upload-artifact` 因 rootDirectory 限制直接失败：
  - 文件：`.github/workflows/desktop-release.yml`

## 测试/验证/验收方式

- 本地验证（macOS）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm desktop:package:verify`
  - 验收点：DMG 构建成功，desktop 或 runtime fallback 能通过 `/api/health`。
- 线上验证（macOS + Windows）：
  - 触发 `desktop-release` workflow（`workflow_dispatch` + `release_tag`）。
  - 验收点：
    - `desktop-darwin-arm64` / `desktop-win32-x64` 冒烟通过。
    - `publish-release-assets` 执行成功并上传发布资产。

## 发布/部署方式

1. 合并本次 asar 调整与 workflow 修正到 `master`。
2. 打新 tag（包含本次修复）并触发 `desktop-release` workflow。
3. workflow 通过后，在对应 GitHub Release 发布双语正式说明。

## 用户/产品视角的验收步骤

1. 在 release 页面确认 macOS 与 Windows 桌面资产都可下载。
2. 首次安装后启动应用，确认不再出现初始化即退出问题。
3. 确认基础可用性（进入界面、健康检查可通）。
4. 确认 Release 说明为双语双区块（English Version 在前，中文版在后）。
