# v0.13.52-search-provider-bocha-default

## 迭代完成说明

- 将网页搜索从 Brave 单点硬编码重构为可配置搜索 provider，首版支持 `bocha` 与 `brave`。
- 新增顶层 `search` 配置域，默认 provider 改为 `bocha`，并兼容从旧 `tools.web.search.*` 迁移 Brave 配置。
- 前后端新增独立“搜索渠道”设置页与 `PUT /api/config/search` 接口，支持切换 provider、设置 API Key 和关键参数。
- `web_search` 工具改为按 provider 调用，Bocha 使用 `POST https://api.bocha.cn/v1/web-search`，并解析 `data.webPages.value`。

## 测试/验证/验收方式

- 运行受影响包的类型/构建/测试最小集，覆盖 `core`、`server`、`ui`、`nextclaw`。
- 验证 `search` 配置保存后会触发 `config.updated(path="search")`，运行时无需重启即可热更新。
- UI 冒烟：
  - 进入 Settings -> 搜索渠道。
  - 选择 Bocha，填写 API Key，点击“获取博查 API”确认跳转。
  - 保存后再次刷新页面，确认 provider 与参数仍然存在。
- 工具冒烟：
  - 配置 Bocha 后触发一次 `web_search`，确认结果包含标题、链接、摘要/简介、站点名。

## 发布/部署方式

- 按常规前端 + Node 包流程发布。
- 若仅本次搜索设置与工具链变更，无数据库与后端 migration，不适用远程 migration。
- 发布后确认 UI 静态资源与网关运行时同时更新到包含 `search` 配置域的版本。

## 用户/产品视角的验收步骤

1. 打开设置页，左侧可以看到“搜索渠道”入口。
2. 默认展示 Bocha 为当前搜索 provider。
3. 选中 Bocha 后，右侧可以填写 API Key、结果条数、摘要开关、时间范围，并可点击按钮前往 Bocha 开放平台获取 API。
4. 切换到 Brave 时，仍可单独填写 Brave API Key。
5. 保存后在对话中触发网页搜索，Bocha 配置生效且大陆用户不再依赖 Brave 才能使用搜索。
