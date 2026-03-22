# v0.14.123 Remote Instance Sharing CLI Release Fix

## 迭代完成说明

- 复盘并确认用户看到的 `Failed to register remote device (200).` 并非服务端回归，而是 npm 已发布的 `@nextclaw/remote@0.1.17` 仍包含旧的 `/platform/remote/devices/register` 逻辑。
- 为 `@nextclaw/remote` 与 `nextclaw` 补发正式版本，确保 CLI 产物切到 `/platform/remote/instances/register`，并能正确解析服务端返回的 `data.instance`。
- 这次迭代是对上一轮远程实例分享发布闭环的补修，重点是“用户实际安装到的包”与已部署平台后端重新对齐。

## 测试/验证/验收方式

- `npm view @nextclaw/remote@0.1.17 dist-tags --json`
- `npm view nextclaw@0.13.25 dependencies --json`
- `tar -xOf /tmp/nextclaw-remote-npm/nextclaw-remote-0.1.17.tgz package/dist/index.js | rg "platform/remote/devices/register|Failed to register remote device"`
- 发布后再次检查新版本 tarball / 安装级 smoke，确认已切到 `platform/remote/instances/register`

## 发布/部署方式

- 使用 changeset 为 `@nextclaw/remote` 与 `nextclaw` 做 patch version
- 执行项目既定发布流程完成 version/publish
- 发布后用 npm registry 实际读取新版本内容做回归确认

## 用户/产品视角的验收步骤

1. 执行 `npm i -g nextclaw@latest` 或等效升级命令。
2. 重新启动 NextClaw，并打开远程访问。
3. 不再出现 `Failed to register remote device (200).`
4. 当前实例能正常出现在平台 console 的“我的实例”中，并可继续打开或生成分享链接。
