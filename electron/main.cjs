const { app, BrowserWindow, protocol, session } = require('electron');
const path = require('path');
const fs = require('fs');
// 注意：app.asar 是一个文件，不是目录
// Electron 内置了 asar 支持，fs.readFileSync 可以直接读取 asar 文件内的内容
// 路径格式：/path/to/app.asar/file 会被 Electron 自动处理

// 开发环境的判断
// 如果设置了 NODE_ENV=production，即使是未打包状态也使用生产模式
// 这样可以测试构建后的文件是否能正常工作
const isDev = process.env.NODE_ENV !== 'production' && (process.env.NODE_ENV === 'development' || !app.isPackaged);

// 在 app.whenReady() 之前注册自定义协议
// 这必须在 app 模块加载后立即执行
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      secure: true,
      standard: true,
      corsEnabled: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

function createWindow() {
  try {
    // 创建浏览器窗口
    // 在开发模式下，先隐藏窗口，等页面加载完成后再显示，避免白屏闪烁
    // 在生产模式下，立即显示窗口
    const mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      show: !isDev, // 开发模式先隐藏，等 ready-to-show 再显示；生产模式立即显示
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        // 禁用 webSecurity 以允许加载本地文件（Electron 桌面应用的标准做法）
        webSecurity: false,
        allowRunningInsecureContent: true,
        devTools: true,
      },
      titleBarStyle: 'default',
      backgroundColor: '#f9fafb',
    });
    
    // 在生产模式下，立即显示窗口
    if (!isDev && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.moveTop();
    }
    
    // 开发模式下打开开发者工具
    if (isDev) {
      setTimeout(() => {
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.openDevTools();
        }
      }, 100);
      
      // 如果开发者工具被关闭，自动重新打开
      mainWindow.webContents.on('devtools-closed', () => {
        setTimeout(() => {
          if (!mainWindow.isDestroyed()) {
            mainWindow.webContents.openDevTools();
          }
        }, 100);
      });
    }

  // 加载应用
  const loadApp = () => {
    if (isDev) {
      // 开发环境：加载 Vite 开发服务器
      mainWindow.loadURL('http://localhost:5173').then(() => {
        // 加载成功后确保窗口可见
        setTimeout(() => {
          if (!mainWindow.isDestroyed() && !mainWindow.isVisible()) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.moveTop();
          }
        }, 100);
      }).catch((error) => {
        console.error('✗✗✗ Failed to load Vite dev server ✗✗✗', error);
        // 显示错误页面，至少让用户看到窗口
        const errorHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Failed to Load</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  padding: 40px; 
                  background: #fff; 
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  margin: 0;
                }
                h1 { color: #e74c3c; }
                pre { 
                  background: #f5f5f5; 
                  padding: 20px; 
                  border-radius: 5px; 
                  white-space: pre-wrap;
                  max-width: 800px;
                }
                p { max-width: 800px; line-height: 1.6; }
              </style>
            </head>
            <body>
              <h1>❌ Failed to Load Development Server</h1>
              <p><strong>Error:</strong> Could not connect to Vite dev server at <code>http://localhost:5173</code></p>
              <p><strong>Possible causes:</strong></p>
              <ul>
                <li>Vite server is not running</li>
                <li>Vite server is running on a different port</li>
                <li>Network connection issue</li>
              </ul>
              <p><strong>Solution:</strong> Make sure Vite dev server is running by executing:</p>
              <pre>npm run dev</pre>
              <p>Or restart the development process:</p>
              <pre>npm run electron:dev</pre>
              <hr>
              <p><strong>Error details:</strong></p>
              <pre>${error.toString()}</pre>
            </body>
          </html>
        `;
        mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
        // 确保窗口显示
        mainWindow.show();
        mainWindow.focus();
        mainWindow.moveTop();
        mainWindow.webContents.openDevTools();
      });
    } else {
      // 生产环境：加载构建后的文件
      // electron-builder 将 dist/**/* 打包为 dist/ 目录
      const appUrl = 'app://dist/index.html';
      
      let indexPath;
      if (app.isPackaged) {
        indexPath = path.join(app.getAppPath(), 'dist/index.html');
      } else {
        indexPath = path.join(__dirname, '../dist/index.html');
      }
      
      if (!fs.existsSync(indexPath)) {
        console.error('✗ ERROR: index.html not found at:', indexPath);
        
        // 显示错误页面
        const errorHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>File Not Found</title>
              <style>
                body { font-family: Arial; padding: 40px; background: #fff; }
                h1 { color: red; }
                pre { background: #f0f0f0; padding: 20px; border-radius: 5px; }
              </style>
            </head>
            <body>
              <h1>File Not Found Error</h1>
              <p>index.html not found at:</p>
              <pre>${indexPath}</pre>
              <p>App path: ${app.getAppPath()}</p>
              <p>Is packaged: ${app.isPackaged}</p>
              <p>__dirname: ${__dirname}</p>
            </body>
          </html>
        `;
        mainWindow.webContents.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
        mainWindow.webContents.openDevTools();
        return;
      }
      
      mainWindow.loadURL(appUrl).catch((error) => {
        console.error('✗ Failed to load index.html:', error);
        
        // 显示错误页面
        const errorHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Load Error</title>
              <style>
                body { font-family: Arial; padding: 40px; background: #fff; }
                h1 { color: red; }
                pre { background: #f0f0f0; padding: 20px; border-radius: 5px; white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <h1>Failed to Load Page</h1>
              <p><strong>Error:</strong> ${error.message}</p>
              <p><strong>Path:</strong> ${indexPath}</p>
            </body>
          </html>
        `;
        mainWindow.webContents.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
        mainWindow.webContents.openDevTools();
      });
    }
  };
  
  // 页面准备就绪后显示窗口（开发模式）
  mainWindow.once('ready-to-show', () => {
    if (isDev) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.moveTop();
      
      if (process.platform === 'darwin') {
        mainWindow.showInactive();
        mainWindow.focus();
        try {
          app.focus();
        } catch (e) {
          // 忽略错误
        }
      }
    }
  });
  
  // 监听页面加载错误
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame) {
      console.error('✗ Failed to load page:', errorCode, errorDescription);
      console.error('  URL:', validatedURL);
      
      if (!mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.moveTop();
      }
      
      // 如果是开发模式且服务器未启动，显示错误页面
      if (isDev) {
        const errorHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Page Load Failed</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; background: #fff; }
                h1 { color: #e74c3c; }
                pre { background: #f5f5f5; padding: 20px; border-radius: 5px; }
              </style>
            </head>
            <body>
              <h1>❌ Page Load Failed</h1>
              <p><strong>Error Code:</strong> <code>${errorCode}</code></p>
              <p><strong>Description:</strong> ${errorDescription}</p>
              <p><strong>URL:</strong> <code>${validatedURL}</code></p>
              <hr>
              <p>If the Vite server is not running, start it with:</p>
              <pre>npm run dev</pre>
            </body>
          </html>
        `;
        mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
      }
      
      if (!mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.openDevTools();
      }
    }
  });
  
  // 监听页面崩溃
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('✗ Render process crashed:', details);
  });
  
  mainWindow.webContents.on('unresponsive', () => {
    console.error('✗ Page unresponsive');
  });
  
  // 加载应用
  try {
    loadApp();
  } catch (error) {
    console.error('✗ Error starting app load:', error);
    // 显示错误页面
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Startup Error</title>
          <style>
            body { font-family: Arial; padding: 40px; }
            h1 { color: red; }
            pre { background: #f0f0f0; padding: 20px; border-radius: 5px; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>Startup Error</h1>
          <pre>${error.toString()}\n\n${error.stack}</pre>
        </body>
      </html>
    `;
    mainWindow.webContents.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
  }

  // 返回窗口实例
  return mainWindow;
  
  } catch (error) {
    console.error('✗✗✗ Error creating window ✗✗✗', error);
    console.error(error.stack);
    throw error;
  }
}

// 注册自定义协议处理器（必须在 app.whenReady() 之后）
// 使用 registerBufferProtocol 以便能够处理 asar 文件内的内容
function setupProtocol() {
  protocol.registerBufferProtocol('app', (request, callback) => {
    try {
      // 解析 URL，移除 'app://' 前缀
      let url = request.url;
      const match = url.match(/^app:\/\/(.+)$/i);
      let urlPath = match && match[1] ? match[1] : url.replace(/^app:\/\/?/i, '');
      
      // 移除查询参数和锚点
      const queryIndex = urlPath.indexOf('?');
      const hashIndex = urlPath.indexOf('#');
      let cleanUrl = urlPath;
      if (queryIndex !== -1) {
        cleanUrl = cleanUrl.substring(0, queryIndex);
      }
      if (hashIndex !== -1 && (queryIndex === -1 || hashIndex < queryIndex)) {
        cleanUrl = cleanUrl.substring(0, hashIndex);
      }
      
      // 移除末尾斜杠
      while (cleanUrl.endsWith('/') && cleanUrl.length > 1) {
        cleanUrl = cleanUrl.substring(0, cleanUrl.length - 1);
      }
      
      let filePath;
      
      if (app.isPackaged) {
        // 打包后：从 app.asar 中加载
        // electron-builder 将 dist/**/* 打包为 dist/ 目录
        // 所以 dist/index.html -> app.asar/dist/index.html
        // dist/assets/xxx.js -> app.asar/dist/assets/xxx.js
        
        // 处理相对路径（如 ./assets/xxx.js）
        // 当 HTML 从 app://dist/index.html 加载时，./assets/xxx.js 会被解析为 app://dist/assets/xxx.js
        // 这是正确的，不需要修改
        
        // 如果 cleanUrl 以 ./ 开头，移除它（但保留 dist/ 前缀）
        if (cleanUrl.startsWith('./')) {
          cleanUrl = cleanUrl.substring(2);
        }
        
        // 如果 cleanUrl 为空或只是斜杠，默认为 dist/index.html
        if (!cleanUrl || cleanUrl === '/') {
          cleanUrl = 'dist/index.html';
        }
        
        // 如果 cleanUrl 不是以 dist/ 开头，且是 assets/，添加 dist/ 前缀
        if (!cleanUrl.startsWith('dist/') && cleanUrl.startsWith('assets/')) {
          cleanUrl = 'dist/' + cleanUrl;
        }
        
        const appPath = app.getAppPath();
        const fullAsarPath = path.join(appPath, cleanUrl);
        
        if (!fs.existsSync(appPath)) {
          console.error('✗ asar file does not exist:', appPath);
          callback({ error: -6 });
          return;
        }
        
        try {
          const fileBuffer = fs.readFileSync(fullAsarPath);
          
          if (!fileBuffer || fileBuffer.length === 0) {
            console.error('✗ File buffer is empty or null');
            callback({ error: -6 });
            return;
          }
          
          // 根据文件扩展名设置 MIME 类型
          const ext = path.extname(cleanUrl).toLowerCase();
          let mimeType = 'application/octet-stream';
          if (ext === '.html') {
            mimeType = 'text/html';
          } else if (ext === '.js' || ext === '.mjs') {
            mimeType = 'application/javascript';
          } else if (ext === '.css') {
            mimeType = 'text/css';
          } else if (ext === '.json') {
            mimeType = 'application/json';
          } else if (ext === '.svg') {
            mimeType = 'image/svg+xml';
          } else if (ext === '.png') {
            mimeType = 'image/png';
          } else if (ext === '.jpg' || ext === '.jpeg') {
            mimeType = 'image/jpeg';
          }
          
          callback({ mimeType, data: fileBuffer });
        } catch (readError) {
          console.error('✗ Error reading file from asar:', readError.message);
          console.error('  Path:', fullAsarPath);
          callback({ error: -6 });
        }
      } else {
        // 未打包：从项目根目录加载
        filePath = path.join(__dirname, '..', cleanUrl);
        filePath = path.normalize(filePath);
        
        try {
          if (!fs.existsSync(filePath)) {
            console.error('✗ File not found:', filePath);
            callback({ error: -6 });
            return;
          }
          
          const fileBuffer = fs.readFileSync(filePath);
          const ext = path.extname(cleanUrl).toLowerCase();
          
          // 根据文件扩展名设置 MIME 类型
          let mimeType = 'application/octet-stream';
          if (ext === '.html') {
            mimeType = 'text/html';
          } else if (ext === '.js' || ext === '.mjs') {
            mimeType = 'application/javascript';
          } else if (ext === '.css') {
            mimeType = 'text/css';
          } else if (ext === '.json') {
            mimeType = 'application/json';
          } else if (ext === '.svg') {
            mimeType = 'image/svg+xml';
          } else if (ext === '.png') {
            mimeType = 'image/png';
          } else if (ext === '.jpg' || ext === '.jpeg') {
            mimeType = 'image/jpeg';
          }
          
          callback({ mimeType, data: fileBuffer });
        } catch (error) {
          console.error('✗ Error reading file:', error);
          callback({ error: -2 });
        }
      }
    } catch (error) {
      console.error('✗ Protocol handler error:', error);
      callback({ error: -2 });
    }
  });
  
  if (!protocol.isProtocolRegistered('app')) {
    console.error('✗ Protocol "app" registration failed!');
  }
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用
app.whenReady().then(() => {
  // 注册自定义协议（必须在创建窗口之前）
  setupProtocol();
  
  // 设置全局请求拦截器
  const defaultSession = session.defaultSession;
  
  // 只在生产模式下注册请求拦截器（开发模式使用 http://localhost:5173）
  if (!isDev) {
    // 拦截 file:// 协议的请求，转换为 app:// 协议
    defaultSession.webRequest.onBeforeRequest(
      { urls: ['file://*/*'] },
      (details, callback) => {
        try {
          const url = new URL(details.url);
          const pathname = url.pathname;
          const distIndex = pathname.indexOf('/dist/');
          if (distIndex !== -1) {
            const relativePath = pathname.substring(distIndex + 1);
            callback({ redirectURL: `app://${relativePath}` });
            return;
          }
          callback({});
        } catch (error) {
          callback({});
        }
      }
    );
  }
  
  createWindow();

  // macOS 特定：当点击 dock 图标且没有其他窗口打开时，创建新窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      BrowserWindow.getAllWindows().forEach(win => {
        if (win && !win.isDestroyed()) {
          win.show();
          win.focus();
          win.moveTop();
        }
      });
    }
  });
});

// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 安全性：防止新窗口打开
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // 允许本地开发服务器、file:// 协议和自定义 app:// 协议
    const allowedOrigins = ['http://localhost:5173', 'file://', 'app://', 'null'];
    if (!allowedOrigins.some(origin => navigationUrl.startsWith(origin) || parsedUrl.origin === origin || parsedUrl.protocol === origin + ':')) {
      event.preventDefault();
    }
  });
  
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});
