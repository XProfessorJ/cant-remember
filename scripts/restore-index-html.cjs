const fs = require('fs');
const path = require('path');

const rootIndexPath = path.resolve(__dirname, '../index.html');
const backupPath = path.resolve(__dirname, '../index.html.backup');

if (fs.existsSync(backupPath)) {
  try {
    fs.renameSync(backupPath, rootIndexPath);
    console.log('✓ 已恢复根目录的 index.html');
  } catch (err) {
    console.error('✗ 恢复失败:', err);
    process.exit(1);
  }
} else {
  console.log('✓ 没有需要恢复的文件');
}

