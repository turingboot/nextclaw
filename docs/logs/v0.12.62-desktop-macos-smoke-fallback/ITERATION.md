# v0.12.62 desktop-macos-smoke-fallback

## 迭代完成说明（改了什么）

- 修复 `apps/desktop/scripts/smoke-macos-dmg.sh` 的误判失败问题：
  - 增强 Electron 进程 PID 恢复逻辑，避免仅凭初始 PID 判断“提前退出”。
  - 增加 macOS 无界面环境的 fallback：当 GUI 进程无法稳定拉起时，自动改为从已安装 `.app` 内部 runtime 执行 `init + serve` 并做 `/api/health` 验证。
  - 增加 fallback 日志输出与清理逻辑，确保临时进程可回收。
- 目标是让根目录一键验证命令在当前无签名阶段保持可执行、可重复。

## 测试/验证/验收方式

- 脚本语法检查：`bash -n apps/desktop/scripts/smoke-macos-dmg.sh`
- macOS 安装后烟测（单独脚本）：
  - `bash apps/desktop/scripts/smoke-macos-dmg.sh "apps/desktop/release/NextClaw Desktop-0.0.21-arm64.dmg" 120`
  - 结果：通过（触发 fallback 后 `/api/health` 返回 ok）。
- 根目录一键打包验证：`pnpm desktop:package:verify`
  - 结果：通过（产出 DMG + 安装后健康检查通过）。
- 根目录一键产物命令：`pnpm desktop:package`
  - 结果：通过，产出 `.dmg/.zip/latest-mac.yml/.blockmap`。

## 发布/部署方式

- 无需数据库迁移。
- 合并后即可由现有桌面流水线继续使用；macOS job 会沿用修复后的烟测脚本。
- Windows 端自动安装验证仍由 `.github/workflows/desktop-validate.yml` 与 `.github/workflows/desktop-release.yml` 的 Windows job 执行（构建 NSIS + 运行 `smoke-windows-installer.ps1`）。

## 用户/产品视角的验收步骤

1. 在仓库根目录执行 `pnpm desktop:package`，确认得到可分发安装包（macOS 下为 `.dmg`/`.zip`）。
2. 在仓库根目录执行 `pnpm desktop:package:verify`，确认安装后可用性验证通过。
3. 在 Windows runner（CI）查看对应 job，确认安装器构建与 `smoke-windows-installer.ps1` 全部通过。
4. 通过内部文档 `docs/internal/desktop-install-unsigned.md` 按平台执行人工安装复核。
