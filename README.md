# TaskFlow

一个基于 React + TypeScript + Vite 构建的智能待办事项管理平台，支持 AI 任务拆解、日历视图和多维度筛选。

## 功能特性

- **任务管理** — 创建、完成、标记重要、删除待办事项
- **智能拆解** — 调用 Mimo AI 一键将复杂任务拆解为多个子任务
- **日历视图** — 自定义月历组件，按日期查看和管理任务
- **多维度筛选** — 全部 / 已完成 / 未完成 筛选 + 搜索
- **统计面板** — 实时展示任务总数、已完成、进行中
- **本地持久化** — 数据存储在 localStorage，刷新不丢失

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 |
| 语言 | TypeScript 5.8 |
| 构建工具 | Vite 6 |
| 样式 | CSS Modules |
| 持久化 | localStorage |
| AI 接口 | Mimo-v2.5-pro API（兼容 OpenAI Chat Completions） |

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env`，填入你的 API Key：

```bash
cp .env.example .env
```

```env
VITE_MIMO_API_KEY=your_api_key_here
VITE_MIMO_BASE_URL=https://api.mimo.com/v1
```

### 启动开发服务器

```bash
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`。

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

### 类型检查

```bash
npx tsc --noEmit
```

## 项目结构

```
├── src/
│   ├── App.tsx          # 应用主组件（状态管理、逻辑、渲染）
│   ├── App.module.css   # 组件样式（CSS Modules）
│   ├── main.tsx         # React 入口
│   └── vite-env.d.ts    # 环境变量类型声明
├── .env.example         # 环境变量模板
├── index.html           # HTML 入口
├── package.json         # 依赖与脚本
├── tsconfig.json        # TypeScript 配置
└── vite.config.ts       # Vite 配置
```

## 配色方案

| 颜色 | 用途 |
|------|------|
| `#1e1e2d` | 侧边栏背景 |
| `#f5a623` | 主色调（橙色） |
| `#4ecdc4` | 辅助色（青色） |
| `#7c5cbf` | 辅助色（紫色） |
| `#f0f2f5` | 页面背景 |

## License

MIT
