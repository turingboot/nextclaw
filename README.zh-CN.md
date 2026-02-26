<div align="center">

# NextClaw

**功能完整、兼容 OpenClaw、以 UI 为先的轻量个人 AI 助手。**

[![npm](https://img.shields.io/npm/v/nextclaw)](https://www.npmjs.com/package/nextclaw)
[![Node](https://img.shields.io/badge/node-%3E%3D18-blue)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[English](README.md) | [简体中文](README.zh-CN.md)

[为什么选择 NextClaw？](#为什么选择-nextclaw) · [快速开始](#快速开始) · [功能](#功能) · [文档](https://docs.nextclaw.io/zh/)

</div>

---

## 为什么选择 NextClaw？

- **功能完整**：多 Provider、多渠道、Cron/Heartbeat、内置工具、多 Agent 路由。
- **OpenClaw 兼容**：插件 SDK 与渠道插件格式兼容 OpenClaw 生态。
- **上手简单**：`nextclaw start` 一条命令启动，后续在 UI 完成配置。
- **轻量易维护**：代码结构清晰、运行与维护成本低。

## 功能

- 多 Provider：OpenRouter、OpenAI、MiniMax、Gemini、DeepSeek、vLLM 等
- 多渠道：Telegram、Discord、Slack、飞书、钉钉、企业微信、WhatsApp、Email、QQ、Mochat
- 自动化：Cron + Heartbeat
- 本地工具：Web 搜索、命令执行、Memory、Subagents

## 快速开始

```bash
npm i -g nextclaw
nextclaw start
```

浏览器打开 **http://127.0.0.1:18791**，在 UI 中配置 Provider 与模型即可。

停止服务：

```bash
nextclaw stop
```

## 文档

- 中文文档入口：https://docs.nextclaw.io/zh/
- 快速开始：https://docs.nextclaw.io/zh/guide/getting-started
- 配置指南：https://docs.nextclaw.io/zh/guide/configuration
- 多 Agent 路由：https://docs.nextclaw.io/zh/guide/multi-agent
- 路线图：https://docs.nextclaw.io/zh/guide/roadmap

## 许可证

[MIT](LICENSE)
