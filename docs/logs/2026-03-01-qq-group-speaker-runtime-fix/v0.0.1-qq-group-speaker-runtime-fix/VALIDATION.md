# Validation

## 自动验证

```bash
PATH=/opt/homebrew/bin:$PATH pnpm build
PATH=/opt/homebrew/bin:$PATH pnpm lint
PATH=/opt/homebrew/bin:$PATH pnpm tsc
```

结果：

- `build` 通过。
- `lint` 通过（仅历史 warnings，无 errors）。
- `tsc` 通过。

## 冒烟测试

```bash
PATH=/opt/homebrew/bin:$PATH pnpm -C packages/extensions/nextclaw-channel-runtime exec tsx --eval "import { QQChannel } from './src/channels/qq.ts'; const bus={publishInbound: async ()=>{}} as any; const channel = new QQChannel({ appId:'a', secret:'b' } as any, bus); const tagged=(channel as any).decorateSpeakerPrefix({ content:'今晚发版吗', messageType:'group', senderId:'u123', senderName:'张三' }); const untagged=(channel as any).decorateSpeakerPrefix({ content:'私聊消息', messageType:'private', senderId:'u123', senderName:'张三' }); console.log(tagged); console.log(untagged);"
```

验收点：

1. 群消息输出应包含 `speaker:user_id=...` 前缀。
2. 私聊消息不应被强制添加该前缀。

冒烟结果：

- 输出 1：`[speaker:user_id=u123;name=张三] 今晚发版吗`
- 输出 2：`私聊消息`
