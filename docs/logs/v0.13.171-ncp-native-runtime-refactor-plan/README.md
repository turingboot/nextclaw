# 迭代完成说明

本次迭代新增了一份更聚焦的方案文档：

- [NCP Native Runtime Refactor Plan](../../plans/2026-03-18-ncp-native-runtime-refactor-plan.md)

这份文档专门回答“怎么从 bridge runtime 演进到 fully NCP-native runtime”，并明确了一个硬约束：

- 当选择 `ncp` 链路时，除了存储层之外，更上的所有层都必须基于 NCP 体系实现

同时补充明确了“核心功能不变”的验收口径，特别点名了：

- `skill` / `tool` 体系不能遗漏
- context / prompt assembly 不能遗漏
- runtime policy / extension mechanism 不能遗漏
- session / memory / product semantics 不能在迁移中被降级

另外，这次也补充了“正式开始前的准备判断”，明确区分了：

- NCP 当前哪些基础已经足够
- 哪些 runtime-aware tool API、context pipeline、policy/hooks、skill 装配语义值得在第一版实现后再评估是否回沉

并进一步收敛了正式推进策略：

- 第一阶段默认直接基于 `DefaultNcpAgentRuntime` 实现 Nextclaw NCP-native runtime
- 不预设先新增一批 NCP 新积木
- 等 bridge runtime 被替换、第一版跑通后，再看哪些通用模式值得沉淀回 NCP

同时，这份文档也和已有方案建立了清晰关系：

- 它承接 [NCP 定位与愿景](../../designs/2026-03-17-ncp-positioning-and-vision.md)
- 它细化 [NCP Phase 2.5：Nextclaw Capability Assembly Plan](../../plans/2026-03-18-ncp-phase2-5-nextclaw-capability-assembly-plan.md) 之后的下一步
- 它把 bridge runtime 的临时角色和 native runtime 的终局角色彻底区分开

# 测试/验证/验收方式

本次为方案文档新增，不涉及代码路径变更。

已完成的验证：

- 文档路径与 Markdown 链接结构检查
- 文档内容与现有 phase 2.5 方案、定位文档的一致性检查

不适用项：

- `build` 不适用，未触达代码构建链路
- `lint` 不适用，未触达代码 lint 链路
- `tsc` 不适用，未触达 TypeScript 类型链路

# 发布/部署方式

本次无需发布部署。

如需团队同步，只需将该文档作为后续 native runtime 重构的统一参考方案即可。

# 用户/产品视角的验收步骤

1. 打开 [NCP Native Runtime Refactor Plan](../../plans/2026-03-18-ncp-native-runtime-refactor-plan.md)，确认文档主题聚焦在 bridge runtime 到 fully NCP-native runtime 的演进。
2. 确认文档已明确写出整体目标：选择 `ncp` 链路时，除存储层外，其余上层都必须基于 NCP。
3. 确认文档已说明它与 phase 2.5 方案、NCP 定位文档之间的关系，而不是孤立存在。
4. 确认文档已给出演进阶段、关键能力模块和最终验收口径。
