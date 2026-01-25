# YD AI Mastra App - 项目文档

## 项目概述

这是一个基于 Mastra 框架构建的 AI 天气助手应用。该应用使用 TypeScript 开发，集成了 OpenAI GPT 模型，提供智能天气查询和活动规划功能。

### 主要技术栈

- **框架**: Mastra (AI Agent 框架)
- **语言**: TypeScript
- **运行时**: Node.js (>=20.9.0)
- **包管理**: pnpm
- **数据库**: LibSQL (内存存储)
- **AI 模型**: OpenAI GPT-4o-mini
- **外部 API**: Open-Meteo 天气 API

## 项目结构

```
src/mastra/
├── index.ts                 # Mastra 应用入口，注册工作流、智能体和评分器
├── agents/
│   └── weather-agent.ts     # 天气助手智能体
├── tools/
│   ├── weather-tool.ts      # 天气数据获取工具
│   └── weather-workflow-tool.ts # 天气工作流工具
├── workflows/
│   └── weather-workflow.ts  # 天气查询和活动规划工作流
└── scorers/
    └── weather-scorer.ts    # 智能体响应质量评分器
```

## 核心功能

### 1. 天气智能体 (Weather Agent)

位置: `src/mastra/agents/weather-agent.ts`

负责与用户交互，提供天气信息和活动建议。智能体具有以下特性：
- 使用 OpenAI GPT-4o-mini 模型
- 配置了记忆功能，可保存对话历史
- 集成了多个评分器来评估响应质量
- 能够处理非英语地名并自动翻译

### 2. 天气工作流 (Weather Workflow)

位置: `src/mastra/workflows/weather-workflow.ts`

包含两个主要步骤：
- **fetchWeather**: 获取指定城市的天气数据
- **planActivities**: 基于天气条件规划活动

工作流输出格式化的活动建议，包括：
- 天气摘要
- 上午/下午活动建议
- 室内备选方案
- 特殊注意事项

### 3. 工具集成

- **weather-tool**: 直接获取当前天气信息
- **weather-workflow-tool**: 获取天气预报并规划活动

### 4. 评分系统

位置: `src/mastra/scorers/weather-scorer.ts`

包含三个评分器：
- **toolCallAppropriatenessScorer**: 评估工具调用的准确性
- **completenessScorer**: 评估回答的完整性
- **translationScorer**: 评估非英语地名的翻译质量

## 构建和运行

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm run dev
```

### 构建项目

```bash
pnpm run build
```

### 启动应用

```bash
pnpm run start
```

## 开发约定

### 代码风格

- 使用 TypeScript 严格模式
- 遵循 ES2022 模块规范
- 代码注释使用中文，便于团队协作

### 环境要求

- Node.js >= 20.9.0
- 需要配置 OpenAI API 密钥

### 数据存储

- 开发环境使用内存存储 (`:memory:`)
- 生产环境可配置持久化存储 (`file:../mastra.db`)

## API 集成

### Open-Meteo 天气 API

应用使用 Open-Meteo API 获取天气数据：
- 地理编码 API: 获取城市坐标
- 天气预报 API: 获取当前天气和预报数据

### 天气代码映射

系统包含完整的 WMO 天气代码映射，支持：
- 晴天、多云、阴天
- 雾、雨、雪
- 雷暴等极端天气

## 扩展指南

### 添加新的智能体

1. 在 `src/mastra/agents/` 目录创建新文件
2. 使用 `Agent` 类创建智能体
3. 在 `src/mastra/index.ts` 中注册

### 添加新的工作流

1. 在 `src/mastra/workflows/` 目录创建工作流
2. 使用 `createWorkflow` 和 `createStep` 构建流程
3. 在 `src/mastra/index.ts` 中注册

### 添加新的评分器

1. 在 `src/mastra/scorers/` 目录创建评分器
2. 使用 `createScorer` 或内置评分器函数
3. 在智能体配置中添加评分器

## 监控和日志

- 使用 Pino 日志记录器
- 支持可观测性功能 (Observability)
- 默认日志级别: info
- 生产环境可调整日志级别

## 注意事项

1. **API 密钥**: 确保正确配置 OpenAI API 密钥
2. **网络访问**: 应用需要访问 Open-Meteo API
3. **内存使用**: 当前使用内存存储，重启后数据会丢失
4. **语言支持**: 智能体主要使用英语，但支持地名翻译

## 故障排除

### 常见问题

1. **找不到位置**: 检查城市名称拼写，支持非英语地名
2. **API 调用失败**: 检查网络连接和 API 密钥
3. **内存不足**: 考虑使用持久化存储

### 调试建议

- 检查日志输出获取错误信息
- 使用评分器评估响应质量
- 验证工作流步骤执行状态