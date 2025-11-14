const fs = require('fs');
const path = require('path');

const rootIndexPath = path.resolve(__dirname, '../index.html');
const backupPath = path.resolve(__dirname, '../index.html.backup');

console.log('=== 检查文件状态 ===');
console.log('根目录 index.html:', rootIndexPath, fs.existsSync(rootIndexPath) ? '存在' : '不存在');
console.log('dist/index.html:', path.resolve(__dirname, '../dist/index.html'), fs.existsSync(path.resolve(__dirname, '../dist/index.html')) ? '存在' : '不存在');

if (fs.existsSync(rootIndexPath)) {
  try {
    // 读取内容确认是源文件
    const content = fs.readFileSync(rootIndexPath, 'utf-8');
    if (content.includes('/src/main.tsx')) {
      console.log('⚠️  检测到根目录的 index.html（源文件）');
      // 备份并删除
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath); // 删除旧的备份
      }
      fs.copyFileSync(rootIndexPath, backupPath);
      fs.unlinkSync(rootIndexPath);
      console.log('✓ 已临时删除根目录的 index.html，避免与 dist/index.html 冲突');
    } else {
      console.log('✓ 根目录的 index.html 不是源文件，不需要处理');
    }
  } catch (err) {
    console.error('✗ 处理失败:', err);
    process.exit(1);
  }
} else {
  console.log('✓ 根目录没有 index.html');
}

// 验证 dist 目录存在
const distPath = path.resolve(__dirname, '../dist');
if (!fs.existsSync(distPath)) {
  console.error('✗ dist 目录不存在！');
  process.exit(1);
}
if (!fs.existsSync(path.join(distPath, 'index.html'))) {
  console.error('✗ dist/index.html 不存在！');
  process.exit(1);
}
console.log('✓ dist 目录和 dist/index.html 存在');
console.log('=== 检查完成 ===');

