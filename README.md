# Wingman - 游戏攻略助手

Wingman 是一款专为 PC 游戏玩家打造的桌面辅助工具。它通过在屏幕顶层覆盖一个半透明、无边框的网页悬浮窗，让玩家在全屏或无边框窗口玩游戏时，能够随时无缝查看游戏攻略或视频。

## 核心特性

- **极致悬浮体验**：无边框窗口、始终置顶，运行时自动在任务栏隐藏（最小化至系统托盘）。
- **智能点击穿透**：开启穿透后，鼠标点击会直接传递到下方的游戏窗口中，完全不影响你的游戏操作。
- **平滑调节透明**：支持精细透明度控制（0.3 ~ 1.0），并在屏幕右下角触发丝滑的 OSD（屏显）提示。
- **全局热键控制**：无需切出游戏，按下快捷键即可一键显示/隐藏悬浮窗、调整透明度或切换穿透状态。
- **收藏与历史**：内置主页支持收藏常用攻略页面，自动记录浏览历史，快速访问常用内容。
- **灵活启动配置**：自定义启动页面（主页/上次页面/收藏夹/自定义网址），设置关闭策略和窗口位置记忆。
- **原生国际化 (i18n)**：支持多语言，自带中 (zh-CN) 英 (en-US) 引擎，可轻松扩展至其他语种。
- **跨平台支持**：完整支持 Windows、macOS 和 Linux 三大平台，自适应平台特性。
- **坚固的安全架构**：关闭 Node 渲染器集成，纯沙箱运行应用，通过 IPC + contextBridge 与渲染层安全通信。

## 快速上手

### 环境要求
- [Node.js](https://nodejs.org/) 22.12.0 或更高版本

### 安装与运行

```bash
# 1. 克隆或下载本仓库资源后，进入目录
cd wingman

# 2. 安装依赖包
npm install

# 3. 本地启动应用
npm start
```

### 构建打包

支持打包为各平台的安装包：

```bash
# 自动根据当前所处的操作系统进行打包
npm run dist
```

构建后的安装包会出现在根目录的 dist 文件夹中：
- **Windows**: NSIS 安装程序 (.exe)
- **macOS**: DMG 镜像文件 (.dmg)
- **Linux**: AppImage 可执行文件 (.AppImage)

## 默认快捷键指南

所有快捷键均设定为全局注册（即使你在游戏中也可以随时唤出）：

| 功能 | 快捷键 |
|---|---|
| **显示 / 隐藏助手** | `Ctrl/Cmd + Shift + H` |
| **切换鼠标点击穿透** | `Ctrl/Cmd + Shift + T` |
| **增加透明度 (变清晰)** | `Ctrl/Cmd + Shift + Up (上方向键)` |
| **降低透明度 (变透明)** | `Ctrl/Cmd + Shift + Down (下方向键)` |

> Windows/Linux 使用 `Ctrl`，macOS 使用 `Cmd`

## 目录结构

```text
wingman/
├── main.js                 # 核心：Electron 主进程入口
├── preload.js              # 安全：IPC 与 ContextBridge 预加载通信桥
├── package.json            # 依赖与打包配置文件
├── scripts/                # 脚本
├── src/
│   ├── main/               # 后端逻辑: 窗口、快捷键、系统托盘、配置管理等
│   ├── renderer/           # 前端渲染: 核心 UI、Webview 处理、主页、设置面板
│   ├── common/             # 公共库: 共享常量与多端共享工具函数
│   ├── locales/            # 语言包: JSON 国际化文本资源
│   └── assets/             # 静态资源: 托盘图标等
```

## 技术栈

- **前端**：HTML5, Vanilla JavaScript, CSS3
- **后端**：Node.js
- **框架体系**：[Electron](https://www.electronjs.org/)
- **打包工具**：[electron-builder](https://www.electron.build/)

## 许可证

本项目基于 MIT 协议开源 - 查看 LICENSE 文件了解更多详情。
