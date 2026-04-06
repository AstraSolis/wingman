// IPC 消息处理模块
// 处理渲染进程发来的 IPC 消息

const { app, ipcMain } = require('electron');

const AUTO_START_SUPPORTED_PLATFORMS = new Set(['win32', 'darwin']);
const { IPC_CHANNELS } = require('../common/constants');
const windowManager = require('./windowManager');
const i18n = require('./i18n');
const trayManager = require('./trayManager');
const configManager = require('./configManager');

/**
 * 设置所有 IPC 处理器
 */
function isAutoStartSupported() {
  return AUTO_START_SUPPORTED_PLATFORMS.has(process.platform);
}

function getAutoStartState() {
  if (!isAutoStartSupported()) {
    return false;
  }

  return app.getLoginItemSettings().openAtLogin;
}

function setup() {
  // 设置透明度
  ipcMain.on(IPC_CHANNELS.SET_OPACITY, (_event, opacity) => {
    windowManager.setWindowOpacity(opacity);
  });

  // 切换点击穿透
  ipcMain.on(IPC_CHANNELS.TOGGLE_CLICK_THROUGH, () => {
    windowManager.toggleIgnoreMouse();
  });

  // 隐藏窗口
  ipcMain.on(IPC_CHANNELS.HIDE_WINDOW, () => {
    windowManager.hideWindow();
  });

  // 加载 URL（渲染进程内部处理 webview，这里仅作备用）
  ipcMain.on(IPC_CHANNELS.LOAD_URL, (_event, url) => {
    const win = windowManager.getWindow();
    if (win) {
      win.webContents.send(IPC_CHANNELS.NAVIGATE_URL, url);
    }
  });

  // 获取初始状态（使用 handle 支持 invoke 调用）
  ipcMain.handle(IPC_CHANNELS.GET_INITIAL_STATE, () => {
    return {
      opacity: windowManager.getCurrentOpacity(),
      isClickThrough: windowManager.isClickThroughEnabled(),
      lastUrl: configManager.get('lastUrl')
    };
  });

  // 获取 i18n 翻译数据（渲染进程初始化时调用）
  ipcMain.handle(IPC_CHANNELS.GET_I18N_DATA, () => {
    return i18n.getAllTranslations();
  });

  // 切换语言
  ipcMain.handle(IPC_CHANNELS.SET_LOCALE, (_event, locale) => {
    i18n.setLocale(locale);
    // 重建托盘菜单
    trayManager.updateContextMenu();
    return i18n.getAllTranslations();
  });

  // 获取开机自启状态
  ipcMain.handle(IPC_CHANNELS.GET_AUTO_START, () => {
    return getAutoStartState();
  });

  // 设置开机自启状态
  ipcMain.handle(IPC_CHANNELS.SET_AUTO_START, (_event, enable) => {
    if (!isAutoStartSupported()) {
      return false;
    }

    app.setLoginItemSettings({
      openAtLogin: enable,
      path: process.execPath
    });
    return getAutoStartState();
  });

  // 保存最后访问的 URL
  ipcMain.on(IPC_CHANNELS.SAVE_LAST_URL, (_event, url) => {
    configManager.set('lastUrl', url);
  });

  // 获取用户数据（收藏和历史）
  ipcMain.handle(IPC_CHANNELS.GET_USER_DATA, () => {
    return {
      favorites: configManager.get('favorites') || [],
      history: configManager.get('history') || []
    };
  });

  // 保存收藏
  ipcMain.handle(IPC_CHANNELS.SAVE_FAVORITE, (_event, item) => {
    const favorites = configManager.get('favorites') || [];
    // 避免重复收藏
    if (!favorites.some(f => f.url === item.url)) {
      favorites.push({ ...item, timestamp: Date.now() });
      configManager.set('favorites', favorites);
    }
    return favorites;
  });

  // 移除收藏
  ipcMain.handle(IPC_CHANNELS.REMOVE_FAVORITE, (_event, url) => {
    let favorites = configManager.get('favorites') || [];
    favorites = favorites.filter(f => f.url !== url);
    configManager.set('favorites', favorites);
    return favorites;
  });

  // 添加历史记录
  ipcMain.on(IPC_CHANNELS.ADD_HISTORY, (_event, item) => {
    let history = configManager.get('history') || [];
    // 移除重复的，并将新的插在头部
    history = history.filter(h => h.url !== item.url);
    history.unshift({ ...item, timestamp: Date.now() });
    
    // 限制最大 100 条
    if (history.length > 100) {
      history = history.slice(0, 100);
    }
    configManager.set('history', history);
  });

  // 清除历史记录
  ipcMain.handle(IPC_CHANNELS.CLEAR_HISTORY, () => {
    configManager.set('history', []);
    return [];
  });

  // 获取启动配置
  ipcMain.handle(IPC_CHANNELS.GET_STARTUP_CONFIG, () => {
    return {
      startupPage: configManager.get('startupPage'),
      customStartupUrl: configManager.get('customStartupUrl'),
      closeStrategy: configManager.get('closeStrategy'),
      rememberWindowBounds: configManager.get('rememberWindowBounds')
    };
  });

  // 设置启动页面类型
  ipcMain.handle(IPC_CHANNELS.SET_STARTUP_PAGE, (_event, pageType) => {
    configManager.set('startupPage', pageType);
    return pageType;
  });

  // 设置自定义启动网址
  ipcMain.handle(IPC_CHANNELS.SET_CUSTOM_STARTUP_URL, (_event, url) => {
    configManager.set('customStartupUrl', url);
    return url;
  });

  // 设置关闭窗口策略
  ipcMain.handle(IPC_CHANNELS.SET_CLOSE_STRATEGY, (_event, strategy) => {
    configManager.set('closeStrategy', strategy);
    return strategy;
  });

  // 设置是否记忆窗口位置
  ipcMain.handle(IPC_CHANNELS.SET_REMEMBER_WINDOW_BOUNDS, (_event, remember) => {
    configManager.set('rememberWindowBounds', remember);
    return remember;
  });

  // 关闭窗口（根据策略执行退出或最小化）
  ipcMain.on(IPC_CHANNELS.CLOSE_WINDOW, () => {
    const strategy = configManager.get('closeStrategy');
    if (strategy === 'quit') {
      app.quit();
    } else {
      windowManager.hideWindow();
    }
  });

  console.log(i18n.t('ipc.ready'));
}

module.exports = {
  setup
};
