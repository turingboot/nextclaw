# v0.12.29 marketplace release closed loop

## 迭代完成说明（改了什么）

- 技能分发从 GitHub 安装迁移到 Marketplace，移除旧的 GitHub 安装路径与兼容残留。
- Skill 与 Plugin 模型彻底拆分：Skill 仅保留 `builtin` 与 `marketplace` 两类。
- Marketplace API 从 JSON 文件数据源切到 Cloudflare D1 数据源，并补充迁移与种子逻辑。
- CLI 新增/完善 Marketplace 能力：支持技能上传、更新、安装（不依赖 GitHub）。
- 服务端与前端联动更新 Marketplace 列表、安装流程、报错信息与滚动体验。

## 测试/验证/验收方式

- 全量发布前校验：
  - `pnpm release:check`
- 发布前补充冒烟（CLI 用户可见能力）：
  - `node packages/nextclaw/dist/cli/index.js skills --help`

验收点：

- `release:check` 全流程通过（build/lint/tsc 无 error）。
- `skills --help` 中可见 Marketplace 安装/上传/更新相关命令。

## 发布/部署方式

- 版本与发布按项目流程执行：
  - `pnpm release:version`
  - `pnpm release:publish`
- GitHub Release：
  - 基于本次自动生成的 tag 执行 `gh release create`。

## 用户/产品视角的验收步骤

1. 打开技能市场页面，确认可加载技能列表，且安装类型不再出现 `git`。
2. 在聊天输入框输入 `/` 后输入空格，确认命令面板立即关闭。
3. 在 Marketplace 页面确认只有“技能列表”区域滚动，页面整体不发生整页滚动。
4. 使用 CLI 执行技能安装与上传/更新命令，确认均走 Marketplace 接口而非 GitHub。
