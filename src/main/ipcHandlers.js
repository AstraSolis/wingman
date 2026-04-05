// IPC 消息处理模块
// 处理渲染进程发来的 IPC 消息

const { app, ipcMain } = require('electron');
const { IPC_CHANNELS } = require('../common/constants');
const windowManager = require('./windowManager');
const i18n = require('./i18n');
const trayManager = require('./trayManager');
const configManager = require('./configManager');

/**
 * 设置所有 IPC 处理器
 */
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
    return app.getLoginItemSettings().openAtLogin;
  });

  // 设置开机自启状态
  ipcMain.handle(IPC_CHANNELS.SET_AUTO_START, (_event, enable) => {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: process.execPath
    });
    return app.getLoginItemSettings().openAtLogin;
  });

  // 保存最后访问的 URL
  ipcMain.on(IPC_CHANNELS.SAVE_LAST_URL, (_event, url) => {
    configManager.set('lastUrl', url);
  });

  console.log(i18n.t('ipc.ready'));
}

module.exports = {
  setup
};
