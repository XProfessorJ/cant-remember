# Electron 应用验证指南

## 验证方法

### 方法 1：快速测试（推荐）

在打包之前，先测试构建后的应用是否能正常运行：

```bash
# 1. 构建前端代码
npm run build

# 2. 以生产模式运行 Electron（不使用开发服务器）
npm run electron:test
```

这会：
- 构建 React 应用
- 以生产模式启动 Electron
- 自动打开开发者工具（方便查看错误）
- 加载 `dist/index.html` 文件

### 方法 2：开发模式测试

```bash
# 启动 Vite 开发服务器 + Electron
npm run electron:dev
```

这会：
- 启动 Vite 开发服务器（http://localhost:5173）
- 等待服务器就绪后启动 Electron
- 在开发模式下运行（热重载）

### 方法 3：打包后测试

```bash
# 1. 构建并打包应用
npm run electron:build:mac

# 2. 运行打包后的应用
# macOS: 打开 release/mac-arm64/cant-remember-1.0.0-arm64.dmg
# 或直接运行: open release/mac-arm64/cant-remember.app
```

## 验证检查清单

### ✅ 1. 应用启动
- [ ] 应用窗口正常打开
- [ ] 窗口大小正确（1200x800）
- [ ] 窗口标题显示正确

### ✅ 2. 界面渲染
- [ ] 能看到导航栏
- [ ] 能看到主内容区域
- [ ] 没有白屏
- [ ] 样式正常显示

### ✅ 3. 功能测试
- [ ] 导航链接可以点击
- [ ] 路由切换正常
- [ ] 可以创建卡片
- [ ] 可以查看卡片列表
- [ ] 可以开始复习

### ✅ 4. 开发者工具检查
- [ ] 打开开发者工具（Cmd+Option+I 或 Ctrl+Shift+I）
- [ ] 查看 Console 标签页
- [ ] 没有红色错误信息
- [ ] 检查 Network 标签页，资源加载正常

### ✅ 5. 控制台输出检查
在终端中查看 Electron 主进程的日志：
- [ ] 显示 "Production mode: Loading index.html"
- [ ] 显示 "Successfully loaded index.html"
- [ ] 显示 "DOM ready"
- [ ] 显示 "Page loaded successfully"
- [ ] 显示 "Root element found, rendering App..."
- [ ] 显示 "App rendered successfully"

## 常见问题排查

### 问题 1：白屏
**原因**：JavaScript 加载失败或运行时错误

**排查步骤**：
1. 打开开发者工具（已自动打开）
2. 查看 Console 标签页的错误信息
3. 查看 Network 标签页，检查资源是否加载成功
4. 检查终端中的错误日志

**可能的原因**：
- 路径问题：资源文件路径不正确
- CORS 问题：文件协议下的安全限制
- 路由问题：HashRouter 配置问题
- 运行时错误：React 组件渲染错误

### 问题 2：资源加载失败
**检查**：
1. 确认 `dist/` 目录存在
2. 确认 `dist/assets/` 目录存在
3. 确认 `dist/index.html` 中的资源路径正确
4. 确认 Electron 主进程中的文件路径正确

### 问题 3：路由不工作
**检查**：
1. 确认使用的是 `HashRouter`（不是 `BrowserRouter`）
2. 确认 URL 中包含 `#`（如 `file:///path/to/index.html#/dashboard`）
3. 查看控制台是否有路由相关错误

## 调试技巧

### 1. 查看主进程日志
终端会显示 Electron 主进程的所有日志，包括：
- 文件加载路径
- 加载成功/失败信息
- 错误详情

### 2. 查看渲染进程日志
在开发者工具的 Console 标签页中查看：
- React 应用的日志
- 错误堆栈信息
- 网络请求信息

### 3. 检查网络请求
在开发者工具的 Network 标签页中查看：
- JavaScript 文件是否加载成功
- CSS 文件是否加载成功
- 其他资源是否加载成功

### 4. 检查元素
在开发者工具的 Elements 标签页中查看：
- `#root` 元素是否存在
- React 应用是否已渲染
- DOM 结构是否正确

## 测试命令总结

```bash
# 快速测试（构建 + 运行）
npm run electron:test

# 开发模式（热重载）
npm run electron:dev

# 打包应用
npm run electron:build:mac

# 运行打包后的应用（macOS）
open release/mac-arm64/cant-remember.app
```

## 预期结果

正常运行时，你应该看到：
1. Electron 窗口打开
2. 显示导航栏（仪表盘、卡片库、统计、设置）
3. 默认显示仪表盘页面
4. 可以点击导航链接切换页面
5. 开发者工具自动打开（用于调试）
6. 终端中显示成功加载的日志

## 如果仍然白屏

请提供以下信息：
1. 终端中的完整日志
2. 开发者工具 Console 中的错误信息
3. 开发者工具 Network 标签页中的资源加载状态
4. 开发者工具 Elements 标签页中的 DOM 结构

这样我可以帮你进一步排查问题。

