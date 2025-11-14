const { contextBridge } = require('electron');

// 暴露受保护的方法给渲染进程
// 如果需要，可以在这里添加 Electron API 的桥接
contextBridge.exposeInMainWorld('electronAPI', {
  // 示例：可以添加一些 Electron 相关的 API
  platform: process.platform,
  version: process.versions.electron,
});
