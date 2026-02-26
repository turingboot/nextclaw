# Cron 与 Heartbeat

## Cron 任务

可以创建一次性或周期任务，调度触发时消息会发送给 Agent。

### 查看任务

```bash
nextclaw cron list
```

### 创建一次性任务

```bash
nextclaw cron add -n "reminder" -m "Stand up and stretch" --at "2026-02-15T09:00:00"
```

### 创建周期任务

```bash
nextclaw cron add -n "daily-summary" -m "Summarize yesterday" -c "0 9 * * *"
```

### 管理任务

```bash
nextclaw cron remove <jobId>
nextclaw cron enable <jobId>
nextclaw cron enable <jobId> --disable
nextclaw cron run <jobId>          # 立即执行一次
nextclaw cron run <jobId> --force  # 即使禁用也执行
```

## Heartbeat

网关运行时会每 30 分钟检查一次工作区中的 `HEARTBEAT.md`。如果文件中有可执行任务，Agent 会自动处理。

如果希望跳过 Heartbeat 请求，可以保持文件为空（或仅保留注释）。
