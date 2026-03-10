# v0.13.43 desktop release smoke timeout tuning

## 迭代完成说明（改了什么）

- 调整 GitHub Actions 工作流 `.github/workflows/desktop-release.yml` 的桌面冒烟超时时间：
  - macOS DMG 冒烟超时从 `120s` 提高到 `240s`。
  - Windows EXE 冒烟超时从 `90s` 提高到 `180s`。
- 目标是降低 CI 冷启动场景下的误报失败，确保 desktop 发布流程可稳定完成。

## 测试/验证/验收方式

- 本地验证（macOS）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm desktop:package:verify`
  - 验收点：DMG 构建成功，`/api/health` 返回 `ok=true` 且 `status=ok`。
- 线上验证（macOS + Windows）：
  - 触发 `desktop-release` workflow（`workflow_dispatch` + `release_tag`）。
  - 验收点：
    - `desktop-darwin-arm64`：`Smoke Desktop Install (macOS DMG)` 通过。
    - `desktop-win32-x64`：`Smoke Desktop (Windows)` 通过。
    - `publish-release-assets` 成功上传发布资产。

## 发布/部署方式

1. 推送包含超时调优的提交到 `master`。
2. 对目标版本打 tag（例如 `v0.9.21-desktop`）。
3. 触发 `desktop-release` workflow，并传入 `release_tag`。
4. workflow 完成后，在对应 GitHub Release 更新为双语正式说明（English Version 在前，中文版在后）。

## 用户/产品视角的验收步骤

1. 打开对应 tag 的 GitHub Release 页面，确认存在 macOS DMG/mac zip 与 Windows unpacked zip 资产。
2. 在 macOS 下载 DMG，安装后启动桌面端，确认能正常进入并健康检查可用。
3. 在 Windows 下载 unpacked zip，解压后启动 `NextClaw Desktop.exe`，确认启动可用且健康检查可用。
4. 确认 Release 说明为双语双区块：先 `English Version`，再 `中文版`。
