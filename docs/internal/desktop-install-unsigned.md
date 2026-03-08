# Desktop 无签名安装内部说明（macOS / Windows）

> 内部文档：仅用于团队验证与问题排查，不对外公开。

## 目的

- 在未签名阶段，统一团队对 macOS / Windows 安装放行步骤的口径。
- 为桌面端可用性验证提供标准操作流程。

## 安装包

- macOS（Apple Silicon）：`NextClaw Desktop-<version>-arm64.dmg`
- Windows：`NextClaw Desktop Setup <version>.exe`

## macOS 验证步骤

1. 双击打开 `.dmg`，拖拽 `NextClaw Desktop.app` 到 `Applications`。
2. 从 `Applications` 启动应用。
3. 若提示“无法验证开发者”，进入 `系统设置 -> 隐私与安全性`，点击“仍要打开”。
4. 若仍被拦截，使用右键（Control + 点击）`NextClaw Desktop.app`，选择“打开”。
5. 若提示“已损坏”，执行：

```bash
xattr -dr com.apple.quarantine "/Applications/NextClaw Desktop.app"
open -a "NextClaw Desktop"
```

## Windows 验证步骤

1. 运行 `NextClaw Desktop Setup <version>.exe`。
2. 若出现 SmartScreen，点击 `More info -> Run anyway`。
3. 完成安装后启动应用并验证主界面可正常进入。
4. 若无法启动，右键安装器并“以管理员身份运行”后重试。

## 验收口径（内部）

- 安装成功：安装流程可走完且入口图标可见。
- 首次启动成功：应用可打开且主界面可交互。
- 二次启动成功：关闭后再次打开仍可正常使用。
- 升级成功：覆盖安装后可正常启动并保留核心配置。
