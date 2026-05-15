# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指引。

## 常用命令

- `npm run dev` — 启动 Vite 开发服务器（默认端口 5173）
- `npm run build` — TypeScript 检查 + Vite 生产构建
- `npm run preview` — 本地预览生产构建
- `npx tsc --noEmit` — 仅进行 TypeScript 类型检查

## 架构说明

TaskFlow 是一个单页 React + TypeScript + Vite 待办事项应用，所有应用逻辑集中在一个组件中。

**单组件设计**：整个应用在 `src/App.tsx` 中，样式使用 CSS Modules（`src/App.module.css`）。无路由、无组件拆分，状态管理、API 调用、渲染和日历逻辑全部在 `App` 函数内完成。

**状态管理**：使用 `useState` 管理所有状态。待办数据通过 `localStorage` 持久化，key 为 `todos`。`Todo` 接口字段：`id`、`text`、`done`、`important`、可选 `date`（YYYY-MM-DD）。

**视图切换**：`view` 状态（`'all' | 'important' | 'calendar'`）控制侧边栏当前激活的页面。日历视图渲染自定义月历网格；所有任务/重要视图渲染可筛选的任务列表。

**AI 功能**：`decomposeTask()` 函数调用 Mimo-v2.5-pro API（兼容 OpenAI 的 `/chat/completions` 接口），将用户输入的任务描述拆解为多个子任务。API 配置在 `.env` 中（`VITE_MIMO_API_KEY`、`VITE_MIMO_BASE_URL`），参考 `.env.example`。

**环境变量**：Vite 将 `VITE_` 前缀的环境变量暴露给客户端。类型声明在 `src/vite-env.d.ts` 的 `ImportMetaEnv` 接口中。

##
每次回答问题前都能喊我一声哥