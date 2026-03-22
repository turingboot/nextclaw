# 迭代完成说明

- 修复桌面 beta 发布验证中的跨平台 smoke 误判问题。
- 在 `apps/desktop/scripts/smoke-macos-dmg.sh` 与 `apps/desktop/scripts/smoke-windows-desktop.ps1` 中，将桌面默认 UI 端口 `55667` 纳入显式健康检查候选端口。
- 修复目标是覆盖“桌面壳启动后端服务后，服务进程脱离启动器进程树”的场景，避免 macOS arm64 与 Windows CI 中服务已成功启动但 smoke 仍判定失败。

# 测试/验证/验收方式

- 本地语法检查：
  - `bash -n apps/desktop/scripts/smoke-macos-dmg.sh`
- 本地桌面烟测：
  - `pnpm -C apps/desktop smoke`
- CI 复验：
  - 创建新的 desktop beta pre-release tag
  - 触发 `.github/workflows/desktop-release.yml`
  - 要求 `desktop-darwin-arm64`、`desktop-darwin-x64`、`desktop-linux-x64`、`desktop-win32-x64` 全绿后，才进入正式版 release

# 发布/部署方式

- 提交本次 smoke 修复后推送到 `master`
- 先创建新的 GitHub beta pre-release，并触发 `desktop-release` workflow 做三平台打包与 smoke
- beta workflow 全部通过后，再创建正式版 release 并再次触发 `desktop-release` workflow 上传正式资产

# 用户/产品视角的验收步骤

- 打开 beta release 页面，确认存在 macOS、Windows、Linux 对应桌面资产
- 检查 GitHub Actions 中桌面 beta workflow 四个平台矩阵任务全部成功
- beta 通过后，打开正式版 release 页面，确认正式资产上传完成
- 在正式版 release 说明中确认包含英文版在前、中文版在后的双语说明，以及 macOS 无签名打开指引和 Windows SmartScreen 指引
