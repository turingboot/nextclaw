# NextClaw Remote Access 轻量化设计方案

## 结论

重新收束后，我的推荐方案是：

不要做“远程版 NextClaw 产品面”，也不要做“Platform Console 里的第二套聊天与配置 UI”。

最轻、最巧、最符合 NextClaw 当前形态的做法是：

1. `Platform Console` 只负责云账号、设备列表、设备绑定、进入设备。
2. 点击“进入设备”后，不跳转到一套新 UI，而是直接进入那台设备现有的 NextClaw UI。
3. 这个“进入”过程通过一条云端中继通道实现，浏览器访问的是云端入口，但看到和操作的是同一套 `@nextclaw/ui`。
4. 云端不复制本地配置、不重写本地业务 API、不重做聊天页、配置页、marketplace 页。

一句话概括：

**做远程入口层，不做远程产品副本。**

## 为什么这是更好的方向

### 之前方案的问题

如果把 remote access 做成“云端控制台 + 远程专用聊天/管理页面”，哪怕首期只做一部分，也会慢慢滑向下面这些问题：

1. 两套 UI 做同样的事情
2. 两套路由和交互状态
3. 两套 API 能力定义
4. 两套权限边界
5. 同一个功能改一次要改两遍

这正是你不想要的。

### 这次收束后的原则

首期必须满足三个约束：

1. 不维护两套同类功能
2. 不复制本地 NextClaw 的业务逻辑
3. 不为了 remote access 把产品架构整体做重

## 最终推荐架构

## 总体思路

复用现有 NextClaw UI 和现有 NextClaw HTTP/WebSocket API，只新增一层远程访问通道。

架构如下：

```text
Browser
  |
  | 1. 登录 platform.nextclaw.io
  | 2. 选择一台设备并点击 Open
  v
NextClaw Cloud Entry
  |
  | 3. 创建短期 remote session
  | 4. 将该会话绑定到目标设备的长连接
  v
Local Connector (outbound tunnel)
  |
  | 5. 转发 HTTP / WebSocket
  v
Local NextClaw UI Server
  - same UI bundle
  - same /api/*
  - same /ws
```

这里最重要的点是：

**浏览器最终使用的仍是原来的 NextClaw UI，只是通过远程通道访问。**

## 这套方案到底“轻”在哪里

### 只新增一层通道，不新增一层产品

新增的是：

1. 设备绑定
2. 云端会话授权
3. relay / tunnel

不新增的是：

1. 第二套聊天 UI
2. 第二套配置 UI
3. 第二套 marketplace UI
4. 第二套 chat API
5. 第二套配置 API

### 保持一个产品真相源

今后：

- 聊天页怎么演进，只改 `@nextclaw/ui`
- 配置页怎么演进，只改 `@nextclaw/ui`
- marketplace 怎么演进，只改 `@nextclaw/ui`
- 后端接口怎么演进，只改本地 NextClaw server

remote access 不拥有这些功能，只负责把它们安全地“接进来”。

### 最适合现有代码形态

当前 `@nextclaw/ui` 已经天然依赖同源访问：

- API 默认走 `window.location.origin`
- WebSocket 默认从同源推导 `/ws`
- UI 路由是完整 SPA

这意味着只要远程入口能提供一个“看起来像设备自己 origin 的入口”，现有 UI 基本就能直接工作，而不用重写业务面。

## 关键设计选择

## 选择 A：路径前缀代理

示例：

```text
https://platform.nextclaw.io/devices/:deviceId/*
```

优点：

- 域名简单
- 不需要额外子域名体系

缺点：

- `@nextclaw/ui` 目前使用 `BrowserRouter`，没有显式 `basename`
- `/api/*` 和 `/ws` 也需要路径前缀重写
- 静态资源和路由前缀处理会更绕

### 结论

能做，但不够巧，不是最轻。

## 选择 B：每次进入设备时分配一个独立远程 origin

示例：

```text
https://rs_abc123.remote.nextclaw.io/
```

或

```text
https://abc123.remote.nextclaw.io/
```

这个 origin 对浏览器来说就像“那台设备自己的站点”。

它背后通过云端和本地 connector 建立映射关系，然后把：

- `/`
- 静态资源
- `/api/*`
- `/ws`

全部转到本地 NextClaw。

### 这是我最推荐的方案

因为它几乎不要求改动现有 UI 的路由和 API 推导方式：

1. `window.location.origin` 仍然成立
2. `/api/*` 仍然成立
3. `/ws` 仍然成立
4. SPA 根路由仍然成立

也就是说，**远程访问几乎可以像“把本地服务搬到另一个受控 origin”一样工作**。

## 为什么它是“巧妙的轻量化”

因为它把复杂度压进了最该承担复杂度的一层：

- 云端入口与 relay

而不是把复杂度扩散到：

- 新前端应用
- 新业务 API
- 新状态模型
- 新权限模型

## MVP 设计

## MVP 用户路径

### 1. 本地设备绑定

用户在本地机器上执行：

```bash
nextclaw remote login
```

或在本地 UI 中点击“Connect to Cloud”。

流程：

1. 本地生成 `device_install_id`
2. 本地 connector 向云端申请配对
3. 用户在浏览器登录平台账号后确认绑定
4. 本地保存绑定结果并建立长期出站连接

### 2. 浏览器进入设备

用户在 `Platform Console` 只做两件事：

1. 查看设备是否在线
2. 点击 `Open`

点击后：

1. 云端创建 `remote_session`
2. 分配一个临时远程 origin 或 session host
3. 浏览器跳转过去
4. 所有后续页面和 API 请求都走这条中继通道

### 3. 设备 UI

进入后看到的不是“remote console 自定义页面”，而是当前设备自己的 NextClaw UI：

- chat
- providers
- channels
- runtime
- sessions
- marketplace

全都还是同一套实现。

## 平台端应该只保留哪些页面

`Platform Console` 保持非常薄，只保留：

1. 登录
2. 我的设备列表
3. 设备状态
4. 绑定/解绑
5. 打开设备

它不要承载：

1. 聊天本体
2. provider 配置本体
3. channels 配置本体
4. marketplace 本体

原因非常简单：

这些页面已经在 `@nextclaw/ui` 里存在，再做一次就是重复劳动。

## 本地 Connector 的职责

connector 必须非常克制，只做四件事：

1. 与云端维持出站长连接
2. 把云端请求转发到本地 NextClaw
3. 处理 WebSocket 双向流
4. 上报设备心跳与元数据

connector 不做：

1. 新业务逻辑
2. 新页面拼装
3. 本地状态二次存储
4. 消息历史同步

## 一个关键问题：本地 UI 认证怎么办

这是整套方案里少数需要显式设计的点。

当前本地 UI 已经有自己的认证逻辑，这是好的；但在 remote access 下，浏览器并不是直接访问本地服务，而是通过云端授权后进入。

### 推荐做法：远程会话桥接本地认证

当云端确认某个用户有权进入某台设备后：

1. 云端把带签名的 `remote_session_claim` 发给本地 connector
2. connector 在本机为这次远程访问创建一份受控的本地 UI session
3. 远程浏览器通过云端中继访问时，自动携带这份本地 session 对应的 cookie

效果是：

- 本地服务仍然通过原有认证保护
- 远程访问不是绕过认证，而是桥接进原有认证体系

### 为什么这比“再做一套远程权限系统”更轻

因为这样仍然在复用现有本地 UI auth，而不是引入第二套独立的页面权限判断。

## 是否需要重新定义一套 remote-safe API

我的新判断是：

**首期不需要。**

如果你的目标是“用户从另一台电脑进入自己的这台 NextClaw”，而不是“开放给团队成员或第三方访问”，那最合理的默认就是：

远程进入后，拿到的就是这台设备的完整产品面。

也就是说：

- 不需要首期拆第二套远程 API 面
- 不需要首期做 chat-only 特供 UI
- 不需要首期做配置页缩减版

### 什么时候才需要 remote-safe API

只有当我们进入这些场景时才值得做：

1. 团队共享访问
2. 临时访客授权
3. 细粒度权限控制
4. 高风险能力隔离

这属于第二阶段，不该污染第一阶段。

## 这样做的工程代价

## 首期真正需要新增的东西

只有这些：

1. 云账号与设备绑定
2. 设备在线目录
3. 远程 session 创建
4. HTTP 中继
5. WebSocket 中继
6. 本地 connector
7. 本地 auth bridge

## 首期不需要新增的东西

这些都不要做：

1. 新聊天页
2. 新配置页
3. 新 marketplace 页
4. 新会话状态模型
5. 新消息协议
6. 云端配置镜像
7. 云端聊天执行层

## 推荐技术形态

## 云端

云端只需要三块：

1. `platform auth`
2. `device registry`
3. `relay gateway`

如果你们已经有平台 API，remote access 只是新增一个模块，而不是新起一个庞大系统。

## 本地

本地只需要新增：

1. `remote connector`
2. `auth bridge`

它们最好都内聚在 `nextclaw` 现有 runtime 内，而不是要求用户再安装第二个守护进程。

## 前端

前端最理想的目标是：

1. `apps/platform-console` 继续只做设备入口
2. 进入设备后直接复用 `@nextclaw/ui`

如果需要少量远程态提示，例如：

- 当前连接的是哪台设备
- 设备离线了
- 返回设备列表

也应该尽量以壳层注入、顶部 banner、host chrome 的方式增加，而不是复制整页实现。

## 最佳落地方式

我最推荐：

### 方案：会话专属子域名 + 全量同源转发

用户点击 `Open` 后，跳转到：

```text
https://<remote-session-id>.remote.nextclaw.io/
```

该域名下：

- 静态资源来自目标设备 UI
- `/api/*` 代理到目标设备
- `/ws` 代理到目标设备

这样浏览器看到的是一个完整、独立、同源的 NextClaw 站点。

### 这个方案的直接收益

1. 不需要改 `API_BASE` 逻辑
2. 不需要改 WebSocket URL 逻辑
3. 不需要先做 Router basename 改造
4. 不需要维护 remote UI 副本
5. 不需要维护 remote API 副本

## 风险与应对

### 风险 1：会话子域名体系增加基础设施复杂度

这是存在的，但它换来的是产品层极大简化。

我的判断是值得。

因为这类复杂度是基础设施复杂度，而不是产品与业务复杂度；基础设施复杂度更集中，也更容易局部治理。

### 风险 2：远程访问等于完整设备管理权限

这在首期是接受的，因为目标场景是“同一个用户访问自己的设备”。

如果后续进入共享场景，再做能力降权。

### 风险 3：本地连接断开导致整个页面不可用

这不是新问题，而是 remote access 的本质。

应对方式不是再做一套降级页面，而是把：

- 在线状态
- 重连状态
- 会话失效提示

做清楚。

## 最终推荐

这次重新思考后的最终方案是：

**Platform Console 只做设备入口，不做远程副本；Remote Access 通过 relay 把现有 NextClaw UI 原样接出来。**

这条路线的好处是：

1. 只有一套产品面
2. 只有一套业务 API
3. 只有一套聊天与配置功能
4. remote access 真正只是“访问方式的增强”
5. 长期维护成本最低

如果你的核心原则是“不要为了远程访问引入第二个 NextClaw”，那我认为这就是最对的做法。

## 下一步

如果继续往下推，我建议只补两份非常小的实现设计：

1. `remote-session-subdomain-gateway` 设计
2. `local-connector-auth-bridge` 设计

两份加起来就够进入实现了，不需要再展开一整套远程产品 PRD。
