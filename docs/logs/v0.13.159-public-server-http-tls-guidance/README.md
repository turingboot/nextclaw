# v0.13.159-public-server-http-tls-guidance

## 迭代完成说明

- 为 `nextclaw start` / `nextclaw serve` 启动后的公网提示补充部署说明：明确 NextClaw 只直接提供 HTTP，若用户需要 `https://` 或标准 `80/443` 入口，必须由 Nginx/Caddy 终止 TLS，再反向代理到 `http://127.0.0.1:<ui-port>`。
- 为 `nextclaw start` 增加 UI 端口预检：若 `ui.port` 已被其它进程占用，CLI 现在会在启动前直接报错，并附带本地检查命令与“健康 HTTP 服务 / 非健康占用者”的诊断信息，避免用户遇到“端口能连上但 UI 一直无响应”的假启动场景。
- 在 `docs/USAGE.md` 与模板 `packages/nextclaw/templates/USAGE.md` 新增 “Public Server Deployment” 章节，补上公网部署原则、可直接照抄的 Nginx 反向代理示例，以及 `502` 的最小排查顺序。
- 在 `README.md`、`README.zh-CN.md`、npm 包 README 源文档 `docs/npm-readmes/nextclaw.md`、官网 Docker 安装脚本 `apps/landing/public/install-docker.sh` 中同步补充“VPS 上默认是纯 HTTP，HTTPS 需反代/TLS 终止”的说明，减少用户首次上云时把 443/TLS 配错的概率。

## 测试/验证/验收方式

- 代码与脚本验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw build`
  - `bash -n apps/landing/public/install-docker.sh`
  - 预期行为补充：当 `ui.port` 已被占用且健康探针失败时，`nextclaw start` 不再进入模糊等待，而是直接输出端口占用诊断并退出。
- 端口卡死场景冒烟：
  - 在本机先启动一个“可接受 TCP 连接但不返回 HTTP”的假监听，占用 `127.0.0.1:18791`
  - 执行：`NEXTCLAW_HOME=/tmp/nextclaw-port-preflight-smoke PATH=/opt/homebrew/bin:$PATH node packages/nextclaw/dist/cli/index.js start --ui-port 18791 --start-timeout 3000`
  - 结果：CLI 立即输出 `Error: Cannot start nextclaw because UI port 18791 is already occupied.`，并带出 `probe timeout`、`ss -ltnp | grep 18791` / `lsof -iTCP:18791 ...` 等本地排查提示
- 文档同步验证：
  - `PATH=/opt/homebrew/bin:$PATH node packages/nextclaw/scripts/sync-usage-template.mjs`
  - `PATH=/opt/homebrew/bin:$PATH node scripts/sync-npm-readmes.mjs`
  - `PATH=/opt/homebrew/bin:$PATH node scripts/sync-npm-readmes.mjs --check`
- 线上现象复核：
  - `curl http://8.219.57.52/` 返回 NextClaw 页面。
  - `curl http://8.219.57.52/api/health` 返回 `200` 与 `{"ok":true,...}`，说明 HTTP 入口链路正常。
  - `https://8.219.57.52` TLS 握手失败，说明当前测试机并未正确完成 443/TLS 终止，这正是本次文档与提示要显式澄清的部署边界。

## 发布/部署方式

- 无需单独部署后端或数据库变更。
- 若要让修复对后续用户生效，需要按常规 npm 发布流程发布包含本次变更的 `nextclaw` 包，并同步官网静态资源/安装脚本文案。
- 用户在公网服务器上安装时，应遵循本次新增文档：
  - 快速验证：先访问 `http://<server-ip>:18791`
  - 生产入口：由 Nginx/Caddy 监听 `80/443`，TLS 终止后反代到 `http://127.0.0.1:18791`

## 用户/产品视角的验收步骤

1. 在一台新的 Linux 云服务器执行 `npm i -g nextclaw && nextclaw start`。
2. 观察终端输出，确认能看到“NextClaw 提供的是 plain HTTP，HTTPS/80/443 需要 Nginx/Caddy 反代”的提示。
3. 直接访问 `http://<服务器IP>:18791`，确认可以打开 NextClaw UI。
4. 按文档中的 Nginx 示例配置一个 `80` 入口，再访问 `http://<服务器IP>/api/health`，确认返回 `200`。
5. 若继续配置 `443`/证书，确认 TLS 在 Nginx/Caddy 终止，且 upstream 仍指向 `http://127.0.0.1:18791`；此时用户不应再因把 upstream 写成 `https://127.0.0.1:18791` 而遇到 `502`。
