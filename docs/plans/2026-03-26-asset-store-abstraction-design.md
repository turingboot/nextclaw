# Asset Store Abstraction Design

## Related Documents

- Previous design: [Chat Attachment Service Design](/Users/peiwang/Projects/nextbot/docs/plans/2026-03-26-chat-attachment-service-design.md)

## Goal

为 NextClaw/NCP 建立一个更通用、更轻量、可替换后端的受管文件抽象：

- 默认实现可以是本地存储
- 未来可以替换为云存储实现
- 上层依赖稳定抽象，不依赖真实文件路径
- Asset 层只负责“纳管进来”和“导出出去”
- 文件处理本身不属于 Asset 层

## Why

前一版设计虽然解决了“上传后不再长期保留 base64”和“消息层改为引用”的问题，但仍然存在两个方向性问题：

1. 设计中心仍然是 chat attachment，而不是更通用的受管文件抽象。
2. 容易继续把“读取、转换、解析、预处理”等能力挂到附件层，导致边界持续膨胀。

本次讨论后的结论是：

- 我们真正需要的是一个稳定的 Asset 抽象
- 本地路径只是某种 materialized file 形态，不是产品契约
- 一旦把 Asset 导出为普通文件，后续就应该全部复用现有文件处理方式，而不是继续在 Asset 层造新能力

## Decision

采用 `AssetStore` 抽象，并把核心能力严格收敛为三个方法：

- `put`
- `export`
- `stat`

对应语义：

- `put`：把外部文件、上传内容或 AI 产物纳入受管 Asset 空间
- `export`：把受管 Asset 复制到一个显式指定的普通文件路径
- `stat`：查询 Asset 元信息

除这三个核心原语外，Asset 层不再直接承担：

- 文本读取分页
- 文档解析
- 图片处理
- PDF 转 Word
- OCR
- 任意业务特化转换

这些能力都应在 `export` 后基于普通文件完成，产物再通过 `put` 回到 Asset 空间。

## Prompt Policy

本设计明确取消“文件正文自动注入 prompt”的默认机制。

统一规则：

- 文件消息只引用 `AssetRef`
- 不再按 `text-like` 与否自动把文件正文塞进模型上下文
- 不再保留“默认截取前 32KB 正文注入”这类策略
- 文件若需要被 AI 真正处理，必须先 `export` 成普通文件

原因：

- 32KB 注入本质上仍然是在把文件处理问题错误地塞回 prompt
- 小文件/大文件双轨行为会重新引入旧世界兼容逻辑
- “看起来模型看到了文件，其实只看到了前一段”的行为不可预测

因此，本次方案要求彻底统一：

- 不做默认正文注入
- 不保留 32KB 阈值策略
- 文件处理统一回到普通文件工作流

## Naming

### Core Terms

- `Asset`
- `AssetStore`
- `AssetRef`

### Core Operations

- `put`
- `export`
- `stat`

命名理由：

- `put` 比 `add` 更像“放入受管存储”
- `put` 比 `import` 更少方向歧义
- `export` 能清晰表达“从受管空间复制到外部普通路径”
- `stat` 是工程上稳定且低歧义的元信息读取命名

不采用：

- `add`
  - 过于泛化，像列表操作
- `import`
  - 容易产生“谁向谁 import”的方向歧义
- `ingest` / `materialize`
  - 语义准确但过重，不符合本项目追求的简单命名

## Abstraction Boundary

推荐接口形态：

```ts
type AssetRef = {
  uri: string;
};

type AssetMeta = {
  uri: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

type AssetPutInput =
  | {
      kind: "path";
      path: string;
      fileName?: string;
      mimeType?: string;
    }
  | {
      kind: "bytes";
      bytes: Uint8Array;
      fileName: string;
      mimeType?: string;
    };

interface AssetStore {
  put(input: AssetPutInput): Promise<AssetRef>;
  export(ref: AssetRef, targetPath: string): Promise<void>;
  stat(ref: AssetRef): Promise<AssetMeta | null>;
}
```

说明：

- `AssetRef` 必须是稳定逻辑引用，而不是物理路径
- `uri` 必须视为 opaque value，上层禁止解析其内部结构
- `targetPath` 必须由显式调用方提供，禁止隐式猜测落盘位置

## URI Contract

Asset 的身份必须与后端实现解耦。

因此：

- 不应再把 `local`、bucket、真实目录结构编码进上层契约
- 不应要求模型、prompt、UI 依赖真实路径
- `AssetRef.uri` 只表达“这是一个受管 Asset”

推荐原则：

- `uri` 由 `AssetStore` 生成
- 上层只透传、展示、回传，不自行拆解
- 本地实现和云实现共享同一逻辑引用模型

本设计不强制最终 URI 字符串格式，只强制其“opaque logical reference”属性。

## Backend Independence

默认可以先提供：

- `LocalAssetStore`

后续可以新增：

- `CloudAssetStore`

两者都必须满足同一接口：

- `put`
- `export`
- `stat`

语义保持一致，但内部实现可以不同：

- 本地实现：
  - `put` 可能是复制文件到受管目录
  - `export` 可能是从受管目录复制到目标路径
- 云实现：
  - `put` 可能是上传到对象存储
  - `export` 可能是下载后写入目标路径

上层不应感知这些差异。

## Processing Principle

文件处理能力不属于 Asset 层。

统一处理方式：

1. 输入文件先 `put` 成 Asset
2. 需要处理时，把 Asset `export` 到普通工作路径
3. AI 或工具以普通文件方式处理
4. 处理完成的产物重新 `put`
5. 聊天消息或 UI 再引用新的 Asset

这是本设计最重要的边界。

这意味着：

- Asset 层不提供“pdf_to_docx”
- Asset 层不提供“image_edit”
- Asset 层不提供“read next 32KB”

因为这些都可以在普通文件世界中完成。

## Scenario Coverage

### Image In, Image Out

用户上传一张图片：

1. 前端或服务端调用 `put`
2. 聊天消息只引用 `AssetRef`
3. AI 需要处理时，先 `export` 到工作路径
4. 使用普通脚本、CLI、库或现有工具处理图片
5. 生成结果图后，再次 `put`
6. 聊天中返回新的图片 Asset，并提供预览与下载

结果：

- 输入图片和输出图片都走同一套资产链路
- UI 可以像微信那样展示一张本地图并允许下载
- 但底层不需要在 Asset 层新增任何图片特化接口

### PDF To Word

用户上传 PDF：

1. PDF 进入 `AssetStore`
2. 需要转换时，先 `export` 到工作目录
3. 使用普通 PDF/Word 转换工具处理
4. 产出 `docx`
5. 通过 `put` 把 `docx` 纳管
6. 聊天里返回一个可下载的 Word 文件 Asset

结果：

- 大文件不需要进入 prompt
- 转换逻辑不污染 Asset 层
- 后续也可替换为其它普通文件处理链路

### Large Text Or Source Files

本设计不要求 Asset 层直接承担“大文本读取策略”。

若未来需要让 AI 读取大文本文件，可在普通文件工作流中解决：

- 先 `export`
- 再按普通文件方式读取、分页、检索或分块

这类能力属于 AI 工作流或工具链，不属于 AssetStore 本身。

这也意味着：

- 不再提供“小文本自动全文 inline”
- 不再提供“大文本默认截断 preview”
- 无论文件大小，统一遵守同一规则

## Message Contract Direction

聊天消息应引用 `AssetRef`，而不是物理路径。

原则：

- 用户消息中的文件 part 只保存受管文件引用和展示所需元数据
- 预览 URL、下载 URL 可以是派生视图
- 真正处理文件时，必须显式 `export`

这样可以保证：

- message contract 与 storage backend 解耦
- 本地与云后端都能复用同一消息结构
- 模型不需要知道真实存储路径

## Migration From Attachment Design

前一版 [Chat Attachment Service Design](/Users/peiwang/Projects/nextbot/docs/plans/2026-03-26-chat-attachment-service-design.md) 中，以下内容仍然可复用：

- 上传后返回稳定引用而不是长期保留完整 base64
- 服务端维护元数据与内容存储
- UI 通过独立内容地址做下载和预览

本次设计的变化在于：

- 从 `Attachment` 升级为更通用的 `Asset`
- 从“附件摄取层 + 附件处理倾向”收敛为“受管资产抽象”
- 不再把处理能力继续挂到附件/资产层
- 不再把 text-like 文件正文默认注入 prompt
- 彻底移除“前 32KB 自动进入上下文”的默认设计方向
- 强制把处理行为放回普通文件工作流

可以理解为：

- 前一版提供了本地受管文件雏形
- 本次设计重新定义了更清晰、更可扩展的系统边界

## Non-Goals

本设计明确不包含：

- Retrieval 设计
- OCR 设计
- PDF 解析设计
- 图片编辑能力设计
- 文本 chunking 设计
- 云存储具体供应商选型
- UI 具体交互细节

这些后续都可以建立在 `AssetStore` 抽象之上，但不属于本次方案范围。

## Recommendation

下一阶段实现应优先做最小闭环：

1. 把当前本地附件存储语义收敛为 `LocalAssetStore`
2. 对外统一为 `put / export / stat`
3. 聊天消息中的文件引用逐步迁移到通用 `AssetRef`
4. AI 文件处理流程统一改成：
   - 先 `export`
   - 再普通文件处理
   - 最后 `put`

只要这条主线建立起来，后续无论是本地实现、云实现、图片处理还是 PDF 转换，都可以在不破坏抽象边界的前提下继续扩展。
