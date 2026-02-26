# 工具

## Web 搜索（Brave）

配置 Brave Search API Key 以启用网页搜索：

```json
{
  "tools": {
    "web": {
      "search": { "apiKey": "YOUR_BRAVE_KEY", "maxResults": 5 }
    }
  }
}
```

## 命令执行（exec）

允许 Agent 执行 Shell 命令：

```json
{
  "tools": {
    "exec": { "timeout": 60 }
  },
  "restrictToWorkspace": false
}
```

- `timeout`：单条命令最大执行秒数
- `restrictToWorkspace`：若为 `true`，命令仅允许在 Agent 工作区目录内执行
