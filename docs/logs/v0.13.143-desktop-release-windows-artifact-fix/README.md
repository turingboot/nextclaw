# v0.13.143-desktop-release-windows-artifact-fix

## 迭代完成说明

- 修复 `desktop-release` workflow 在 Windows 平台的收尾失败问题。
- 调整 [\.github/workflows/desktop-release.yml](/Users/peiwang/Projects/nextbot/.github/workflows/desktop-release.yml)：
  - Windows 归档 `win-unpacked` 前先复制到 staging 目录，并排除仍被占用的 `debug.log`，避免 `Compress-Archive` 因文件锁失败。
  - Windows smoke logs 先复制到 workspace 内的 staging 目录，再统一交给 `upload-artifact`，避免跨 workspace / runner temp 路径导致的 `rootDirectory is not a parent directory` 失败。

## 测试/验证/验收方式

- 触发 GitHub Actions `desktop-release.yml`
- 观察 `desktop-win32-x64` job：
  - `Build Desktop (Windows)` 成功
  - `Smoke Desktop (Windows)` 成功
  - `Archive desktop artifacts (Windows)` 成功
  - `Upload Smoke Logs (Windows)` 成功
  - `Upload desktop artifacts (Windows)` 成功
- 同时确认 macOS / Linux job 不受影响

## 发布/部署方式

- 推送 workflow 修复提交到 `master`
- 使用新的 desktop release tag 触发 `.github/workflows/desktop-release.yml`
- 等待 workflow 完成后，由 `publish-release-assets` 自动创建/更新 GitHub Release 并上传桌面产物

## 用户/产品视角的验收步骤

- 打开 GitHub Release 页面，确认存在本次 desktop release
- 确认至少包含：
  - macOS `.dmg`
  - macOS `-mac.zip`
  - Windows `NextClaw Desktop-win32-x64-unpacked.zip`
  - Linux `.AppImage`
- 打开 Actions 运行记录，确认 Windows job 的桌面启动冒烟已通过，不再因日志上传或 zip 归档失败
