# v0.13.144-desktop-release-windows-zipfile-fix

## 迭代完成说明

- 继续修复 `desktop-release` 的 Windows 归档失败问题。
- 在 [\.github/workflows/desktop-release.yml](/Users/peiwang/Projects/nextbot/.github/workflows/desktop-release.yml) 中，将 Windows 归档从 `Compress-Archive` 改为 `.NET` 的 `System.IO.Compression.ZipFile.CreateFromDirectory(...)`。
- 目的：绕过 `Compress-Archive` 在 GitHub Windows runner 上对当前目录/文件句柄处理不稳定的问题，稳定生成 `NextClaw Desktop-win32-x64-unpacked.zip`。

## 测试/验证/验收方式

- 触发 GitHub Actions `desktop-release.yml`
- 观察 `desktop-win32-x64` job：
  - `Smoke Desktop (Windows)` 成功
  - `Archive desktop artifacts (Windows)` 成功
  - `Stage Smoke Logs (Windows)` 成功
  - `Upload Smoke Logs (Windows)` 成功
  - `Upload desktop artifacts (Windows)` 成功
- 同时确认 `publish-release-assets` 成功执行

## 发布/部署方式

- 推送 workflow 修复提交到 `master`
- 使用新的 desktop release tag 再次触发 `.github/workflows/desktop-release.yml`
- 等待 workflow 成功后自动生成/更新 GitHub Release 并上传 Windows/macOS/Linux 产物

## 用户/产品视角的验收步骤

- 打开对应 desktop release 页面
- 确认存在 `NextClaw Desktop-win32-x64-unpacked.zip`
- 下载后解压并运行 `NextClaw Desktop.exe`
- 确认桌面应用可启动，且本次 release 页面同时保留 macOS / Linux 产物
