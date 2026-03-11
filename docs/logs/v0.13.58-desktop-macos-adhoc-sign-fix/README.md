# v0.13.58 desktop macos adhoc sign fix

## 迭代完成说明（改了什么）
- 修复 macOS 无证书发布产物的签名状态：在 `apps/desktop/scripts/electron-after-pack.cjs` 中补充完整 app bundle 的 ad-hoc 重签名。
- 解决原先发布包中 `codesign --verify` 报错：`code has no resources but signature indicates they must be present`。
- 保持当前项目策略（不依赖证书/公证）不变，仅修复“包自身签名结构异常”问题。

## 测试/验证/验收方式
- 本地打包：`pnpm -C apps/desktop exec electron-builder --mac dmg --arm64 --publish never`
- 本地签名验证（新包）：
  - `codesign --verify --deep --strict --verbose=2 <dmg内.app>` 通过（valid on disk）
  - `spctl --assess` 仍会 `rejected`（预期：无证书情况下 Gatekeeper 仍不信任）
- 对比旧包：旧 release 包在 `codesign --verify` 会直接失败（已定位根因）。

## 发布/部署方式
- 提交本次修复后，使用新的 desktop beta tag 触发 `desktop-release`。
- 若继续维持无证书策略，发布说明必须明确“首次打开可能需用户放行”。

## 用户/产品视角的验收步骤
- 下载新 beta 的 macOS DMG。
- 拖入 Applications 后执行无签名放行流程（或 release 附带脚本）。
- 确认应用可启动，不再出现“包本体签名异常导致的损坏提示”。
