# Iteration v0.12.59-desktop-macos-open-failure-fix

## 迭代完成说明（改了什么）
- 定位桌面端 macOS 安装后“打不开/秒退”的关键机制问题：`ELECTRON_RUN_AS_NODE` 执行 runtime 时不能稳定依赖 `app.asar` 路径。
- 调整 runtime 解析优先级，优先选择 `app.asar.unpacked` 路径（若存在），降低 asar 路径命中风险。
- 调整桌面打包配置：`apps/desktop/package.json` 的 `build.asar` 改为 `false`，确保 runtime 脚本是实体文件路径，避免打包后 CLI 启动链路受 asar 限制。
- 增加 mac 构建身份配置尝试（`mac.identity = "-"`），用于无证书场景下的签名策略兼容尝试。

## 测试/验证/验收方式
- 已验证：
  - `pnpm -C apps/desktop smoke` 通过。
  - 使用打包产物中的可执行文件执行 runtime CLI：
    - `ELECTRON_RUN_AS_NODE <AppBinary> <.../node_modules/nextclaw/dist/cli/index.js> --version` 返回正常版本号。
    - `init` 与 `serve --ui-port 18791` 在隔离 `NEXTCLAW_HOME` 下可运行并返回健康检查 `{"ok":true,...}`。
- 仍需线上/用户侧确认：
  - Finder 双击启动在真实下载分发场景下受 Gatekeeper/签名与公证策略影响，需结合证书与 notarization 完整链路验证。

## 发布/部署方式
- 本次为桌面端打包与运行时路径机制修复，无后端部署。
- 合并后重新生成 `dmg`/`zip` 进行用户安装验证。

## 用户/产品视角的验收步骤
- 执行根目录打包命令生成新 `dmg`：`pnpm desktop:package`。
- 安装到 `/Applications` 后双击启动。
- 若系统拦截（未公证场景），按指引执行一次放行后再次启动。
- 启动后可访问本地 UI/健康接口即通过。
