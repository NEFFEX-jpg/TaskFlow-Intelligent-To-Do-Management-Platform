# TaskFlow

智能待办事项管理平台，基于 React + TypeScript + Vite 构建。支持 AI 任务拆解、日历视图、多维度筛选，开箱即用。

**在线访问：** https://neffex-jpg.github.io/TaskFlow-Intelligent-To-Do-Management-Platform/

## 功能特性

- **任务管理** — 创建、完成、标记重要、删除待办事项
- **AI 智能拆解** — 输入一句话描述，调用 Mimo-v2.5-pro 自动拆解为多个可执行的子任务
- **日历视图** — 自定义月历组件，按日期查看和管理任务，点击日期显示当日任务列表
- **多维度筛选** — 全部 / 进行中 / 已完成 三级筛选 + 关键词搜索
- **统计面板** — 实时展示总任务数、已完成数、重要任务数
- **本地持久化** — 数据存储在 localStorage，刷新不丢失

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 |
| 语言 | TypeScript 5.8 |
| 构建工具 | Vite 6 |
| 样式 | CSS Modules |
| 持久化 | localStorage |
| AI 接口 | Mimo-v2.5-pro（兼容 OpenAI Chat Completions） |

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

> AI 拆解功能依赖 Mimo API，未配置环境变量时该按钮将报错提示。其余功能不受影响。

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173`。

### 其他命令

```bash
npm run build       # TypeScript 检查 + Vite 生产构建
npm run preview     # 本地预览生产构建
npx tsc --noEmit    # 仅做类型检查
```

## 项目结构

```
├── src/
│   ├── App.tsx          # 应用主组件（状态管理、逻辑、渲染）
│   ├── App.module.css   # 组件样式（CSS Modules）
│   ├── main.tsx         # React 入口
│   └── vite-env.d.ts    # Vite 环境变量类型声明
├── .env.example         # 环境变量模板
├── index.html           # HTML 入口
├── package.json         # 依赖与脚本
├── tsconfig.json        # TypeScript 配置
└── vite.config.ts       # Vite 配置
```

## 使用说明

1. **添加任务** — 输入描述，选择日期和时间，点击「添加」
2. **AI 拆解** — 输入复杂任务描述，点击「AI 智能拆解」自动拆分为子任务
3. **标记重要** — 点击任务右侧的星标按钮，重要任务可在侧边栏「重要」视图中查看
4. **日历查看** — 切换至「日历」视图，按月浏览，点击日期查看当日任务
5. **搜索与筛选** — 顶部搜索框支持关键词搜索，任务列表支持全部/进行中/已完成筛选

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
