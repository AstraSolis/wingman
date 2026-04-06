// 窗口管理模块
// 创建和管理主窗口，包括透明度、穿透、显示/隐藏

const { BrowserWindow, screen } = require('electron');
const path = require('path');
const {
  DEFAULT_OPACITY,
  MIN_OPACITY,
  MAX_OPACITY,
  OPACITY_STEP,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  IPC_CHANNELS
} = require('../common/constants');
const configManager = require('./configManager');

const FORWARD_CLICK_THROUGH_PLATFORMS = new Set(['win32', 'darwin']);

let mainWindow = null;
let currentOpacity = DEFAULT_OPACITY;
let isClickThrough = false;

/**
 * 创建主窗口
 * 透明、无边框、置顶、不在任务栏显示
 */
function shouldForwardClickThrough() {
  return FORWARD_CLICK_THROUGH_PLATFORMS.has(process.platform);
}

function setClickThrough(enabled) {
  if (!mainWindow) return;

  const options = shouldForwardClickThrough() ? { forward: true } : undefined;
  mainWindow.setIgnoreMouseEvents(enabled, options);
}

function createWindow() {
  // 在初始化完 configManager 后，再获取持久化的状态
  currentOpacity = configManager.get('opacity') ?? DEFAULT_OPACITY;
  isClickThrough = configManager.get('isClickThrough') ?? false;

  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  // 获取保存的窗口位置和尺寸
  const rememberBounds = configManager.get('rememberWindowBounds') ?? true;
  const savedBounds = configManager.get('windowBounds');

  let windowOptions = {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    x: Math.round((screenWidth - DEFAULT_WIDTH) / 2),
    y: Math.round((screenHeight - DEFAULT_HEIGHT) / 2),
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: process.platform !== 'darwin',
    resizable: true,
    opacity: currentOpacity,
    hasShadow: process.platform === 'darwin',
    webPreferences: {
      preload: path.join(__dirname, '..', '..', 'preload.js'),
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  };

  // 如果启用了记忆功能且有保存的位置，则使用保存的位置
  if (rememberBounds && savedBounds) {
    windowOptions.x = savedBounds.x;
    windowOptions.y = savedBounds.y;
    windowOptions.width = savedBounds.width;
    windowOptions.height = savedBounds.height;
  }

  mainWindow = new BrowserWindow(windowOptions);

  mainWindow.webContents.on('did-attach-webview', (_event, guestContents) => {
    guestContents.setWindowOpenHandler(({ url }) => {
      if (!url || !/^https?:\/\//i.test(url)) {
        return { action: 'deny' };
      }

      mainWindow.webContents.send(IPC_CHANNELS.NAVIGATE_URL, url);
      return { action: 'deny' };
    });
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  // 恢复穿透状态（如果为 true 时需要显式设置）
  if (isClickThrough) {
    setClickThrough(true);
  }

  // 监听窗口移动和缩放事件，保存位置
  let boundsTimeout = null;
  const saveBounds = () => {
    if (!mainWindow) return;
    const rememberBounds = configManager.get('rememberWindowBounds') ?? true;
    if (rememberBounds) {
      const bounds = mainWindow.getBounds();
      configManager.set('windowBounds', bounds);
    }
  };

  mainWindow.on('move', () => {
    if (boundsTimeout) clearTimeout(boundsTimeout);
    boundsTimeout = setTimeout(saveBounds, 500);
  });

  mainWindow.on('resize', () => {
    if (boundsTimeout) clearTimeout(boundsTimeout);
    boundsTimeout = setTimeout(saveBounds, 500);
  });

  mainWindow.on('closed', () => {
    if (boundsTimeout) clearTimeout(boundsTimeout);
    mainWindow = null;
  });

  return mainWindow;
}

/**
 * 获取主窗口实例
 */
function getWindow() {
  return mainWindow;
}

/**
 * 设置窗口透明度
 * @param {number} opacity - 透明度值 (0.3 ~ 1.0)
 */
function setWindowOpacity(opacity) {
  if (!mainWindow) return;

  currentOpacity = Math.max(MIN_OPACITY, Math.min(MAX_OPACITY, opacity));
  mainWindow.setOpacity(currentOpacity);

  // 持久化保存透明度
  configManager.set('opacity', currentOpacity);

  // 通知渲染进程更新 UI
  mainWindow.webContents.send(IPC_CHANNELS.OPACITY_UPDATED, currentOpacity);
}

/**
 * 增加透明度（窗口变得更不透明）
 */
function increaseOpacity() {
  setWindowOpacity(currentOpacity + OPACITY_STEP);
}

/**
 * 减少透明度（窗口变得更透明）
 */
function decreaseOpacity() {
  setWindowOpacity(currentOpacity - OPACITY_STEP);
}

/**
 * 获取当前透明度
 */
function getCurrentOpacity() {
  return currentOpacity;
}

/**
 * 切换点击穿透模式
 */
function toggleIgnoreMouse() {
  if (!mainWindow) return;

  isClickThrough = !isClickThrough;
  setClickThrough(isClickThrough);

  // 持久化保存点击穿透状态
  configManager.set('isClickThrough', isClickThrough);

  // 通知渲染进程更新状态
  mainWindow.webContents.send(IPC_CHANNELS.CLICK_THROUGH_UPDATED, isClickThrough);

  return isClickThrough;
}

/**
 * 获取当前穿透状态
 */
function isClickThroughEnabled() {
  return isClickThrough;
}

/**
 * 隐藏窗口
 */
function hideWindow() {
  if (mainWindow && mainWindow.isVisible()) {
    mainWindow.hide();
  }
}

/**
 * 显示窗口
 */
function showWindow() {
  if (mainWindow && !mainWindow.isVisible()) {
    mainWindow.show();
  }
}

/**
 * 切换窗口显示/隐藏
 */
function toggleWindow() {
  if (!mainWindow) return;

  if (mainWindow.isVisible()) {
    hideWindow();
  } else {
    showWindow();
  }
}

module.exports = {
  createWindow,
  getWindow,
  setWindowOpacity,
  increaseOpacity,
  decreaseOpacity,
  getCurrentOpacity,
  toggleIgnoreMouse,
  isClickThroughEnabled,
  hideWindow,
  showWindow,
  toggleWindow
};
