const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '../dist/index.html');

try {
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf-8');
    const originalHtml = html;
    // 移除所有 crossorigin 属性
    html = html.replace(/\s+crossorigin(=['"]?['"]?)?/gi, '');
    // 确保 DOCTYPE 是大写的
    html = html.replace(/<!doctype/gi, '<!DOCTYPE');
    if (html !== originalHtml) {
      fs.writeFileSync(htmlPath, html, 'utf-8');
      console.log('✓ Removed crossorigin attributes and fixed DOCTYPE in index.html');
    }
  } else {
    console.warn('index.html not found at:', htmlPath);
  }
} catch (error) {
  console.error('Failed to process index.html:', error);
  process.exit(1);
}

