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

let mainWindow = null;
let currentOpacity = DEFAULT_OPACITY;
let isClickThrough = false;

/**
 * 创建主窗口
 * 透明、无边框、置顶、不在任务栏显示
 */
function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    x: Math.round((screenWidth - DEFAULT_WIDTH) / 2),
    y: Math.round((screenHeight - DEFAULT_HEIGHT) / 2),
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    opacity: currentOpacity,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, '..', '..', 'preload.js'),
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.on('closed', () => {
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
  mainWindow.setIgnoreMouseEvents(isClickThrough, { forward: true });

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
