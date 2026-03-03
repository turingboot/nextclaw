# NextClaw 桌面端安装教程（macOS / Windows）

这是一份给普通用户的安装说明，只讲你需要做的步骤。

## 先下载正确文件

- macOS（Apple Silicon）：`NextClaw Desktop-<version>-arm64.dmg`
- Windows：`NextClaw Desktop Setup <version>.exe`

装好后可直接使用，不需要你自己安装 Node。

## macOS 安装

1. 双击打开 `.dmg`。
2. 把 `NextClaw Desktop.app` 拖到 `Applications`。
3. 去“应用程序”里打开 `NextClaw Desktop`。

如果提示“无法打开”：
1. 打开 `系统设置 -> 隐私与安全性`。
2. 点击“仍要打开”。

如果提示“已损坏”：
1. 打开“终端”。
2. 执行下面命令后再打开应用：

```bash
xattr -dr com.apple.quarantine "/Applications/NextClaw Desktop.app"
```

## Windows 安装

1. 双击运行 `NextClaw Desktop Setup <version>.exe`。
2. 如果弹出 Windows 安全提示（可能显示“Windows 已保护你的电脑”），点击“更多信息（More info）”，再点“仍要运行（Run anyway）”。
3. 按安装向导完成安装。

## 更新

- 应用会自动检查更新。
- 有新版本时会提示你重启安装。
- 你也可以手动下载新版本安装包，直接覆盖安装。

## 卸载（macOS）

1. 退出 `NextClaw Desktop`。
2. 删除 `/Applications/NextClaw Desktop.app`。
3. 如果你还想清空本地数据，再删除 `~/.nextclaw`。
