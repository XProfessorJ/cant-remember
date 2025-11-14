# Can't Remember - 基于艾宾浩斯遗忘曲线的智能学习工具

一个基于 React + TypeScript + Tailwind CSS 的智能学习工具，使用 SM-2 间隔重复算法帮助用户高效学习和记忆。

## 功能特性

### 核心功能
- ✅ 卡片管理（创建、编辑、删除、搜索）
- ✅ SM-2 间隔重复算法
- ✅ 复习界面和自评系统
- ✅ 本地数据存储（IndexedDB）
- ✅ 数据导出/导入

### 页面
- 📊 仪表盘 - 显示学习统计和待复习卡片
- 📚 卡片库 - 管理所有知识卡片
- 🔄 复习页面 - 专注复习模式
- 📈 统计页面 - 学习数据可视化
- ⚙️ 设置页面 - 数据管理和配置

## 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Zustand** - 状态管理
- **Dexie** - IndexedDB 封装
- **React Router** - 路由管理
- **Vite** - 构建工具

## 安装和运行

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 项目结构

```
cant-remember/
├── src/
│   ├── components/      # 组件
│   │   ├── ui/         # UI 基础组件
│   │   ├── CardForm.tsx
│   │   ├── CardItem.tsx
│   │   └── Layout.tsx
│   ├── pages/          # 页面
│   │   ├── Dashboard.tsx
│   │   ├── Cards.tsx
│   │   ├── Review.tsx
│   │   ├── Stats.tsx
│   │   └── Settings.tsx
│   ├── lib/            # 工具库
│   │   ├── db.ts       # 数据库
│   │   ├── sm2-algorithm.ts  # SM-2 算法
│   │   └── utils.ts    # 工具函数
│   ├── services/       # 服务层
│   │   └── cardService.ts
│   ├── store/          # 状态管理
│   │   └── cardStore.ts
│   ├── types/          # 类型定义
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## 核心算法

### SM-2 间隔重复算法

- **0-1分**：掌握差，重置间隔
- **2分**：一般掌握，缩短间隔
- **3-5分**：掌握良好，延长间隔

算法会根据用户的自评分数动态调整复习间隔，优化记忆效果。

## 开发计划

### Phase 1 - MVP 核心功能 ✅
- [x] 卡片 CRUD 操作
- [x] 基础复习算法
- [x] 简单的复习界面
- [x] 本地数据存储

### Phase 2 - 增强体验
- [ ] 文件附件支持（思维导图、录音）
- [ ] 数据统计可视化
- [ ] 通知提醒
- [ ] 周报生成

### Phase 3 - 高级功能
- [ ] 多设备同步
- [ ] 高级分析
- [ ] 社区分享

## 许可证

MIT

