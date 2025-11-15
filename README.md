# Can't Remember - 基于SM2算法的智能学习工具

> 一个基于 React + Electron 的桌面学习应用，使用 SM-2 间隔重复算法帮助用户高效学习和记忆。

## 🎯 当前版本

**v1.0.0** - 桌面应用正式版

这是一个基于 Electron 打包的桌面应用程序，支持 macOS、Windows 和 Linux 三大平台。

### 核心功能

- ✅ 卡片管理（创建、编辑、删除、搜索）
- ✅ SM-2 间隔重复算法，智能安排复习时间
- ✅ 复习界面和自评系统
- ✅ 本地数据存储（IndexedDB），数据安全可靠
- ✅ 数据导出/导入功能
- ✅ 仪表盘统计和学习进度追踪
- ✅ 美观现代的 UI 界面

## 📥 下载安装

> **📦 所有版本下载**：访问 [GitHub Releases](https://github.com/XProfessorJ/cant-remember/releases) 获取最新版本和所有平台的安装包。

根据您的操作系统选择对应的安装包：

### 🍎 macOS (Apple Silicon / M1/M2/M3)

**方式一：DMG 安装包（推荐）**
- 下载：[Can't Remember-1.0.0-arm64.dmg](https://github.com/XProfessorJ/cant-remember/releases)
- 双击打开 DMG 文件
- 将应用拖拽到 Applications 文件夹
- 在应用程序中找到 "Can't Remember" 并启动

**方式二：ZIP 压缩包**
- 下载：[Can't Remember-1.0.0-arm64-mac.zip](https://github.com/XProfessorJ/cant-remember/releases)
- 解压 ZIP 文件
- 双击 `Can't Remember.app` 启动应用

> **注意**：macOS 可能会提示"无法打开，因为无法验证开发者"。如果遇到此问题：
> 1. 打开"系统设置" > "隐私与安全性"
> 2. 找到"已阻止使用"Can't Remember"因为无法验证开发者"的提示
> 3. 点击"仍要打开"

### 🪟 Windows

**安装程序（推荐）**
- 下载：[Can't Remember Setup 1.0.0.exe](https://github.com/XProfessorJ/cant-remember/releases)

- 双击运行安装程序
- 按照向导完成安装
- 从开始菜单或桌面快捷方式启动应用

> **系统要求**：Windows 10 或更高版本（64位）

### 🐧 Linux

**AppImage（便携式）**
- 下载：[Can't Remember-1.0.0.AppImage](https://github.com/XProfessorJ/cant-remember/releases)
- 赋予执行权限：
  ```bash
  chmod +x "Can't Remember-1.0.0.AppImage"
  ```
- 双击运行或使用命令行：
  ```bash
  ./Can't\ Remember-1.0.0.AppImage
  ```

> **系统要求**：主流 Linux 发行版（Ubuntu 18.04+, Fedora, Arch Linux 等）

## 🚀 开发模式

如果您是开发者，想要从源码运行或参与开发：

### 环境要求

- Node.js 18+ 
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### Web 开发模式

```bash
npm run dev
```

在浏览器中打开 `http://localhost:5173`

### Electron 开发模式

同时启动 Vite 开发服务器和 Electron 应用：

```bash
npm run electron:dev
```

### 构建生产版本

**构建 Web 版本：**
```bash
npm run build
```

**构建 Electron 应用：**
```bash
# macOS
npm run electron:build:mac

# Windows
npm run electron:build:win

# Linux
npm run electron:build:linux

# 所有平台
npm run electron:build
```

构建完成后，安装包位于 `release/` 目录。

## 📚 使用指南

### 首次使用

1. 启动应用后，您会看到仪表盘界面
2. 点击"卡片库"开始创建您的第一张学习卡片
3. 在卡片库中管理所有知识卡片
4. 当有卡片需要复习时，进入"复习"页面进行复习
5. 使用自评系统（0-5分）评估掌握程度
6. 系统会根据 SM-2 算法自动安排下一次复习时间

### SM-2 算法说明

- **0-1分**：掌握差，重置间隔，需要频繁复习
- **2分**：一般掌握，缩短间隔
- **3-5分**：掌握良好，延长间隔，减少复习频率

### 数据管理

- 所有数据存储在本地，无需担心隐私问题
- 在"设置"页面可以导出/导入数据
- 支持 JSON 格式的数据备份和恢复

## 🛠️ 技术栈

### 前端
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Zustand** - 状态管理
- **React Router** - 路由管理
- **Vite** - 构建工具

### 桌面应用
- **Electron** - 跨平台桌面应用框架
- **electron-builder** - 应用打包工具

### 数据存储
- **Dexie** - IndexedDB 封装库

## 📁 项目结构

```
cant-remember/
├── src/                    # 源代码
│   ├── components/         # 组件
│   ├── pages/              # 页面
│   ├── lib/                # 工具库（数据库、算法等）
│   ├── services/           # 服务层
│   ├── store/              # 状态管理
│   └── types/              # 类型定义
├── electron/               # Electron 主进程文件
│   ├── main.cjs           # 主进程入口
│   └── preload.cjs        # 预加载脚本
├── scripts/                # 构建脚本
├── release/                # 打包后的安装包
└── dist/                   # 构建输出目录
```

## 📄 许可证

MIT License

## 👨‍💻 作者

Jimmy Xu

---

**享受学习，记住一切！** 🎓
