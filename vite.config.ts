import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync, writeFileSync } from 'fs'

// Vite 插件：移除 HTML 中的 crossorigin 属性
function removeCrossorigin() {
  return {
    name: 'remove-crossorigin',
    closeBundle() {
      // 在所有 bundle 完成后执行
      const htmlPath = path.resolve(__dirname, 'dist/index.html')
      // 使用 process.nextTick 确保文件已完全写入
      process.nextTick(() => {
        try {
          const html = readFileSync(htmlPath, 'utf-8')
          // 移除所有 crossorigin 属性
          const newHtml = html.replace(/\s+crossorigin(=['"]?['"]?)?/gi, '')
          if (html !== newHtml) {
            writeFileSync(htmlPath, newHtml, 'utf-8')
            console.log('✓ Removed crossorigin attributes from index.html')
          }
        } catch (error) {
          // 文件可能不存在，忽略错误
        }
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), removeCrossorigin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './', // 使用相对路径，确保 Electron 可以正确加载资源
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
})

