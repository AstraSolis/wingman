// 主进程入口
// 初始化应用，加载各个子模块

const { app } = require('electron');
const i18n = require('./src/main/i18n');
const windowManager = require('./src/main/windowManager');
const shortcutManager = require('./src/main/shortcutManager');
const trayManager = require('./src/main/trayManager');
const ipcHandlers = require('./src/main/ipcHandlers');

// 应用就绪后初始化
app.whenReady().then(() => {
  // 初始化 i18n（需要最先加载）
  i18n.init();

  // 创建主窗口
  windowManager.createWindow();

  // 注册全局快捷键
  shortcutManager.init();

  // 创建系统托盘
  trayManager.createTray();

  // 设置 IPC 处理器
  ipcHandlers.setup();

  console.log(i18n.t('app.started'));
});

// 所有窗口关闭时退出（Windows / Linux）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS 点击 dock 图标重新创建窗口
app.on('activate', () => {
  if (!windowManager.getWindow()) {
    windowManager.createWindow();
  }
});
